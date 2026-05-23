#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STAGING="$REPO_ROOT/_staging"
RESOURCES="$SCRIPT_DIR/installer-resources"
SCRIPTS="$RESOURCES/scripts"
PKG_WORK="$REPO_ROOT/_pkgwork"
DIST="$REPO_ROOT/dist"
APP_VERSION="1.1.0"
IDENTIFIER_PREFIX="com.ernestkeyzstudios.pulsemidi"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${CYAN}[pkg]${NC}   $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Ernest Keyz Studios — PulseMIDI Installer Build ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""


if [ ! -d "$STAGING/Applications/PulseMIDI.app" ]; then
  echo "❌  Staging directory not found."
  echo "    Run ./build-universal.sh first, then re-run this script."
  exit 1
fi

rm -rf "$PKG_WORK"
mkdir -p "$PKG_WORK/components" "$DIST"

chmod +x "$SCRIPTS/preinstall" "$SCRIPTS/postinstall"

info "Compiling Uninstall PulseMIDI.app…"
UNINSTALLER_SRC="$RESOURCES/Uninstall PulseMIDI.applescript"
UNINSTALLER_APP="$STAGING/Applications/Uninstall PulseMIDI.app"
rm -rf "$UNINSTALLER_APP"
osacompile -o "$UNINSTALLER_APP" "$UNINSTALLER_SRC"
ok "Uninstaller app compiled"

info "Building component: PulseMIDI.app (standalone)…"
pkgbuild \
  --root "$STAGING/Applications" \
  --install-location "/Applications" \
  --identifier "${IDENTIFIER_PREFIX}.standalone" \
  --version "$APP_VERSION" \
  --scripts "$SCRIPTS" \
  "$PKG_WORK/components/standalone.pkg"

info "Building component: pulsemidi-vst.vst3…"
pkgbuild \
  --root "$STAGING/Library/Audio/Plug-Ins/VST3" \
  --install-location "/Library/Audio/Plug-Ins/VST3" \
  --identifier "${IDENTIFIER_PREFIX}.vst3" \
  --version "$APP_VERSION" \
  "$PKG_WORK/components/vst3.pkg"

info "Building component: pulsemidi-vst.clap…"
pkgbuild \
  --root "$STAGING/Library/Audio/Plug-Ins/CLAP" \
  --install-location "/Library/Audio/Plug-Ins/CLAP" \
  --identifier "${IDENTIFIER_PREFIX}.clap" \
  --version "$APP_VERSION" \
  "$PKG_WORK/components/clap.pkg"

ok "Component packages built"

FINAL_PKG="$DIST/PulseMIDI-${APP_VERSION}-macOS.pkg"

info "Assembling final installer → $FINAL_PKG"
productbuild \
  --distribution "$RESOURCES/distribution.xml" \
  --resources "$RESOURCES" \
  --package-path "$PKG_WORK/components" \
  "$FINAL_PKG"

echo ""
ok "Installer created:"
echo "   $FINAL_PKG"
echo ""
echo "  Size: $(du -sh "$FINAL_PKG" | cut -f1)"
echo ""
echo "  To test:  open \"$FINAL_PKG\""
echo "  To share: send PulseMIDI-${APP_VERSION}-macOS.pkg to your friends"
echo ""
echo "  The installer will:"
echo "    ✓ Show a welcome screen with branding"
echo "    ✓ Let the user choose which components to install"
echo "    ✓ Install with macOS Installer GUI (no Terminal needed)"
echo "    ✓ Remove any previous PulseMIDI installation automatically"
echo "    ✓ Clear macOS quarantine flags on all binaries"
echo ""
