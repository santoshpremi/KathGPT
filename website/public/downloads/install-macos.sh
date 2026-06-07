#!/bin/bash
# Install KathGPT on macOS and bypass browser quarantine (Gatekeeper).
set -euo pipefail

APP_NAME="KathGPT.app"
INSTALL_DIR="/Applications"
DMG_GLOB="$HOME/Downloads/KathGPT_*.dmg"

find_dmg() {
  local latest
  latest=$(ls -t $DMG_GLOB 2>/dev/null | head -1 || true)
  if [[ -n "$latest" && -f "$latest" ]]; then
    echo "$latest"
    return
  fi
  echo "Place the KathGPT .dmg in ~/Downloads, or pass the path:" >&2
  echo "  ./scripts/install-macos.sh ~/Downloads/KathGPT_0.1.0_aarch64.dmg" >&2
  exit 1
}

DMG_PATH="${1:-$(find_dmg)}"
MOUNT_OUTPUT=$(hdiutil attach "$DMG_PATH" -nobrowse -readonly)
VOLUME=$(echo "$MOUNT_OUTPUT" | awk '/\/Volumes\// {print $NF; exit}')

if [[ ! -d "$VOLUME/$APP_NAME" ]]; then
  hdiutil detach "$VOLUME" -quiet 2>/dev/null || true
  echo "Error: $APP_NAME not found in $DMG_PATH" >&2
  exit 1
fi

echo "Installing to $INSTALL_DIR ..."
rm -rf "$INSTALL_DIR/$APP_NAME"
ditto "$VOLUME/$APP_NAME" "$INSTALL_DIR/$APP_NAME"
xattr -cr "$INSTALL_DIR/$APP_NAME"
hdiutil detach "$VOLUME" -quiet

echo "Launching KathGPT ..."
open "$INSTALL_DIR/$APP_NAME"
