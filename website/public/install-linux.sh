#!/bin/bash
# KathaGPT one-line installer for Linux.
# Usage:  curl -fsSL https://santoshpremi.github.io/KathaGPT/install-linux.sh | bash
set -euo pipefail

VERSION="0.1.0"
APPIMAGE="KathaGPT_${VERSION}_amd64.AppImage"
BASE_URL="https://santoshpremi.github.io/KathaGPT/downloads"
INSTALL_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"

echo "KathaGPT installer — Linux"
echo ""

# ── download to a temp folder ─────────────────────────────────────────────────
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Downloading $APPIMAGE ..."
curl -L --progress-bar -o "$TMP/$APPIMAGE" "$BASE_URL/$APPIMAGE"

# ── install ───────────────────────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
cp "$TMP/$APPIMAGE" "$INSTALL_DIR/$APPIMAGE"
chmod +x "$INSTALL_DIR/$APPIMAGE"

# ── optional desktop entry ────────────────────────────────────────────────────
if command -v update-desktop-database &>/dev/null || [[ -d "$DESKTOP_DIR" ]]; then
  mkdir -p "$DESKTOP_DIR"
  cat > "$DESKTOP_DIR/kathagpt.desktop" <<EOF
[Desktop Entry]
Name=KathaGPT
Exec=$INSTALL_DIR/$APPIMAGE
Type=Application
Categories=Utility;
EOF
  command -v update-desktop-database &>/dev/null && \
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

echo ""
echo "Installed to $INSTALL_DIR/$APPIMAGE"
echo "Launching KathaGPT ..."
"$INSTALL_DIR/$APPIMAGE" &
