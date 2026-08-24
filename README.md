# Paperframe

Paperframe is a small, privacy-first browser app for arranging multiple photos on real-size A4 sheets. Choose a standard print size for each image, preview the resulting pages, and print several photos on one sheet of photo paper.

Made by [CuriosityAI.nl](https://curiosityai.nl).

## Features

- Uses real A4 dimensions: 210 × 297 mm.
- Applies a standard print size to each photo individually or to every photo at once.
- Supports portrait and landscape photo frames.
- Automatically moves photos onto additional A4 sheets when needed.
- Preserves each image without cropping or distortion.
- Shows an estimated print DPI and warns below the recommended 300 dpi.
- Adds light trim outlines at the selected photo dimensions.
- Keeps all images in the browser; nothing is uploaded.
- Works without a build step, account, server, or runtime dependency.

## Quick start

Download or clone the repository:

```bash
git clone https://github.com/adspiceprospice/Image_Collage.git
cd Image_Collage
```

Open `index.html` in a modern browser. That is enough to use the app.

If your browser restricts local files, start a small local server instead:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Create a print sheet

1. Drag photos into the upload area or select **Choose photos**.
2. Choose a print size for each photo.
3. Use **Set every photo to** when all images should have the same size.
4. Turn individual frames between portrait and landscape when needed.
5. Check the live A4 preview and DPI indicators.
6. Select **Print A4 sheets**.

The app uses a 5 mm safe margin around the sheet and 3 mm spacing between photos. Changing a photo’s size or orientation immediately recalculates its placement.

## Print settings

Use these options in the browser print dialog:

| Setting | Value |
| --- | --- |
| Paper size | A4 |
| Orientation | Portrait |
| Scale | 100% or **Actual size** |
| Margins | None |
| Headers and footers | Off |

The light grey outlines mark the selected photo dimensions for trimming. A printer with a large non-printable area may still reduce or clip content; check the print preview before using photo paper.

## Included photo sizes

| Format | Dimensions |
| --- | --- |
| Passport | 35 × 45 mm |
| 9 × 13 cm | 90 × 130 mm |
| Square | 100 × 100 mm |
| 10 × 15 cm | 100 × 150 mm |
| A6 | 105 × 148 mm |
| 13 × 18 cm | 130 × 180 mm |
| 5 × 7 in | 127 × 178 mm |

Images are fitted inside the selected dimensions without cropping. If the source aspect ratio differs from the print frame, the result contains white space.

## Privacy

Paperframe processes images locally with browser APIs. It does not send photos, filenames, or layout data to a server. Reloading or closing the page clears the current session.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Accessible application markup and browser entry point |
| `app.js` | Upload, editor, preview, and print interactions |
| `layout.js` | Standard photo sizes, DPI calculation, and A4 packing |
| `styles.css` | Responsive screen interface and physical print styles |
| `tests/` | Node.js regression tests for layout and print rules |
| `favicon.svg` | Paperframe browser icon |
| `collage4k.py` | Separate legacy command-line tool for free-form 4K collages |

## Development

The browser app uses plain HTML, CSS, and JavaScript. It has no package installation or build step.

Run all regression tests with a current Node.js release:

```bash
node --test tests/*.test.js
```

Check the JavaScript syntax separately when changing browser code:

```bash
node --check app.js
node --check layout.js
```

## Legacy 4K collage tool

`collage4k.py` is independent of the A4 printing app. It creates a free-form high-resolution collage and requires Python plus Pillow:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install Pillow
python collage4k.py
```

Pass image files or a directory explicitly, or place images in `./images/`. Run `python collage4k.py --help` for all options.

## Contributing

Issues and focused pull requests are welcome.

1. Fork the repository and create a branch for one change.
2. Preserve the dependency-free browser workflow.
3. Add or update a regression test when behavior changes.
4. Run `node --test tests/*.test.js`.
5. Keep generated collages, uploaded images, and QA artifacts out of commits.

## License

This repository does not currently include a license file. The project owner must add the intended open-source license before others can legally copy, modify, or redistribute the code.

## Credits

Made by [CuriosityAI.nl](https://curiosityai.nl).
