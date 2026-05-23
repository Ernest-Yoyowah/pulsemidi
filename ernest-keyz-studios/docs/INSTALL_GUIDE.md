# PulseMIDI — Installation Guide

**Ernest Keyz Studios · v1.1.0**

---

## System requirements

|                  | Minimum                                         |
| ---------------- | ----------------------------------------------- |
| macOS            | 11 Big Sur or newer                             |
| CPU              | Intel x86_64 **or** Apple Silicon (M1/M2/M3/M4) |
| RAM              | 4 GB                                            |
| DAW (for plugin) | Any VST3 or CLAP host                           |

> The installer is a **universal binary** — one download, works on both chip types. No Rosetta needed on Apple Silicon.

---

## Installing with the GUI installer (recommended)

1. Download `PulseMIDI-1.1.0-macOS.pkg` from the releases page.
2. Double-click the `.pkg` file.
3. The macOS Installer launches automatically:
   - **Introduction** — overview of what will be installed.
   - **License** — agree to the proprietary license.
   - **Installation Type** — choose which components to install:
     - ✅ PulseMIDI Standalone App
     - ✅ VST3 Plugin
     - ✅ CLAP Plugin
   - Click **Install** and enter your macOS password when prompted.
   - **Conclusion** — all done!

4. Launch PulseMIDI from your Applications folder, or load the plugin in your DAW.

> The installer automatically removes any previous version before installing the new one.

---

## What gets installed

| Component     | Location                                          |
| ------------- | ------------------------------------------------- |
| PulseMIDI.app | `/Applications/PulseMIDI.app`                     |
| VST3 plugin   | `/Library/Audio/Plug-Ins/VST3/pulsemidi-vst.vst3` |
| CLAP plugin   | `/Library/Audio/Plug-Ins/CLAP/pulsemidi-vst.clap` |

---

## After installing — DAW setup

### Ableton Live

1. Go to **Preferences → Plug-Ins**.
2. Enable **VST3** plug-in folder.
3. Click **Rescan**. PulseMIDI appears under **Instruments → Ernest Keyz Studios**.

### Logic Pro

1. Logic scans `/Library/Audio/Plug-Ins/VST3` automatically on startup.
2. If not shown, open the **Plug-in Manager** and rescan.

### Reaper / Bitwig (CLAP)

1. Go to plugin preferences and add `/Library/Audio/Plug-Ins/CLAP` as a CLAP path.
2. Rescan. PulseMIDI appears under CLAP instruments.

---

## Uninstalling

To remove PulseMIDI completely, run the following in Terminal:

```bash
# Standalone app
sudo rm -rf /Applications/PulseMIDI.app

# VST3 plugin
sudo rm -rf /Library/Audio/Plug-Ins/VST3/pulsemidi-vst.vst3

# CLAP plugin
sudo rm -rf /Library/Audio/Plug-Ins/CLAP/pulsemidi-vst.clap
```

---

## Troubleshooting

**"PulseMIDI can't be opened because it is from an unidentified developer"**  
The installer clears quarantine flags automatically. If this message still appears, run:

```bash
sudo xattr -cr /Applications/PulseMIDI.app
```

**Plugin not found in DAW**  
Restart the DAW and trigger a plugin rescan, or check that the correct plugin folder is enabled in your DAW's preferences.

**No MIDI input shown**  
macOS requires the user to grant MIDI access. A permission dialog appears on first launch. If dismissed accidentally, go to **System Settings → Privacy & Security → MIDI** and enable PulseMIDI.

---

© 2026 Ernest Keyz Studios — All Rights Reserved
