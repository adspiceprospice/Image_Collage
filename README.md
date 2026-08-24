# Paperframe

Paperframe arranges multiple photos on real-size A4 sheets for home printing. It runs entirely in the browser: photos stay on your device and no installation or upload is required.

## Use it now

1. Open `index.html` in a modern browser.
2. Choose or drag in any number of images.
3. Pick a standard print size for each photo, or use **Apply to all**.
4. Turn individual photo frames between portrait and landscape when needed.
5. Select **Print A4 sheets**.
6. In the browser print dialog, use:
   - A4 paper
   - Portrait orientation
   - 100% or **Actual size** scale
   - No margins

The light grey outlines mark the selected photo dimensions for trimming. Images are fitted inside those dimensions without cropping or distortion, so a photo with a different aspect ratio may have white space.

## Included print sizes

- Passport — 3.5 × 4.5 cm
- 9 × 13 cm
- Square — 10 × 10 cm
- 10 × 15 cm
- A6 — 10.5 × 14.8 cm
- 13 × 18 cm
- 5 × 7 in — 12.7 × 17.8 cm

Paperframe uses a 5 mm A4 safe margin and 3 mm spacing between photos. If the chosen sizes do not fit on one sheet, it creates additional sheets automatically. The DPI indicator warns when an image is below the recommended 300 dpi at its chosen print size.

## Development and verification

No packages are required. If you prefer to serve the files instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Run the layout tests with Node.js:

```bash
node --test tests/*.test.js
```

The earlier `collage4k.py` command-line tool is still included for generating free-form screen collages. It is separate from the A4 printing app and requires Pillow.
