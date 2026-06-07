#!/bin/bash
# KathaGPT Linux installer — smart search for existing AppImage.
# Searches ~/Downloads, ~/Desktop, and ~ for the newest KathaGPT*.AppImage.
# Usage:
#   bash install-linux.sh                         (auto-find AppImage)
#   bash install-linux.sh ~/path/to/file.AppImage  (explicit path)
set -euo pipefail

APPIMAGE_NAME="KathaGPT.AppImage"
INSTALL_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"

# ── find the newest KathaGPT AppImage in common locations ────────────────────
find_appimage() {
  local found
  # Search Downloads, Desktop, home root — handles renamed copies like (1), (2)
  found=$(find "$HOME/Downloads" "$HOME/Desktop" "$HOME" \
          -maxdepth 2 -name "KathaGPT*.AppImage" 2>/dev/null \
          | sort -V | tail -1 || true)

  if [[ -n "$found" && -f "$found" ]]; then
    echo "$found"
    return
  fi

  echo "No KathaGPT AppImage found in ~/Downloads, ~/Desktop, or ~." >&2
  echo "Pass the path explicitly:" >&2
  echo "  bash install-linux.sh ~/path/to/KathaGPT_0.1.0_amd64.AppImage" >&2
  exit 1
}

SRC_PATH="${1:-$(find_appimage)}"
echo "Using: $SRC_PATH"

# ── install ───────────────────────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
cp "$SRC_PATH" "$INSTALL_DIR/$APPIMAGE_NAME"
chmod +x "$INSTALL_DIR/$APPIMAGE_NAME"

# ── optional desktop entry ────────────────────────────────────────────────────
if command -v update-desktop-database &>/dev/null || [[ -d "$DESKTOP_DIR" ]]; then
  mkdir -p "$DESKTOP_DIR"
  cat > "$DESKTOP_DIR/kathagpt.desktop" <<EOF
[Desktop Entry]
Name=KathaGPT
Exec=$INSTALL_DIR/$APPIMAGE_NAME
Type=Application
Categories=Utility;
EOF
  command -v update-desktop-database &>/dev/null && \
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

echo "Installed to $INSTALL_DIR/$APPIMAGE_NAME"
echo "Launching KathaGPT ..."
"$INSTALL_DIR/$APPIMAGE_NAME" &
