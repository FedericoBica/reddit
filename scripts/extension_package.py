from __future__ import annotations

import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT / "extension" / "dist"
ARTIFACTS_DIR = ROOT / ".artifacts"


def main() -> None:
    manifest_path = DIST_DIR / "manifest.json"
    if not manifest_path.exists():
        raise SystemExit("Missing extension/dist/manifest.json. Run the extension build first.")

    manifest = json.loads(manifest_path.read_text())
    version = manifest["version"]
    artifact_name = f"reddprowl-extension-v{version}.zip"

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    artifact_path = ARTIFACTS_DIR / artifact_name

    with ZipFile(artifact_path, "w", compression=ZIP_DEFLATED) as archive:
        for file_path in sorted(DIST_DIR.rglob("*")):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(DIST_DIR))

    print(str(artifact_path))


if __name__ == "__main__":
    main()
