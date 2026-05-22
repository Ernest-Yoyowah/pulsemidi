# PulseMIDI — User Manual

**Version:** 0.1.0  
**Platform:** macOS 12+

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Interface Overview](#2-interface-overview)
3. [Device Manager](#3-device-manager)
4. [MIDI Monitor](#4-midi-monitor)
5. [Controllers Panel](#5-controllers-panel)
6. [Piano Keyboard](#6-piano-keyboard)
7. [Diagnostics](#7-diagnostics)
8. [Routing Visualisation](#8-routing-visualisation)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Getting Started

### Launch

Open PulseMIDI. On first launch, macOS may ask for permission to access MIDI devices — allow it. The app connects to **all available MIDI inputs** automatically.

If you see a green **LIVE** indicator in the top-right header, MIDI is active and the app is listening.

### Connecting a device

Plug in your MIDI controller (USB or via a MIDI interface) **before** opening PulseMIDI, or use the **Refresh** button in the Device Manager after plugging in. CoreMIDI requires a reconnect to pick up newly attached devices.

---

## 2. Interface Overview

```
┌─────────────────────────────────────────────────┐
│  PulseMIDI          [routing visualisation] LIVE │
├──────────┬──────────────────────┬────────────────┤
│ Devices  │                      │  Controllers   │
│          │    MIDI Monitor      │  (CC sliders)  │
│ Diagnos- │  (scrolling event    │                │
│  tics    │       log)           │                │
├──────────┴──────────────────────┴────────────────┤
│              Piano Keyboard (88 keys)            │
└─────────────────────────────────────────────────┘
```

| Area                  | Location     | Purpose                         |
| --------------------- | ------------ | ------------------------------- |
| Header bar            | Top strip    | App status, MIDI live indicator |
| Routing Visualisation | Below header | Signal-flow summary             |
| Device Manager        | Left, upper  | Port list and selection         |
| Diagnostics           | Left, lower  | Health warnings                 |
| MIDI Monitor          | Centre       | Live event log                  |
| Controllers           | Right        | Live CC slider values           |
| Piano Keyboard        | Bottom       | Visual 88-key note display      |

---

## 3. Device Manager

The Device Manager lists every CoreMIDI input port available on your system.

### Selecting a device

- **All Devices** — connects to every available port simultaneously. This is the default.
- **Single device** — click a device name to monitor only that port. Useful when multiple controllers are connected and you want to isolate one.

### Status indicator

Each device shows a small coloured dot:

| Colour | Meaning                        |
| ------ | ------------------------------ |
| Cyan   | Active — receiving data        |
| Grey   | Connected but no recent events |
| None   | Not connected                  |

### Refresh

If you plug in a device after the app launches, click the **↺ Refresh** button to re-scan CoreMIDI ports. You may need to click **All** afterwards to reconnect.

---

## 4. MIDI Monitor

The MIDI Monitor is the main event log. Every MIDI message received is appended as a row.

### Columns

| Column      | Description                                                |
| ----------- | ---------------------------------------------------------- |
| **TIME**    | How long ago the event was received (e.g. `0.3s`, `1m 2s`) |
| **CH**      | MIDI channel (1–16). System messages show `CH0`.           |
| **TYPE**    | Colour-coded message type tag (see below)                  |
| **MESSAGE** | Human-readable description                                 |
| **DEVICE**  | Source port name (hidden on narrow windows)                |

### Message type tags

| Tag            | Colour   | MIDI message                                       |
| -------------- | -------- | -------------------------------------------------- |
| `NOTE ON`      | Cyan     | Note pressed with velocity > 0                     |
| `NOTE OFF`     | Zinc     | Note released                                      |
| `CC`           | Violet   | Control Change (knob, slider, pedal)               |
| `BEND`         | Amber    | Pitch Bend wheel                                   |
| `AT`           | Rose     | Aftertouch (per-note or channel)                   |
| `PRESSURE`     | Rose     | Channel Pressure                                   |
| `PC`           | Zinc     | Program Change                                     |
| `CLK` / `SENS` | Dim grey | Clock and Active Sensing — filtered out by default |

### Controls

| Button    | Shortcut | Action                                                                                               |
| --------- | -------- | ---------------------------------------------------------------------------------------------------- |
| **Pause** | —        | Freezes the log display. New events are still recorded in the background; resuming shows the latest. |
| **Clear** | —        | Empties the event log, resets active notes and CC values.                                            |

### Event count

The footer shows how many events are in the log (max 500). Once the log is full, the oldest events are removed automatically.

---

## 5. Controllers Panel

The Controllers panel shows the **last received value** for every CC (Control Change) number as a live bar.

### Reading the bars

| CC type                                                               | Display                                                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Standard (most CCs)                                                   | Left-to-right fill bar, 0–127                                                    |
| Pan (CC 10), Balance (CC 8)                                           | Bidirectional bar; left = left pan, right = right pan, centre tick = 64 (centre) |
| Sustain Pedal (CC 64)                                                 | Shows `ON` / `OFF` instead of a number; bar turns cyan when engaged              |
| Sostenuto (CC 66), Soft Pedal (CC 67), Legato (CC 68), Hold 2 (CC 69) | Same ON/OFF treatment                                                            |

Values animate with a 75 ms transition — fast enough to follow quick sweeps without flickering.

### Common controllers

| CC  | Name          | Typical use                 |
| --- | ------------- | --------------------------- |
| 1   | Modulation    | Mod wheel                   |
| 7   | Volume        | Channel fader               |
| 10  | Pan           | Left/right balance          |
| 11  | Expression    | Expression pedal / dynamics |
| 64  | Sustain Pedal | Damper pedal                |
| 71  | Resonance     | Filter resonance (synths)   |
| 74  | Brightness    | Filter cutoff               |
| 91  | Reverb Level  | Effect send                 |
| 93  | Chorus Level  | Effect send                 |

---

## 6. Piano Keyboard

The 88-key keyboard spans A0 (MIDI note 21) to C8 (MIDI note 108).

### Note display

- When a **Note On** is received, the corresponding key lights up in **cyan**.
- The brightness of the glow scales with **velocity** — a soft touch (velocity 30) glows dimly; a hard strike (velocity 127) glows at full intensity.
- When a **Note Off** is received (or a Note On with velocity = 0), the key returns to its resting colour.

### Reading the keyboard

Black keys use a slightly brighter glow to remain visible against the dark background. Notes outside the standard 88-key range (below A0 or above C8) are silently ignored by the keyboard display but still appear in the MIDI Monitor.

---

## 7. Diagnostics

The Diagnostics panel automatically flags common performance problems.

### Summary banner

| State                   | Colour | Meaning                    |
| ----------------------- | ------ | -------------------------- |
| `✓ All clear`           | Green  | No issues detected         |
| `⚠ N issue(s) detected` | Amber  | One or more problems found |

### Stuck Notes

A note is flagged as **stuck** if it has been in the `noteOn` state for more than **8 seconds** without a corresponding `noteOff`.

**Why this happens:**

- MIDI cable disconnect mid-performance
- Patch change dropped the Note Off
- Sustain pedal held while note-off was not received

**How to clear it:** The note will clear automatically once a Note Off is received, or use **Clear** in the MIDI Monitor to reset all active notes.

### CC Spam

A controller is flagged as **spamming** if **8 or more messages** are received for the same CC number within a **200 ms window**.

**Why this matters:** Some faulty encoders, breath controllers, or expression pedals send rapid repeated values even when not being moved, which can cause audio glitches in DAWs or synthesisers.

### Sustain Pedal

Shows whether **CC 64** (Damper / Sustain pedal) is currently pressed (value ≥ 64) or released.

Useful to confirm the pedal is behaving correctly — a "stuck on" sustain after a cable disconnect is a common live performance problem.

### Event Δt

Shows the time in milliseconds between the two most recent events. Useful for:

- Confirming MIDI clock is running (`Δt ≈ 20.8 ms` at 120 BPM = 24 ppqn)
- Checking whether a controller is producing jitter
- Estimating round-trip latency in a MIDI chain

---

## 8. Routing Visualisation

The routing bar at the top of the dashboard shows the signal path:

```
[ Device Name ]  ──→──  [ PulseMIDI ]  ──→──  [ Output ]
```

- **Device Name** updates to show the currently selected (or most recently active) input.
- **PulseMIDI** is the monitor node — read-only.
- **Output** is reserved for future routing features.

---

## 9. Troubleshooting

### The app shows `MIDI ERROR` in the header

1. Check that at least one MIDI device is connected and powered on.
2. Click **↺ Refresh** in the Device Manager.
3. Ensure macOS has not blocked MIDI access — check **System Settings → Privacy & Security**.
4. Restart the app.

### No devices appear in the Device Manager

- Verify the device is recognised by macOS: open **Audio MIDI Setup** (`/Applications/Utilities/`) and check the MIDI Studio pane.
- If using a USB hub, try a direct connection.
- Some USB MIDI class-compliant devices require a short delay after plug-in before CoreMIDI registers them — wait 3–4 seconds then click **↺ Refresh**.

### Events appear in the monitor but the piano keyboard doesn't light up

- Only notes in the range **A0–C8** (MIDI 21–108) are shown on the keyboard.
- Confirm the note number in the MIDI Monitor MESSAGE column.

### The TIME column shows very large values or negative numbers

- This can happen if the system clock was adjusted while the app was running. Click **Clear** to reset timestamps.

### The app won't launch after updating macOS

- Tauri applications rely on the system WebView. After a major macOS update, run `npm run tauri dev` once from the terminal to rebuild the binary for the new SDK.

---

_PulseMIDI is open source. Contributions and bug reports are welcome at [github.com/Ernest-Yoyowah/pulsemidi](https://github.com/Ernest-Yoyowah/pulsemidi)._
