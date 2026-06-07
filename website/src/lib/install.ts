import { SITE } from "./site";
import type { PlatformId } from "./site";

const v = SITE.version;

export const INSTALL_FILES = {
  "mac-arm": `KathaGPT_${v}_aarch64.dmg`,
  "mac-intel": `KathaGPT_${v}_x64.dmg`,
  linux: `KathaGPT_${v}_amd64.AppImage`,
} as const;

export const MAC_INSTALL_ARM = `hdiutil attach ~/Downloads/${INSTALL_FILES["mac-arm"]} -nobrowse -readonly && \\
VOL=$(ls -d /Volumes/KathaGPT* | head -1) && \\
ditto "$VOL/KathaGPT.app" /Applications/KathaGPT.app && \\
xattr -cr /Applications/KathaGPT.app && \\
hdiutil detach "$VOL" -quiet && \\
open /Applications/KathaGPT.app`;

export const MAC_INSTALL_INTEL = `hdiutil attach ~/Downloads/${INSTALL_FILES["mac-intel"]} -nobrowse -readonly && \\
VOL=$(ls -d /Volumes/KathaGPT* | head -1) && \\
ditto "$VOL/KathaGPT.app" /Applications/KathaGPT.app && \\
xattr -cr /Applications/KathaGPT.app && \\
hdiutil detach "$VOL" -quiet && \\
open /Applications/KathaGPT.app`;

export const MAC_QUICK_FIX =
  "xattr -cr /Applications/KathaGPT.app && open -a KathaGPT";

export const LINUX_INSTALL = `chmod +x ~/Downloads/${INSTALL_FILES.linux}
~/Downloads/${INSTALL_FILES.linux}`;

export const INSTALL_SETUP_ID = "install-setup";

export function installAnchorForPlatform(platform: PlatformId): string {
  switch (platform) {
    case "mac-intel":
      return "install-macos-intel";
    case "linux":
      return "install-linux";
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
