#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HOME/.cargo/env" 2>/dev/null || true

VERSION=$(grep '^version' "$SCRIPT_DIR/pulsemidi-vst/Cargo.toml" | head -1 | cut -d'"' -f2)
OUT_DIR="$SCRIPT_DIR/target/bundled"
DIST_DIR="$SCRIPT_DIR/target/dist"

echo "Building PulseMIDI v$VERSION (universal: x86_64 + arm64)..."

cargo run --manifest-path "$SCRIPT_DIR/Cargo.toml" -p xtask -- bundle pulsemidi-vst --release --target x86_64-apple-darwin

for bundle in "$OUT_DIR"/*.vst3 "$OUT_DIR"/*.clap; do
  [ -e "$bundle" ] || continue
  macosdir="$bundle/Contents/MacOS"
  for bin in "$macosdir"/*; do
    [ -f "$bin" ] && cp "$bin" "${bin}.x86_64"
  done
done

cargo run --manifest-path "$SCRIPT_DIR/Cargo.toml" -p xtask -- bundle pulsemidi-vst --release --target aarch64-apple-darwin

for bundle in "$OUT_DIR"/*.vst3 "$OUT_DIR"/*.clap; do
  [ -e "$bundle" ] || continue
  macosdir="$bundle/Contents/MacOS"
  for bin in "$macosdir"/*; do
    [ -f "$bin" ] || continue
    x86="${bin}.x86_64"
    if [ -f "$x86" ]; then
      lipo -create "$x86" "$bin" -output "$bin"
      rm -f "$x86"
      echo "Universal binary created: $(basename "$bin")"
    fi
  done
done

mkdir -p "$DIST_DIR"

VST3_BUNDLE=$(find "$OUT_DIR" -maxdepth 1 -name "*.vst3" | head -1)
CLAP_BUNDLE=$(find "$OUT_DIR" -maxdepth 1 -name "*.clap" | head -1)

PKG_LIST=()

if [ -n "$VST3_BUNDLE" ]; then
  pkgbuild \
    --component "$VST3_BUNDLE" \
    --install-location "/Library/Audio/Plug-Ins/VST3" \
    --identifier "com.pulsemidi.vst3" \
    "$DIST_DIR/pulsemidi-vst3.pkg"
  PKG_LIST+=("$DIST_DIR/pulsemidi-vst3.pkg")
  echo "Packaged VST3"
fi

if [ -n "$CLAP_BUNDLE" ]; then
  pkgbuild \
    --component "$CLAP_BUNDLE" \
    --install-location "/Library/Audio/Plug-Ins/CLAP" \
    --identifier "com.pulsemidi.clap" \
    "$DIST_DIR/pulsemidi-clap.pkg"
  PKG_LIST+=("$DIST_DIR/pulsemidi-clap.pkg")
  echo "Packaged CLAP"
fi

if [ ${#PKG_LIST[@]} -gt 1 ]; then
  ARGS=()
  for p in "${PKG_LIST[@]}"; do ARGS+=(--package "$p"); done

  productbuild \
    --synthesize "${ARGS[@]}" \
    "$DIST_DIR/distribution.xml"

  productbuild \
    --distribution "$DIST_DIR/distribution.xml" \
    --package-path "$DIST_DIR" \
    "$DIST_DIR/PulseMIDI-${VERSION}-mac.pkg"

  rm -f "${PKG_LIST[@]}" "$DIST_DIR/distribution.xml"
  echo ""
  echo "→ $DIST_DIR/PulseMIDI-${VERSION}-mac.pkg"
elif [ ${#PKG_LIST[@]} -eq 1 ]; then
  echo ""
  echo "→ ${PKG_LIST[0]}"
fi

echo "Share that file. Friends double-click it — done."

