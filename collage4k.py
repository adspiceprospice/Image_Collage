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
    target_h: int = 2160,
    bg_color=(0, 0, 0),
) -> None:
    """
    Create a collage where the width is fixed but height is dynamic.
    Preserves aspect ratios and minimizes empty space.
    """
    if len(image_paths) < 2:
        raise ValueError("Need at least 2 images to make a collage.")

    n = len(image_paths)

    # 1. Get image sizes and aspect ratios first
    img_specs = []
    for p in image_paths:
        try:
            with Image.open(p) as img:
                w, h = img.size
                img_specs.append({
                    "path": p,
                    "w": w,
                    "h": h,
                    "ratio": w / h
                })
        except Exception as e:
            print(f"Warning: Could not read {p}: {e}")

    if not img_specs:
        raise ValueError("No valid images found to process.")

    n = len(img_specs)

    # 2. Decide rows/cols based on target_h as a hint
    rows, cols = compute_grid(n, canvas_w, target_h)

    # 3. Calculate row layouts
    row_data = []
    total_canvas_h = 0.0

    for r in range(rows):
        start = r * cols
        end = min(start + cols, n)
        row_specs = img_specs[start:end]
        if not row_specs:
            continue

        sum_ratios = sum(s["ratio"] for s in row_specs)

        # Calculate row height if it were to fill the entire canvas_w
        row_h_to_fill = canvas_w / sum_ratios

        # For an incomplete last row (if n is not a multiple of cols),
        # stretching to fill the width might make images look huge.
        # We cap it to the average height of previous rows for better aesthetics.
        is_last_incomplete = (r == rows - 1 and len(row_specs) < cols and r > 0)

        if is_last_incomplete:
            avg_h = total_canvas_h / r
            # Use avg height if the stretched height would be too dramatic
            row_h = min(row_h_to_fill, avg_h)
            should_fill = (row_h == row_h_to_fill)
        else:
            row_h = row_h_to_fill
            should_fill = True

        row_data.append({
            "specs": row_specs,
            "row_h": row_h,
            "should_fill": should_fill
        })
        total_canvas_h += row_h

    # 4. Create canvas and paste images
    collage = Image.new("RGB", (canvas_w, int(total_canvas_h)), bg_color)
    current_y = 0.0

    for row in row_data:
        specs = row["specs"]
        row_h = row["row_h"]
        row_h_int = int(row_h)
        if row_h_int <= 0:
            continue

        if row["should_fill"]:
            current_x = 0
            for i, s in enumerate(specs):
                # Target width for this image
                tw = int(row_h * s["ratio"])
                # Last image fills the remaining pixels in the row
                if i == len(specs) - 1:
                    tw = canvas_w - current_x

                if tw > 0:
                    with Image.open(s["path"]) as img:
                        tile = img.convert("RGB").resize((tw, row_h_int), Image.Resampling.LANCZOS)
                        collage.paste(tile, (current_x, int(current_y)))
                    current_x += tw
        else:
            # Centered partial row
            total_row_w = sum(int(row_h * s["ratio"]) for s in specs)
            current_x = (canvas_w - total_row_w) // 2
            for s in specs:
                tw = int(row_h * s["ratio"])
                if tw > 0:
                    with Image.open(s["path"]) as img:
                        tile = img.convert("RGB").resize((tw, row_h_int), Image.Resampling.LANCZOS)
                        collage.paste(tile, (current_x, int(current_y)))
                    current_x += tw

        current_y += row_h

    collage.save(output_path, quality=95)
    print(f"Saved collage with {n} images ({canvas_w}x{int(total_canvas_h)}) → {output_path}")


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
    parser.add_argument("--width", type=int, default=3840, help="Fixed width of output collage")
    parser.add_argument("--height", type=int, default=2160, help="Target height for grid calculation (results in dynamic output height)")

    args = parser.parse_args()

    image_paths = load_images_auto(args.inputs)

    if not image_paths:
        raise ValueError("No valid images found.")

    make_collage(
        image_paths=image_paths,
        output_path=Path(args.output),
        canvas_w=args.width,
        target_h=args.height
    )


if __name__ == "__main__":
    main()
