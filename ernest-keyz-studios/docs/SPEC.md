# PulseMIDI — Technical Specification

**Ernest Keyz Studios · v1.1.0**

---

## 1. Overview

PulseMIDI is a zero-latency MIDI monitoring, visualization, and chord-detection system
distributed as:

- **Standalone desktop app** — Tauri v2 (Rust backend + React/TypeScript frontend)
- **VST3 audio plugin** — nih-plug framework with Vizia GUI
- **CLAP audio plugin** — same plugin, different format

---

## 2. Platform support

| Platform  | Architecture        | Status                            |
| --------- | ------------------- | --------------------------------- |
| macOS 11+ | Intel x86_64        | ✅ Supported                      |
| macOS 11+ | Apple Silicon arm64 | ✅ Supported (native, no Rosetta) |
| macOS 11+ | Universal binary    | ✅ Distributed                    |
| Windows   | x86_64              | 🔜 Planned                        |
| Linux     | x86_64              | 🔜 Planned                        |

Universal binaries (fat Mach-O) are produced by building each target separately
and combining with `lipo`.

---

## 3. Architecture

### 3.1 Standalone app

```
┌─────────────────────────────────────────────────┐
│  Tauri v2 shell (Rust)                          │
│  ┌──────────────────┐   ┌─────────────────────┐ │
│  │  midir backend   │──▶│  IPC: midi-message  │ │
│  │  (MIDI input)    │   │  event (Tauri emit) │ │
│  └──────────────────┘   └──────────┬──────────┘ │
└─────────────────────────────────────┼───────────┘
                                      │
┌─────────────────────────────────────▼───────────┐
│  React + TypeScript (Vite, Tailwind CSS v4)     │
│  ┌───────────────┐   ┌──────────────────────┐   │
│  │  midiService  │──▶│  Zustand store       │   │
│  │  (listen)     │   │  (midiStore.ts)      │   │
│  └───────────────┘   └──────────┬───────────┘   │
│                                  │               │
│    Dashboard ◀───────────────────┤               │
│    PerformanceView ◀─────────────┘               │
└─────────────────────────────────────────────────┘
```

### 3.2 VST3 / CLAP plugin

```
┌───────────────────────────────────────────┐
│  nih-plug (Rust)                          │
│  ┌──────────────┐   ┌───────────────────┐ │
│  │  process()   │──▶│  AtomicPluginState│ │
│  │  (audio/MIDI │   │  notes_lo/hi: u64 │ │
│  │   thread)    │   │  pitch_bend: i32  │ │
│  └──────────────┘   │  cc: [u8; 128]    │ │
│                      └────────┬──────────┘ │
└───────────────────────────────┼────────────┘
                                 │ atomic reads (lock-free)
┌───────────────────────────────▼────────────┐
│  nih-plug-vizia (GUI thread)               │
│  ┌──────────────────────────────────────┐  │
│  │  cx.spawn() proxy → UiEvent::Tick    │  │
│  │  every 33 ms                         │  │
│  │  ┌────────────┐  ┌─────────────────┐ │  │
│  │  │ WheelCanvas│  │  PianoKeys view │ │  │
│  │  │ (femtovg)  │  │  (femtovg)      │ │  │
│  │  └────────────┘  └─────────────────┘ │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## 4. Data flow

### MIDI event pipeline (standalone)

1. `midir` library receives raw MIDI bytes from OS MIDI subsystem
2. Tauri backend emits `"midi-message"` event with `{ deviceId, deviceName, timestamp, data: [u8] }`
3. `midiService.ts` receives event, parses bytes → `MidiEvent` struct
4. `midiService` calls `onEvent` callback → Zustand store update
5. React components re-render via Zustand subscriptions

### MIDI state pipeline (VST/CLAP plugin)

1. DAW calls `process()` on audio thread with `NoteEvent`s and CC events
2. Plugin writes to `AtomicPluginState` (lock-free)
3. GUI thread background proxy sends `UiEvent::Tick` every 33 ms
4. Tick handler reads atomics → updates `UiModel` lenses → Vizia re-renders

---

## 5. State management (standalone)

### Zustand store (`midiStore.ts`)

| Field              | Type                  | Description                                     |
| ------------------ | --------------------- | ----------------------------------------------- |
| `events`           | `MidiEvent[]`         | Circular buffer of recent MIDI events (max 500) |
| `activeNotes`      | `Map<number, number>` | note → velocity for all currently held notes    |
| `devices`          | `MidiDevice[]`        | Connected MIDI input devices                    |
| `selectedDeviceId` | `string \| null`      | Currently filtered device                       |
| `diagnostics`      | `DiagnosticsState`    | Stuck notes, CC spam, sustain, latency          |
| `activeKeyColor`   | `string`              | Hex color for piano key highlights              |
| `isPaused`         | `boolean`             | Whether the MIDI monitor log is paused          |
| `midiReady`        | `boolean`             | Whether MIDI access has been granted            |
| `midiError`        | `string \| null`      | Last MIDI initialization error                  |

---

## 6. Chord detection

Implemented in `src/utils/chordDetection.ts`.

### Algorithm

1. Collect all currently active MIDI note numbers.
2. Map to pitch classes (note mod 12).
3. For each pitch class as potential root, compute interval set relative to root.
4. Match against chord template dictionary (see `docs/CHORDS.md`).
5. Return best match (root name + quality string) or "cluster" if no match.

### Supported chord types

Major, minor, dominant 7th, major 7th, minor 7th, diminished, augmented, sus2, sus4,
add9, 6th, 9th, 11th, 13th, half-diminished, diminished 7th, and enharmonic equivalents.

---

## 7. Plugin atomic state (`AtomicPluginState`)

```rust
pub struct AtomicPluginState {
    pub notes_lo:   AtomicU64,   // bits 0–63  → MIDI notes 0–63  (1=held)
    pub notes_hi:   AtomicU64,   // bits 0–63  → MIDI notes 64–127
    pub pitch_bend: AtomicI32,   // raw 14-bit bend value (-8192..8191)
    pub bpm_raw:    AtomicU32,   // BPM × 100 (e.g. 12000 = 120.00 BPM)
    pub cc:         [AtomicU8; 128], // last received value for each CC
}
```

All reads/writes use `Ordering::Relaxed` — correctness is achieved by the 33 ms
polling interval rather than strict ordering guarantees.

---

## 8. Build system

### Standalone

```bash
npm run tauri build -- --target universal-apple-darwin
# Output: src-tauri/target/universal-apple-darwin/release/bundle/macos/PulseMIDI.app
```

### VST3 / CLAP

```bash
cd vst
cargo run -p xtask -- bundle pulsemidi-vst --release --target <arch>
# lipo merge done by ernest-keyz-studios/build/build-universal.sh
```

### Installer

```bash
cd ernest-keyz-studios/build
./build-universal.sh   # compiles + lipo merges
./create-installer.sh  # produces dist/PulseMIDI-1.1.0-macOS.pkg
```

---

## 9. Dependencies

### Rust (plugin + Tauri backend)

| Crate          | Version      | Purpose                              |
| -------------- | ------------ | ------------------------------------ |
| nih-plug       | git f36931f7 | VST3/CLAP plugin framework           |
| nih-plug-vizia | same         | Vizia GUI integration                |
| vizia          | git e3fab55  | Immediate-mode GUI, femtovg renderer |
| midir          | latest       | macOS CoreMIDI bindings              |
| tauri          | 2.x          | Desktop app shell                    |

### JavaScript / TypeScript (standalone frontend)

| Package         | Purpose                 |
| --------------- | ----------------------- |
| React 18        | UI framework            |
| TypeScript      | Type safety             |
| Vite            | Build tool              |
| Tailwind CSS v4 | Utility-first styling   |
| Zustand         | Global state management |
| @tauri-apps/api | IPC with Tauri backend  |

---

## 10. License

All Rights Reserved — © 2026 Ernest Keyz Studios
