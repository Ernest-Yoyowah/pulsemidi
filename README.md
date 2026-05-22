# PulseMIDI

> Real-time MIDI monitoring and diagnostics for musicians — fully offline, fully native.

PulseMIDI is an open-source desktop application for inspecting, diagnosing, and visualising MIDI data in real time. Built with Tauri v2 and a Rust CoreMIDI backend, it works entirely offline with zero latency overhead from web APIs or cloud services.

---

## Features

| Panel                     | What it does                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **MIDI Monitor**          | Scrolling log of every MIDI message — note on/off, CC, pitch bend, program change, aftertouch, and more. Pause and resume without dropping events.     |
| **Piano Keyboard**        | Full 88-key visual keyboard (A0–C8). Keys light up in cyan with velocity-proportional glow when notes are held.                                        |
| **Controllers**           | Live sliders for every CC received. Pan/Balance use a bidirectional centre bar. Sustain/Sostenuto/Soft Pedal show ON/OFF. All values animate at 75 ms. |
| **Diagnostics**           | Automatically detects stuck notes (held > 8 s), CC flooding (≥ 8 messages in 200 ms), sustain pedal state, and inter-event timing (Δt).                |
| **Device Manager**        | Lists all CoreMIDI input ports. Connect to all devices at once or select a single port. Re-scans on request.                                           |
| **Routing Visualisation** | Signal-flow strip showing the active device path through PulseMIDI.                                                                                    |

---

## Tech Stack

- **[Tauri v2](https://tauri.app/)** — native desktop shell (WKWebView + Rust core)
- **[Rust](https://www.rust-lang.org/) + [midir](https://github.com/Boddlnagg/midir)** — CoreMIDI access, zero-copy event streaming via Tauri IPC
- **[React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)** — frontend UI
- **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first styling with `@tailwindcss/vite`
- **[Zustand](https://github.com/pmndrs/zustand)** — lightweight global state
- **[Vite 7](https://vitejs.dev/)** — frontend build tooling

---

## Prerequisites

| Tool          | Version                         |
| ------------- | ------------------------------- |
| Rust (stable) | ≥ 1.75                          |
| Node.js       | ≥ 20                            |
| npm           | ≥ 10                            |
| macOS         | 12 Monterey or later (CoreMIDI) |

> **Note:** PulseMIDI currently targets macOS only due to the CoreMIDI dependency. Linux (ALSA/JACK) and Windows (WinMM) support is on the roadmap via `midir`'s cross-platform backend.

---

## Getting Started

```bash
# Clone
git clone https://github.com/Ernest-Yoyowah/pulsemidi.git
cd pulsemidi

# Install JS dependencies
npm install

# Development (hot-reload Vite + Rust watch)
npm run tauri dev

# Production build
npm run tauri build
```

The first `tauri dev` run will compile all Rust dependencies (~2–5 minutes). Subsequent runs use the incremental cache and start in under 10 seconds.

---

## Project Structure

```
pulsemidi/
├── src/                        # React / TypeScript frontend
│   ├── components/             # UI panels
│   │   ├── CcSliders.tsx       # Live CC controller sliders
│   │   ├── DeviceManager.tsx   # MIDI port selector
│   │   ├── DiagnosticsPanel.tsx
│   │   ├── MidiMonitor.tsx     # Scrolling event log
│   │   ├── PianoKeyboard.tsx   # 88-key visual keyboard
│   │   └── RoutingVisualization.tsx
│   ├── pages/
│   │   └── Dashboard.tsx       # Main layout
│   ├── services/
│   │   └── midiService.ts      # Tauri IPC abstraction
│   ├── store/
│   │   └── midiStore.ts        # Zustand state
│   ├── types/
│   │   └── midi.ts             # TypeScript types
│   └── utils/
│       ├── midiParser.ts       # Status byte → MidiEvent
│       └── noteUtils.ts        # Note names, CC names, helpers
├── src-tauri/
│   └── src/
│       └── lib.rs              # Rust MIDI backend (midir + Tauri commands)
└── docs/
    ├── SPEC.md                 # Technical specification
    └── MANUAL.md               # User manual
```

---

## Architecture in Brief

```
MIDI Device
    │  CoreMIDI (macOS kernel)
    ▼
[Rust — midir callback]
    │  app.emit("midi-message", payload)  ← Tauri IPC
    ▼
[TypeScript — listen("midi-message")]
    │  parseMidiMessage()
    ▼
[Zustand store — addEvent()]
    │  React re-render
    ▼
[UI Panels]
```

All MIDI processing happens on a dedicated Rust thread. The frontend receives serialised payloads via Tauri's IPC bridge and never touches CoreMIDI directly — this is why the app works inside WKWebView where the Web MIDI API is unavailable.

---

## License

MIT © Ernest Yoyowah
