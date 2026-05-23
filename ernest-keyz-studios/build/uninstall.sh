#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Ernest Keyz Studios — PulseMIDI Remove  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

TARGETS=(
  "/Applications/PulseMIDI.app"
  "/Library/Audio/Plug-Ins/VST3/pulsemidi-vst.vst3"
  "/Library/Audio/Plug-Ins/CLAP/pulsemidi-vst.clap"
)

FOUND=0
for t in "${TARGETS[@]}"; do
  if [ -e "$t" ]; then
    echo "Removing $t"
    sudo rm -rf "$t"
    FOUND=1
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo "Nothing to remove — PulseMIDI is not installed."
else
  echo ""
  echo "PulseMIDI uninstalled."
fi
