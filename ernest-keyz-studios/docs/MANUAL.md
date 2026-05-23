# PulseMIDI — User Manual

**Ernest Keyz Studios · v1.1.0**

---

## Overview

PulseMIDI is a real-time MIDI visualizer, chord detector, and performance monitor. It comes in two forms that complement each other:

| Form                   | Use case                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Standalone app**     | Open independently — connect any MIDI keyboard and monitor                   |
| **VST3 / CLAP plugin** | Load inside a DAW to visualize what your instrument or MIDI track is playing |

---

## Standalone app

### Interface modes

Switch between modes using the toggle at the top of the window:

| Mode        | Description                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| **Monitor** | Dashboard — MIDI event log, device manager, CC sliders/knobs, piano keyboard, signal flow, diagnostics |
| **Live**    | Performance view — full-screen chord display, BPM counter, pitch/mod wheels, sustain indicator         |

---

### Monitor mode — Dashboard

#### Device Manager (left sidebar)

- Lists all connected MIDI input devices.
- Select **All Devices** to monitor everything at once, or click a specific device to filter.
- Device status updates automatically when you plug/unplug hardware.

#### MIDI Monitor (center)

- Shows a live scrolling log of every MIDI event (note on/off, CC, pitch bend, etc.).
- **⏸ Pause** — freeze the log while keeping MIDI active.
- **Clear** — erase the event history.
- Clock and Active Sensing messages are filtered from the log to reduce noise.

#### CC Sliders / Knobs (right sidebar)

- Displays all CC controllers that have received a value.
- Toggle between **slider view** (☰) and **knob view** (○) using the buttons at the top.
- Values update in real-time with 16 ms transitions for smooth motion.

#### Piano Keyboard (bottom)

- 88-key A0–C8 layout.
- Active notes light up in your chosen **active key color** (set in Settings).
- Velocity affects brightness — harder hits glow brighter.

#### Diagnostics (left sidebar, below devices)

- **Stuck notes** — detects notes that have been held for an unusually long time.
- **CC Spam** — detects rapidly firing CC messages (e.g., a runaway expression pedal).
- **Sustain Pedal** — shows whether CC 64 is currently held.
- **Event Δt** — reports the inter-event latency in milliseconds.

#### Signal Flow

- Visual diagram showing the path from your MIDI input → PulseMIDI → Output (future).

---

### Live (Performance) mode

Designed for on-stage use or when you want a large, readable chord display.

| Element          | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| **Chord name**   | Detected chord root + quality in large text, centre screen  |
| **Note chips**   | Individual note names of all held keys                      |
| **BPM**          | Current tempo detected from MIDI clock                      |
| **Pitch wheel**  | Left side — fills cyan upward or amber downward from centre |
| **Mod wheel**    | Left side — fills from bottom                               |
| **Sustain**      | Animated pedal icon shown when CC 64 is active              |
| **Standby ring** | Breathing animation shown when no notes are held            |

---

## VST3 / CLAP plugin

Load the PulseMIDI plugin on any MIDI track or instrument rack in your DAW. The plugin passes all MIDI through unchanged — it only monitors.

### Plugin controls

The plugin GUI mirrors the performance view:

- Live chord + notes display
- Pitch and mod wheel indicators
- BPM from DAW transport
- Sustain pedal indicator (⊙ SUS badge)

---

## Settings

Click the **⚙** icon in the top-right corner of the standalone app to open Settings.

| Setting              | Description                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Active Key Color** | Colour used to highlight pressed keys on the piano keyboard. Pick any colour with the native macOS colour picker. |

---

## About

Click the **ⓘ** icon to view version info, feature list, platform details, and license.

---

## Keyboard & shortcut reference

The app is primarily mouse/touch driven. No global keyboard shortcuts are currently defined (to avoid conflicts with your DAW or instrument).

---

© 2026 Ernest Keyz Studios — All Rights Reserved
