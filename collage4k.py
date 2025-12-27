import math
import argparse
from pathlib import Path
from typing import List, Tuple

from PIL import Image

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}


def load_images_from_path(path: Path) -> List[Path]:
    """
    If `path` is a folder → return all images inside.
    If `path` is a file → return that file.
    """
    if path.is_dir():
        return sorted(
            p for p in path.iterdir()
            if p.suffix.lower() in VALID_EXTENSIONS
        )
    elif path.is_file():
        return [path]
    else:
        return []


def load_images_auto(user_inputs: List[str]) -> List[Path]:
    """
    Load images based on user input:
    - If no input → load from ./images/
    - If input is a folder → load all images inside
    - If input is files → load those
    - If mixed → load everything
    """
    if not user_inputs:
        default_folder = Path("images")
        print("No images specified → loading from ./images/")
        return load_images_from_path(default_folder)

    img_paths: List[Path] = []

    for item in user_inputs:
        item_path = Path(item)
        imgs = load_images_from_path(item_path)
        img_paths.extend(imgs)

    return img_paths


def compute_grid(n: int, target_w: int, target_h: int) -> Tuple[int, int]:
    """
    Decide rows/cols trying to minimize empty cells
    and match the target aspect ratio.
    """
    target_ratio = target_w / target_h
    best_rows, best_cols = 1, n
    best_score = float("inf")

    for rows in range(1, n + 1):
        cols = math.ceil(n / rows)
        empty = rows * cols - n
        ratio_diff = abs((cols / rows) - target_ratio)
        score = empty * 10 + ratio_diff

        if score < best_score:
            best_score = score
            best_rows, best_cols = rows, cols

    return best_rows, best_cols


def resize_to_fit_no_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """
    Resize an image to FIT inside the target area:
    - No cropping.
    - Keep aspect ratio (no distortion).
    - May add background around the image.
    """
    w, h = img.size
    # choose the smaller scale so the whole image fits
    scale = min(target_w / w, target_h / h)
    new_w, new_h = int(w * scale), int(h * scale)

    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    return img_resized


def make_collage(
    image_paths: List[Path],
    output_path: Path,
    canvas_w: int = 3840,
    canvas_h: int = 2160,
    bg_color=(0, 0, 0),
) -> None:

    if len(image_paths) < 2:
        raise ValueError("Need at least 2 images to make a collage.")

    n = len(image_paths)
    rows, cols = compute_grid(n, canvas_w, canvas_h)

    cell_w = canvas_w // cols
    cell_h = canvas_h // rows

    collage = Image.new("RGB", (canvas_w, canvas_h), bg_color)

    for idx, path in enumerate(image_paths):
        img = Image.open(path).convert("RGB")
        tile = resize_to_fit_no_crop(img, cell_w, cell_h)

        # center the tile in its cell
        row = idx // cols
        col = idx % cols

        tile_w, tile_h = tile.size
        x = col * cell_w + (cell_w - tile_w) // 2
        y = row * cell_h + (cell_h - tile_h) // 2

        collage.paste(tile, (x, y))

    collage.save(output_path, quality=95)
    print(f"Saved collage with {n} images → {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Create a 4K collage from images (no cropping, no distortion)."
    )
    parser.add_argument(
        "inputs",
        nargs="*",
        help="Image files OR a folder. If none given, uses ./images/"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default="collage_4k.jpg",
        help="Output image file"
    )
    parser.add_argument("--width", type=int, default=3840)
    parser.add_argument("--height", type=int, default=2160)

    args = parser.parse_args()

    image_paths = load_images_auto(args.inputs)

    if not image_paths:
        raise ValueError("No valid images found.")

    make_collage(
        image_paths=image_paths,
        output_path=Path(args.output),
        canvas_w=args.width,
        canvas_h=args.height
    )


if __name__ == "__main__":
    main()
