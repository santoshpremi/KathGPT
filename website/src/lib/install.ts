import { SITE } from "./site";
import type { PlatformId } from "./site";

const v = SITE.version;

export const INSTALL_FILES = {
  "mac-arm": `KathaGPT_${v}_aarch64.dmg`,
  "mac-intel": `KathaGPT_${v}_x64.dmg`,
  windows: `KathaGPT_${v}_x64-setup.exe`,
  linux: `KathaGPT_${v}_amd64.AppImage`,
} as const;

/** One-line curl installer — downloads, installs, and opens automatically. */
export const MAC_CURL_INSTALL = `curl -fsSL https://santoshpremi.github.io/KathaGPT/install.sh | bash`;

/** Smart find — works even with duplicate downloads or files saved elsewhere. */
export const MAC_SMART_INSTALL = `bash <(curl -fsSL https://santoshpremi.github.io/KathaGPT/downloads/install-macos.sh)`;

export const MAC_QUICK_FIX =
  "xattr -cr /Applications/KathaGPT.app && open -a KathaGPT";

/** One-line curl installer for Linux — downloads AppImage, installs to ~/.local/bin, launches. */
export const LINUX_CURL_INSTALL = `curl -fsSL https://santoshpremi.github.io/KathaGPT/install-linux.sh | bash`;

/** Smart find — works even with duplicate downloads or files saved elsewhere. */
export const LINUX_SMART_INSTALL = `bash <(curl -fsSL https://santoshpremi.github.io/KathaGPT/downloads/install-linux.sh)`;

/** One-line PowerShell installer — downloads and runs the NSIS setup. */
export const WINDOWS_CURL_INSTALL = `irm https://santoshpremi.github.io/KathaGPT/install-windows.ps1 | iex`;

/** Smart find — locates KathaGPT*.exe or *.msi in Downloads / Desktop. */
export const WINDOWS_SMART_INSTALL = `irm https://santoshpremi.github.io/KathaGPT/downloads/install-windows.ps1 | iex`;

export const LINUX_INSTALL = `chmod +x ~/Downloads/${INSTALL_FILES.linux}
~/Downloads/${INSTALL_FILES.linux}`;

export const INSTALL_SETUP_ID = "install-setup";

export function installAnchorForPlatform(platform: PlatformId): string {
  switch (platform) {
    case "mac-intel":
      return "install-macos-intel";
    case "linux":
      return "install-linux";
    case "windows":
      return "install-windows";
    case "mac-arm":
    default:
      return "install-macos-arm";
  }
}

/** Scroll to Install Setup after a download starts. */
export function navigateToInstallSetup(platform?: PlatformId): void {
  const anchor = platform ? installAnchorForPlatform(platform) : INSTALL_SETUP_ID;

  requestAnimationFrame(() => {
    window.history.pushState(null, "", `#${anchor}`);
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
