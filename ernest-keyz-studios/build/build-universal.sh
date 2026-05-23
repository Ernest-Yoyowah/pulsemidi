#!/usr/bin/env bash
# =============================================================================
# build-universal.sh — PulseMIDI Universal Binary Builder
# Ernest Keyz Studios
#
# Builds PulseMIDI for BOTH Intel (x86_64) and Apple Silicon (arm64),
# then combines them into universal binaries using lipo.
#
# Outputs:
#   ../../_staging/Applications/PulseMIDI.app
#   ../../_staging/Library/Audio/Plug-Ins/VST3/pulsemidi-vst.vst3
#   ../../_staging/Library/Audio/Plug-Ins/CLAP/pulsemidi-vst.clap
#
# Requirements:
#   - Rust toolchain (rustup) with both targets installed
#   - Node.js 18+ and npm
#   - Tauri CLI (installed as npm dev dep)
#   - Xcode Command Line Tools (for lipo, codesign)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STAGING="$REPO_ROOT/_staging"
DIST="$REPO_ROOT/dist"
VST_ROOT="$REPO_ROOT/vst"
APP_VERSION="1.1.0"

# Colour helpers
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${CYAN}[build]${NC} $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Ernest Keyz Studios — PulseMIDI Universal Build ║"
echo "║  Version: $APP_VERSION  •  macOS Intel + Apple Silicon  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 0. Verify toolchains ────────────────────────────────────────────────────

info "Checking toolchains…"

# Look for rustup in PATH or the default install location
RUSTUP_BIN="${HOME}/.cargo/bin/rustup"
if command -v rustup &>/dev/null; then
  RUSTUP_BIN="rustup"
elif [ ! -x "$RUSTUP_BIN" ]; then
  echo "❌  rustup not found. Install from https://rustup.rs/"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "❌  Node.js not found. Install from https://nodejs.org/"
  exit 1
fi

if ! command -v lipo &>/dev/null; then
  echo "❌  lipo not found. Install Xcode Command Line Tools: xcode-select --install"
  exit 1
fi

# Ensure both Rust targets are installed
info "Installing Rust targets (x86_64 + arm64)…"
"$RUSTUP_BIN" target add x86_64-apple-darwin aarch64-apple-darwin

ok "Toolchains ready"

# ── 1. Clean staging ────────────────────────────────────────────────────────

info "Cleaning staging directory…"
rm -rf "$STAGING"
mkdir -p \
  "$STAGING/Applications" \
  "$STAGING/Library/Audio/Plug-Ins/VST3" \
  "$STAGING/Library/Audio/Plug-Ins/CLAP"

# ── 2. Build VST3 / CLAP — both architectures ───────────────────────────────
# NOTE: nih-plug xtask always outputs to target/bundled/ regardless of --target.
# We copy each arch's output to a separate holding dir before building the next.

BUNDLE_X86="$VST_ROOT/_bundle_x86"
BUNDLE_ARM="$VST_ROOT/_bundle_arm"
rm -rf "$BUNDLE_X86" "$BUNDLE_ARM"

info "Building VST3/CLAP for x86_64-apple-darwin…"
cd "$VST_ROOT"
~/.cargo/bin/cargo run -p xtask -- bundle pulsemidi-vst --release \
  --target x86_64-apple-darwin
# Save x86 output before next build overwrites it
cp -r "$VST_ROOT/target/bundled" "$BUNDLE_X86"

info "Building VST3/CLAP for aarch64-apple-darwin…"
~/.cargo/bin/cargo run -p xtask -- bundle pulsemidi-vst --release \
  --target aarch64-apple-darwin
# Save arm64 output
cp -r "$VST_ROOT/target/bundled" "$BUNDLE_ARM"

# ── 3. Lipo-merge the VST3 dylib ────────────────────────────────────────────

VST3_X86="$BUNDLE_X86/pulsemidi-vst.vst3"
VST3_ARM="$BUNDLE_ARM/pulsemidi-vst.vst3"
VST3_OUT="$STAGING/Library/Audio/Plug-Ins/VST3/pulsemidi-vst.vst3"

info "Merging VST3 into universal binary…"
cp -r "$VST3_ARM" "$VST3_OUT"   # start from ARM copy (any arch works as template)

DYLIB_RELATIVE="Contents/MacOS/pulsemidi-vst"
lipo -create \
  "$VST3_X86/$DYLIB_RELATIVE" \
  "$VST3_ARM/$DYLIB_RELATIVE" \
  -output "$VST3_OUT/$DYLIB_RELATIVE"

ok "VST3 universal binary created"

# ── 4. Lipo-merge the CLAP ──────────────────────────────────────────────────

CLAP_X86="$BUNDLE_X86/pulsemidi-vst.clap"
CLAP_ARM="$BUNDLE_ARM/pulsemidi-vst.clap"
CLAP_OUT="$STAGING/Library/Audio/Plug-Ins/CLAP/pulsemidi-vst.clap"

info "Merging CLAP into universal binary…"
cp -r "$CLAP_ARM" "$CLAP_OUT"

lipo -create \
  "$CLAP_X86/Contents/MacOS/pulsemidi-vst" \
  "$CLAP_ARM/Contents/MacOS/pulsemidi-vst" \
  -output "$CLAP_OUT/Contents/MacOS/pulsemidi-vst"

ok "CLAP universal binary created"

# Clean up temp arch bundles
rm -rf "$BUNDLE_X86" "$BUNDLE_ARM"

# ── 5. Build Tauri standalone — universal ────────────────────────────────────

info "Building Tauri standalone app (universal)…"
cd "$REPO_ROOT"
npm ci --silent
npm run tauri build -- --target universal-apple-darwin

TAURI_APP="$REPO_ROOT/src-tauri/target/universal-apple-darwin/release/bundle/macos/PulseMIDI.app"

if [ ! -d "$TAURI_APP" ]; then
  # Fallback: try the non-target path (older Tauri versions)
  TAURI_APP="$REPO_ROOT/src-tauri/target/release/bundle/macos/PulseMIDI.app"
fi

if [ ! -d "$TAURI_APP" ]; then
  warn "Universal Tauri build not found — attempting host-arch fallback…"
  npm run tauri build
  TAURI_APP_FOUND=$(find "$REPO_ROOT/src-tauri/target" -name "PulseMIDI.app" -maxdepth 6 | head -1)
  TAURI_APP="${TAURI_APP_FOUND}"
fi

info "Copying PulseMIDI.app to staging…"
cp -r "$TAURI_APP" "$STAGING/Applications/PulseMIDI.app"
ok "Standalone app staged"

# ── 6. Verify architectures ─────────────────────────────────────────────────

echo ""
info "Architecture verification:"
echo "  VST3:  $(lipo -archs "$VST3_OUT/Contents/MacOS/pulsemidi-vst" 2>/dev/null || echo 'not found')"
echo "  CLAP:  $(lipo -archs "$CLAP_OUT/Contents/MacOS/pulsemidi-vst" 2>/dev/null || echo 'not found')"
APP_BIN="$STAGING/Applications/PulseMIDI.app/Contents/MacOS/PulseMIDI"
echo "  App:   $(lipo -archs "$APP_BIN" 2>/dev/null || echo 'check manually')"

echo ""
ok "Universal build complete → $_STAGING"
echo "  Next step: run ./create-installer.sh"
echo ""
