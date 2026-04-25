from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "icono-colors.png"
OUTPUT_DIR = ROOT / "extension" / "public" / "icons"
SIZES = [16, 32, 48, 128]


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source icon: {SOURCE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with Image.open(SOURCE) as image:
        rgba = image.convert("RGBA")

        for size in SIZES:
            resized = rgba.resize((size, size), Image.LANCZOS)
            resized.save(OUTPUT_DIR / f"icon-{size}.png", format="PNG")

    print(f"Generated extension icons in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
