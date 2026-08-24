const test = require('node:test');
const assert = require('node:assert/strict');

const {
  A4_PAGE,
  PHOTO_SIZES,
  getOrientedDimensions,
  getPrintQuality,
  packPhotos,
} = require('../layout.js');

test('uses real A4 dimensions and includes common photo formats', () => {
  assert.deepEqual(A4_PAGE, { width: 210, height: 297 });
  assert.deepEqual(PHOTO_SIZES['10x15'], {
    label: '10 × 15 cm',
    width: 100,
    height: 150,
  });
  assert.deepEqual(PHOTO_SIZES['13x18'], {
    label: '13 × 18 cm',
    width: 130,
    height: 180,
  });
});

test('turns a standard size without changing its physical dimensions', () => {
  assert.deepEqual(getOrientedDimensions('10x15', 'portrait'), {
    width: 100,
    height: 150,
  });
  assert.deepEqual(getOrientedDimensions('10x15', 'landscape'), {
    width: 150,
    height: 100,
  });
});

test('packs four 9 × 13 cm portraits onto one A4 sheet', () => {
  const photos = Array.from({ length: 4 }, (_, index) => ({
    id: `photo-${index}`,
    width: 90,
    height: 130,
  }));

  const result = packPhotos(photos, { margin: 5, gap: 3 });

  assert.equal(result.pages.length, 1);
  assert.equal(result.pages[0].length, 4);
  assert.deepEqual(
    result.pages[0].map(({ x, y }) => [x, y]),
    [
      [5, 5],
      [98, 5],
      [5, 138],
      [98, 138],
    ],
  );
});

test('moves photos to new sheets when the selected format no longer fits', () => {
  const photos = Array.from({ length: 5 }, (_, index) => ({
    id: `photo-${index}`,
    width: 150,
    height: 100,
  }));

  const result = packPhotos(photos, { margin: 5, gap: 3 });

  assert.equal(result.pages.length, 3);
  assert.deepEqual(result.pages.map((page) => page.length), [2, 2, 1]);
});

test('keeps every placed photo inside the printable area without overlap', () => {
  const photos = [
    { id: 'large', width: 130, height: 180 },
    { id: 'passport-1', width: 35, height: 45 },
    { id: 'passport-2', width: 35, height: 45 },
    { id: 'square', width: 100, height: 100 },
  ];

  const { pages } = packPhotos(photos, { margin: 5, gap: 3 });

  for (const page of pages) {
    for (const photo of page) {
      assert.ok(photo.x >= 5);
      assert.ok(photo.y >= 5);
      assert.ok(photo.x + photo.width <= 205);
      assert.ok(photo.y + photo.height <= 292);
    }

    for (let firstIndex = 0; firstIndex < page.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < page.length; secondIndex += 1) {
        const first = page[firstIndex];
        const second = page[secondIndex];
        const separated =
          first.x + first.width + 3 <= second.x ||
          second.x + second.width + 3 <= first.x ||
          first.y + first.height + 3 <= second.y ||
          second.y + second.height + 3 <= first.y;

        assert.ok(separated, `${first.id} overlaps ${second.id}`);
      }
    }
  }
});

test('reports a photo that cannot fit inside the printable A4 area', () => {
  const result = packPhotos(
    [{ id: 'oversized', width: 205, height: 287 }],
    { margin: 5, gap: 3 },
  );

  assert.deepEqual(result.pages, []);
  assert.deepEqual(result.unplaced.map(({ id }) => id), ['oversized']);
});

test('warns when source pixels are below 300 dpi for the selected print size', () => {
  assert.deepEqual(getPrintQuality(1181, 1772, 100, 150), {
    dpi: 300,
    level: 'good',
  });
  assert.deepEqual(getPrintQuality(600, 900, 100, 150), {
    dpi: 152,
    level: 'low',
  });
});
