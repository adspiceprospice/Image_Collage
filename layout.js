(function exposeLayout(root, factory) {
  const layout = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = layout;
  }

  if (root) {
    root.PrintStudioLayout = layout;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createLayout() {
  const A4_PAGE = Object.freeze({ width: 210, height: 297 });

  const PHOTO_SIZES = Object.freeze({
    passport: Object.freeze({ label: 'Passport · 3.5 × 4.5 cm', width: 35, height: 45 }),
    '9x13': Object.freeze({ label: '9 × 13 cm', width: 90, height: 130 }),
    '10x10': Object.freeze({ label: 'Square · 10 × 10 cm', width: 100, height: 100 }),
    '10x15': Object.freeze({ label: '10 × 15 cm', width: 100, height: 150 }),
    a6: Object.freeze({ label: 'A6 · 10.5 × 14.8 cm', width: 105, height: 148 }),
    '13x18': Object.freeze({ label: '13 × 18 cm', width: 130, height: 180 }),
    '5x7': Object.freeze({ label: '5 × 7 in · 12.7 × 17.8 cm', width: 127, height: 178 }),
  });

  function getOrientedDimensions(sizeId, orientation) {
    const size = PHOTO_SIZES[sizeId];

    if (!size) {
      throw new Error(`Unknown photo size: ${sizeId}`);
    }

    const shortSide = Math.min(size.width, size.height);
    const longSide = Math.max(size.width, size.height);

    if (orientation === 'landscape') {
      return { width: longSide, height: shortSide };
    }

    return { width: shortSide, height: longSide };
  }

  function rectanglesAreSeparated(first, second, gap) {
    return (
      first.x + first.width + gap <= second.x ||
      second.x + second.width + gap <= first.x ||
      first.y + first.height + gap <= second.y ||
      second.y + second.height + gap <= first.y
    );
  }

  function findPosition(photo, placed, margin, gap) {
    const maxX = A4_PAGE.width - margin;
    const maxY = A4_PAGE.height - margin;
    const xCandidates = new Set([margin]);
    const yCandidates = new Set([margin]);

    for (const item of placed) {
      xCandidates.add(item.x + item.width + gap);
      yCandidates.add(item.y + item.height + gap);
    }

    const candidates = [];
    for (const y of yCandidates) {
      for (const x of xCandidates) {
        candidates.push({ x, y });
      }
    }

    candidates.sort((first, second) => first.y - second.y || first.x - second.x);

    return candidates.find(({ x, y }) => {
      const candidate = { ...photo, x, y };
      const isInsidePage = x + photo.width <= maxX && y + photo.height <= maxY;

      return (
        isInsidePage &&
        placed.every((existing) => rectanglesAreSeparated(candidate, existing, gap))
      );
    });
  }

  function packPhotos(photos, options = {}) {
    const margin = options.margin ?? 5;
    const gap = options.gap ?? 3;
    const printableWidth = A4_PAGE.width - margin * 2;
    const printableHeight = A4_PAGE.height - margin * 2;
    const pages = [];
    const unplaced = [];

    for (const photo of photos) {
      if (photo.width > printableWidth || photo.height > printableHeight) {
        unplaced.push(photo);
        continue;
      }

      let placement = null;
      let targetPage = null;

      for (const page of pages) {
        const position = findPosition(photo, page, margin, gap);
        if (position) {
          placement = { ...photo, ...position };
          targetPage = page;
          break;
        }
      }

      if (!placement) {
        targetPage = [];
        pages.push(targetPage);
        placement = { ...photo, x: margin, y: margin };
      }

      targetPage.push(placement);
    }

    return { pages, unplaced };
  }

  function getPrintQuality(pixelWidth, pixelHeight, widthMm, heightMm) {
    const horizontalDpi = pixelWidth / (widthMm / 25.4);
    const verticalDpi = pixelHeight / (heightMm / 25.4);
    const dpi = Math.round(Math.min(horizontalDpi, verticalDpi));

    return {
      dpi,
      level: dpi >= 300 ? 'good' : 'low',
    };
  }

  return {
    A4_PAGE,
    PHOTO_SIZES,
    getOrientedDimensions,
    getPrintQuality,
    packPhotos,
  };
});
