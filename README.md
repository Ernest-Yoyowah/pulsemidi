# PulseMIDI

> Real-time MIDI monitoring, chord detection & performance visualisation — by **Ernest Keyz / Ernest Keyz Studios**

PulseMIDI is an open-source MIDI toolkit that ships in three forms: a **Tauri standalone desktop app**, a **VST3 plugin**, and a **CLAP plugin**. Everything runs entirely offline with zero web API or cloud dependency.

---

## Features

| Feature | Description |
|---|---|
| **88-Key Piano** | Full A0–C8 visualiser. Keys light up with velocity-proportional glow; colour is user-configurable. |
| **Chord Detection** | Real-time detection of triads, 7ths, 9ths, 11ths, 13ths and slash chords. |
| **Pitch & Mod Wheels** | Bidirectional pitch wheel (cyan = up, amber = down) and modulation bar that mirror a physical keyboard exactly. |
| **CC Sliders & Knobs** | Two switchable views for MIDI controllers: a horizontal bar list and a rotary knob grid. |
| **Live BPM** | Derived from MIDI clock ticks; displayed in real time in both standalone and VST. |
| **Sustain Pedal Icon** | A pedal icon (standalone) or `⊙ SUS` badge (VST) appears while CC 64 is held. |
| **MIDI Monitor** | Scrolling log of every MIDI message — pause/resume without dropping events. |
| **Diagnostics** | Stuck-note detection (>8 s), CC flood alerts, inter-event latency readout. |
| **Device Manager** | Lists all CoreMIDI input ports. Connect to all at once or select a single port. |
| **Settings** | Configurable active-key colour via in-app colour picker. |

---

## Formats & Platform Support

| Format | Host / Runtime |
|---|---|
| **VST3** | Ableton Live, Logic Pro, Reaper, Cubase, Studio One, Bitwig… |
| **CLAP** | Bitwig Studio, Reaper, and other CLAP-compatible hosts |
| **Standalone** | macOS desktop app (Tauri v2 + WebKit) |

> **Platform:** macOS 12 Monterey or later (Intel x86\_64 & Apple Silicon). Linux/Windows support is on the roadmap via `midir`'s cross-platform backend.

---

## Tech Stack

### Standalone app
- **[Tauri v2](https://tauri.app/)** — native macOS shell (WKWebView + Rust core)
- **[Rust](https://www.rust-lang.org/) + [midir](https://github.com/Boddlnagg/midir)** — CoreMIDI access, zero-copy event streaming
- **[React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)** — frontend UI
- **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first styling
- **[Zustand](https://github.com/pmndrs/zustand)** — lightweight global state
- **[Vite 7](https://vitejs.dev/)** — frontend build tooling

### VST3 / CLAP plugin
- **[nih-plug](https://github.com/robbert-vdh/nih-plug)** — Rust VST3 + CLAP plugin framework
- **[nih-plug-vizia](https://github.com/robbert-vdh/nih-plug)** — Vizia-based GPU-accelerated GUI
- **femtovg** — canvas rendering for piano keys and pitch/mod wheels
- **Lock-free `AtomicPluginState`** — wait-free shared state between audio thread and GUI thread

---

## Prerequisites

| Tool | Version |
|---|---|
| Rust (stable) | ≥ 1.75 |
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| macOS | 12 Monterey or later |

---

## Getting Started

### Standalone app

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

The first `tauri dev` run will compile all Rust dependencies (~2–5 min). Subsequent runs use the incremental cache and start in under 10 s.

### VST3 / CLAP plugin

```bash
cd vst

# Build bundles (release)
~/.cargo/bin/cargo run -p xtask -- bundle pulsemidi-vst --release

# Install (macOS)
sudo rm -rf /Library/Audio/Plug-Ins/VST3/pulsemidi-vst.vst3 \
            /Library/Audio/Plug-Ins/CLAP/pulsemidi-vst.clap
sudo cp -r target/bundled/pulsemidi-vst.vst3 /Library/Audio/Plug-Ins/VST3/
sudo cp -r target/bundled/pulsemidi-vst.clap  /Library/Audio/Plug-Ins/CLAP/

# Remove quarantine (required on macOS for unsigned bundles)
sudo xattr -cr /Library/Audio/Plug-Ins/VST3/pulsemidi-vst.vst3
sudo xattr -cr /Library/Audio/Plug-Ins/CLAP/pulsemidi-vst.clap
```

Rescan plugins in your DAW and load **PulseMIDI** as a MIDI effect / instrument on any MIDI track.

---

## Project Structure

```
pulsemidi/
├── src/                          # React / TypeScript frontend (standalone)
│   ├── components/
│   │   ├── CcSliders.tsx         # CC sliders + knob grid view
│   │   ├── DeviceManager.tsx     # MIDI port selector
│   │   ├── DiagnosticsPanel.tsx  # Stuck-note & CC-flood alerts
│   │   ├── MidiMonitor.tsx       # Scrolling event log
│   │   ├── PerformanceView.tsx   # Live performance layout
│   │   ├── PianoKeyboard.tsx     # 88-key piano (A0–C8)
│   │   └── RoutingVisualization.tsx
│   ├── pages/
│   │   └── Dashboard.tsx         # Monitor mode layout
│   ├── services/
│   │   └── midiService.ts        # Tauri IPC abstraction
│   ├── store/
│   │   └── midiStore.ts          # Zustand state (incl. activeKeyColor)
│   ├── utils/
│   │   ├── chordUtils.ts         # Full chord detection engine
│   │   ├── midiParser.ts         # Status byte → MidiEvent
│   │   └── noteUtils.ts          # Note names, CC names, helpers
│   └── App.tsx                   # App shell, Settings & About modals
├── src-tauri/
│   └── src/lib.rs                # Rust MIDI backend (midir + Tauri IPC)
├── vst/
│   └── pulsemidi-vst/
│       └── src/
│           ├── lib.rs            # Plugin core — AtomicPluginState, process()
│           ├── editor.rs         # Vizia GUI — piano, wheels, chord display
│           └── midi_utils.rs     # Chord detection, note/CC names (Rust)
└── docs/
    ├── SPEC.md
    ├── MANUAL.md
    └── CHORDS.md
```

---

## VST Architecture

```
DAW MIDI Thread                GUI Thread (≈30 fps)
──────────────────             ──────────────────────────
process() callback             cx.spawn() proxy thread
  ↓                              sends UiEvent::Tick every 33 ms
  writes AtomicPluginState         ↓
  (lock-free atomics)           UiModel::event(Tick)
                                  reads atomics
                                  updates Lens fields
                                    ↓
                                  Vizia bindings rebuild
                                  femtovg draw() called
```

`AtomicPluginState` is a bundle of `AtomicU64` (note bitmasks), `AtomicI32` (pitch bend), `AtomicU32` (BPM), and `[AtomicU8; 128]` (CC values). The audio thread never holds a lock.

---

## About

Created by **Ernest Keyz** / **Ernest Keyz Studios**.

---

## License

MIT © Ernest Keyz Studios


