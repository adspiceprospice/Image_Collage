# Image Collage Maker (4K, No Cropping, Auto Layout)

A lightweight Python tool that takes **2–10+ images** and automatically generates a clean **4K collage** while:

- ✅ Preserving the original aspect ratio  
- ✅ **Never cropping**  
- ✅ Never distorting  
- ✅ Automatically choosing the best grid layout  
- ✅ Centering each image in its cell  
- ✅ Auto-loading all images from `./images/` when no input is provided  

Perfect for preparing grouped visual inputs for LLMs, summarizing video frames, building moodboards, or combining UI screenshots.

---

## Features

- 🖼 **No cropping** — all images remain intact  
- 🎯 Aspect-ratio–preserving resize  
- 🧠 Smart grid calculation based on number of images + aspect ratio  
- 📁 Automatic folder detection  
- 📥 Supports: `jpg`, `jpeg`, `png`, `webp`, `bmp`, `tiff`  
- 📤 Outputs a single high-resolution collage (default: 3840×2160)

---

## Installation

```bash
git clone https://github.com/<your-repo>/collage-maker.git
cd collage-maker
pip install pillow


## Usage

### 1. Default: Auto-load images from `./images/`
Runs naturally if you just want to drop images into a folder.

```bash
python collage4k.py
```

The script will:
- Look for an `images` folder in the project root
- Load all valid images
- Save a 4K collage as `collage_4k.jpg`

### 2. Use specific images
You can pass file paths directly.

```bash
python collage4k.py img1.jpg img2.jpg img3.png
```

### 3. Use a folder of images
Point to any directory containing images.

```bash
python collage4k.py screenshots/
```

### 4. Custom output filename
Specify where to save the result.

```bash
python collage4k.py images/ -o ui_collage.jpg
```

### 5. Custom canvas resolution
Change the default 4K (3840×2160) canvas size.

```bash
python collage4k.py images/ --width 2048 --height 2048
```

## How It Works

1. **Auto-Detection**: The script detects how many images are provided.
2. **Smart Grid**: It dynamically calculates an optimal grid layout (rows × cols) that:
   - Minimizes empty cells
   - Matches the target aspect ratio (default 16:9)
3. **Image Processing**:
   - Each image is scaled to **fit** inside its cell
   - Images are **never cropped** and **never distorted**
   - Images are centered within the cell (black background by default)
4. **Export**: The final result is saved as a high-resolution image.

---

## Why This Tool Exists

If you're sending images to LLMs (ChatGPT, Claude, Gemini), combining them into a single 4K collage has major advantages:

- 🚀 **Faster uploads** (1 file vs 10)
- 💰 **Lower token cost** for multimodal models
- 🧠 **More coherent context** for the model
- 🔗 **Easier referencing** ("top-left image", "bottom-right", etc.)

### Ideal for:
- 📱 UI/UX reviews & history
- 📹 Multi-frame video analysis
- 📝 Process documentation
- 📸 Screenshot summaries
- 🆚 Product comparison layouts

## Supported File Formats
- `.jpg`, `.jpeg`
- `.png`
- `.webp`
- `.bmp`
- `.tiff`

Made with ❤️ by [Adrian](https://github.com/adspiceprospice) and [ChatGPT 5.2](https://chat.openai.com/)