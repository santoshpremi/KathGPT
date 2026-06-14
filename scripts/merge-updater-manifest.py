#!/usr/bin/env python3
"""Merge per-platform latest.json files from Tauri updater builds into one manifest."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "artifacts")
    manifests = sorted(root.rglob("latest.json"))
    if not manifests:
        print("No latest.json files found under", root, file=sys.stderr)
        return 1

    merged: dict = {"version": "", "notes": "", "pub_date": "", "platforms": {}}

    for path in manifests:
        data = json.loads(path.read_text())
        if not merged["version"]:
            merged["version"] = data.get("version", "")
            merged["notes"] = data.get("notes", "")
            merged["pub_date"] = data.get("pub_date", "")
        merged["platforms"].update(data.get("platforms", {}))

    if not merged["platforms"]:
        print("No platforms found in manifests", file=sys.stderr)
        return 1

    out = Path("latest.json")
    out.write_text(json.dumps(merged, indent=2) + "\n")
    print(f"Merged {len(manifests)} manifest(s) → {out} ({len(merged['platforms'])} platforms)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
