# PulseMIDI — Technical Specification

**Version:** 0.1.0  
**Target platform:** macOS 12+  
**Last updated:** 2026-05-22

---

## 1. Purpose & Goals

PulseMIDI is a native desktop application that gives musicians, producers, and audio engineers a real-time window into MIDI data flowing through their system. It is not a DAW, not a virtual instrument, and not a MIDI router — it is a **diagnostic and monitoring tool**.

### Primary goals

1. **Zero-latency monitoring** — MIDI events must appear in the UI within one animation frame (≤ 16 ms) of being received by the operating system.
2. **100 % offline** — no telemetry, no accounts, no network calls of any kind.
3. **No Web MIDI dependency** — Tauri's WKWebView does not expose `navigator.requestMIDIAccess`; all MIDI access is handled natively in Rust via CoreMIDI.
4. **Accurate diagnostics** — automatically surface actionable problems (stuck notes, CC flooding, sustained pedal left on) without requiring the user to interpret raw hex.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  macOS CoreMIDI                     │
│   (kernel-level MIDI graph, hardware abstraction)   │
└──────────────────────┬──────────────────────────────┘
                       │  MIDIInput callback (Rust thread)
┌──────────────────────▼──────────────────────────────┐
│              Rust Backend  (src-tauri/src/lib.rs)   │
│                                                     │
│  midir::MidiInputConnection  ×N ports               │
│  → serialise to MidiMessagePayload (serde_json)     │
│  → app.emit("midi-message", payload)                │
└──────────────────────┬──────────────────────────────┘
                       │  Tauri IPC (async, thread-safe)
┌──────────────────────▼──────────────────────────────┐
│         TypeScript Frontend  (Vite + React)         │
│                                                     │
│  midiService.ts  — listen / invoke wrappers         │
│  midiParser.ts   — status byte → MidiEvent          │
│  midiStore.ts    — Zustand reactive state           │
│  React components — render on state change          │
└─────────────────────────────────────────────────────┘
```

### Thread model

| Thread                   | Owner         | Responsibility                            |
| ------------------------ | ------------- | ----------------------------------------- |
| CoreMIDI callback thread | macOS         | Delivers raw MIDI bytes to midir callback |
| Rust IPC thread          | Tauri runtime | Serialises and emits payloads to frontend |
| Main (JS) thread         | WKWebView     | Runs React, Zustand, all UI logic         |

---

## 3. Rust Backend

### 3.1 Commands (Tauri IPC)

All commands are registered with `tauri::generate_handler!` and called from TypeScript via `invoke()`.

| Command                      | Arguments                                            | Returns                             | Description                                           |
| ---------------------------- | ---------------------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| `list_midi_inputs`           | —                                                    | `Vec<MidiPortInfo>`                 | Probe CoreMIDI for available ports without connecting |
| `connect_all_midi_inputs`    | `AppHandle`, `State<MidiState>`                      | `Result<Vec<MidiPortInfo>, String>` | Open all ports; start emitting `midi-message` events  |
| `connect_midi_input`         | `port_index: usize`, `AppHandle`, `State<MidiState>` | `Result<MidiPortInfo, String>`      | Open a single port by index                           |
| `disconnect_all_midi_inputs` | `State<MidiState>`                                   | `Result<(), String>`                | Drop all active `MidiInputConnection` objects         |

### 3.2 Event payload (`midi-message`)

```rust
#[derive(Serialize, Clone)]
struct MidiMessagePayload {
    device_id:   String,   // "port-{index}"
    device_name: String,   // CoreMIDI port display name
    timestamp:   f64,      // µs since device open (midir u64 cast to f64)
    data:        Vec<u8>,  // raw MIDI bytes (1–3 bytes typical)
}
```

> **Note on timestamp:** The Rust timestamp is discarded by the frontend (`midiService.ts` replaces it with `Date.now()`) to keep all time comparisons in consistent epoch-millisecond space.

### 3.3 State management

`MidiState` holds a `Vec<midir::MidiInputConnection<()>>`. Connections are stored to prevent the MIDI thread from being dropped. Clearing the `Vec` closes all connections.

```rust
pub struct MidiState {
    connections: Vec<midir::MidiInputConnection<()>>,
}
```

---

## 4. Frontend Architecture

### 4.1 Service layer — `midiService.ts`

Thin singleton that:

- subscribes to the `midi-message` Tauri event stream via `listen()`
- translates `TauriMidiPort[]` → `MidiDevice[]`
- forwards parsed `MidiEvent` objects to the Zustand store via callbacks
- exposes `selectAll()`, `selectDevice(id)`, and `dispose()` for lifecycle management

### 4.2 Parser — `midiParser.ts`

Pure function `parseMidiMessage(data, timestamp, deviceId, deviceName) → MidiEvent`.

Handles all standard MIDI 1.0 status bytes:

| Status byte             | Type              | Notes                                               |
| ----------------------- | ----------------- | --------------------------------------------------- |
| `0x80` / `0x90` + vel=0 | `noteOff`         | Running-status note-off via zero velocity           |
| `0x90`                  | `noteOn`          |                                                     |
| `0xA0`                  | `aftertouch`      | Per-note pressure                                   |
| `0xB0`                  | `controlChange`   | Controller number + value                           |
| `0xC0`                  | `programChange`   | Program number only                                 |
| `0xD0`                  | `channelPressure` | Channel-wide pressure                               |
| `0xE0`                  | `pitchBend`       | 14-bit signed value decoded via `decodePitchBend()` |
| `0xF8`                  | `clock`           | MIDI timing clock (24 ppqn)                         |
| `0xFE`                  | `activeSensing`   | Keep-alive byte                                     |
| anything else           | `unknown`         | Passed through with raw data                        |

### 4.3 State — `midiStore.ts` (Zustand)

```typescript
interface MidiStore {
  midiReady: boolean;
  midiError: string | null;
  devices: MidiDevice[];
  selectedDeviceId: string | null;
  events: MidiEvent[]; // max 500, FIFO eviction
  isPaused: boolean;
  activeNotes: Map<number, MidiEvent>; // midi note → noteOn event
  ccValues: Map<number, number>; // cc number → last value (0–127)
  diagnostics: DiagnosticsState;
}
```

#### Diagnostics auto-computation

`updateDiagnostics()` runs synchronously on every `addEvent()` call:

| Diagnostic        | Logic                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| **Stuck notes**   | Any entry in `activeNotes` where `Date.now() - event.timestamp > 8000` |
| **CC spam**       | ≥ 8 messages for the same CC number within any 200 ms window           |
| **Sustain pedal** | CC 64 value ≥ 64 → pedal down                                          |
| **Event Δt**      | `current.timestamp - prev.lastEventTime` (ms)                          |

---

## 5. Component Map

```
App.tsx
└── Dashboard.tsx
    ├── RoutingVisualization     Signal-flow header bar
    ├── [left col]
    │   ├── DeviceManager        Port list + connect/select
    │   └── DiagnosticsPanel     Stuck notes, CC spam, sustain, Δt
    ├── [centre]
    │   └── MidiMonitor          Scrolling event log (clock/activeSensing filtered)
    ├── [right col]
    │   └── CcSliders            Live CC value bars
    └── PianoKeyboard            88 keys, velocity glow
```

---

## 6. Data Types

### `MidiEvent`

```typescript
interface MidiEvent {
  id: string; // "evt-{timestamp}-{counter}"
  timestamp: number; // Date.now() ms when received on frontend
  type: MidiMessageType;
  channel: number; // 1–16 (0 for system messages)
  rawData: number[];
  deviceId: string;
  deviceName: string;
  // Optional — present depending on type:
  note?: number;
  noteName?: string;
  velocity?: number;
  controller?: number;
  controllerName?: string;
  value?: number;
  bendValue?: number; // –8192 to +8191
  program?: number;
}
```

### `MidiDevice`

```typescript
interface MidiDevice {
  id: string; // "port-{index}"
  name: string;
}
```

---

## 7. Build Configuration

| Setting              | Value                         |
| -------------------- | ----------------------------- |
| Window size          | 1280 × 820                    |
| Minimum window size  | 960 × 640                     |
| Vite dev port        | 1420                          |
| Rust edition         | 2021                          |
| Tauri version        | 2.x                           |
| midir version        | 0.10                          |
| Tailwind CSS version | 4.x (`@import "tailwindcss"`) |

---

## 8. Known Limitations & Roadmap

| Item                             | Status                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS only (CoreMIDI)            | Current. Linux/Windows via midir feature flags planned.                                                                                                                                                                                                                                                               |
| MIDI output / routing            | Not implemented. Read-only monitor only.                                                                                                                                                                                                                                                                              |
| MIDI file recording              | Not implemented.                                                                                                                                                                                                                                                                                                      |
| Virtual MIDI ports               | Not supported yet.                                                                                                                                                                                                                                                                                                    |
| SysEx messages                   | Parsed as `unknown`; full SysEx display planned.                                                                                                                                                                                                                                                                      |
| MPE (MIDI Polyphonic Expression) | Not supported.                                                                                                                                                                                                                                                                                                        |
| MIDI 2.0 / UMP                   | Not supported.                                                                                                                                                                                                                                                                                                        |
| **Transpose display** (v1.2)     | Planned. Musician plays in key X; app detects chords and optionally re-displays them transposed into a target key (e.g. E→G). Useful for teaching: student sees chord names in their preferred key while the performer plays in another. UI: a ±12 semitone offset picker in the Settings modal or live-view toolbar. |
