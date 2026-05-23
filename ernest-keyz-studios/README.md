# Ernest Keyz Studios — PulseMIDI Distribution

This directory contains everything needed to build and distribute **PulseMIDI** as
a professional macOS installer that works on both **Intel (x86_64)** and
**Apple Silicon (M1/M2/M3, arm64)** Macs.

## What the installer includes

| Component                        | Install location                |
| -------------------------------- | ------------------------------- |
| PulseMIDI.app (standalone)       | `/Applications/PulseMIDI.app`   |
| pulsemidi-vst.vst3 (VST3 plugin) | `/Library/Audio/Plug-Ins/VST3/` |
| pulsemidi-vst.clap (CLAP plugin) | `/Library/Audio/Plug-Ins/CLAP/` |

A single `.pkg` installs all three with the standard macOS Installer GUI — no
Terminal required.

## Directory layout

```
ernest-keyz-studios/
├── README.md              ← this file
├── build/
│   ├── build-universal.sh     ← step 1: compile universal binaries
│   ├── create-installer.sh    ← step 2: package into .pkg
│   └── installer-resources/
│       ├── distribution.xml   ← installer UI definition
│       ├── welcome.html
│       ├── conclusion.html
│       └── scripts/
│           ├── preinstall     ← removes old installations
│           └── postinstall    ← clears quarantine flags
└── docs/
    ├── INSTALL_GUIDE.md   ← end-user installation guide
    ├── MANUAL.md          ← user manual
    └── SPEC.md            ← technical specification
```

## Quick start (for developers)

```bash
# 1. Build universal binaries (Intel + Apple Silicon)
cd ernest-keyz-studios/build
chmod +x build-universal.sh create-installer.sh
./build-universal.sh

# 2. Create the .pkg installer
./create-installer.sh

# Output: ../../dist/PulseMIDI-1.1.0-macOS.pkg
```

## Architecture support

Both build steps produce **universal binaries** (fat Mach-O) that run natively on:

- Intel x86_64 (MacBook Pro 2020 and earlier with Intel)
- Apple Silicon arm64 (M1, M2, M3, M4 — any Mac from late 2020 onward)

No Rosetta required on Apple Silicon.
