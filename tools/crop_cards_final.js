const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 8;
  let width, height, colorType;
  const idatChunks = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') idatChunks.push(data);
    else if (type === 'IEND') break;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let srcOffset = 0;
  let prevRow = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[srcOffset++];
    const row = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const raw = decompressed[srcOffset++];
      const a = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0;
      const b = prevRow[i];
      const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;
      let val = 0;
      if (filterType === 0) val = raw;
      else if (filterType === 1) val = (raw + a) & 0xff;
      else if (filterType === 2) val = (raw + b) & 0xff;
      else if (filterType === 3) val = (raw + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (raw + pr) & 0xff;
      }
      row[i] = val;
    }
    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;
      const srcIdx = x * bytesPerPixel;
      if (bytesPerPixel === 4) {
        pixels[dstIdx] = row[srcIdx];
        pixels[dstIdx + 1] = row[srcIdx + 1];
        pixels[dstIdx + 2] = row[srcIdx + 2];
        pixels[dstIdx + 3] = row[srcIdx + 3];
      } else {
        pixels[dstIdx] = row[srcIdx];
        pixels[dstIdx + 1] = row[srcIdx + 1];
        pixels[dstIdx + 2] = row[srcIdx + 2];
        pixels[dstIdx + 3] = 255;
      }
    }
    prevRow = row;
  }
  return { width, height, pixels };
}

function encodePNG(cropPixels, width, height) {
  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));
  let dstIdx = 0;
  for (let y = 0; y < height; y++) {
    rawData[dstIdx++] = 0;
    cropPixels.copy(rawData, dstIdx, y * stride, (y + 1) * stride);
    dstIdx += stride;
  }
  const compressed = zlib.deflateSync(rawData);
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function crop(src, x, y, w, h) {
  x = Math.round(Math.max(0, Math.min(src.width - 1, x)));
  y = Math.round(Math.max(0, Math.min(src.height - 1, y)));
  w = Math.round(Math.min(w, src.width - x));
  h = Math.round(Math.min(h, src.height - y));
  const cropPixels = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    const srcStart = ((y + row) * src.width + x) * 4;
    const srcEnd = srcStart + w * 4;
    src.pixels.copy(cropPixels, row * w * 4, srcStart, srcEnd);
  }
  return encodePNG(cropPixels, w, h);
}

const srcImg = decodePNG('d:/rw/rightway-vanilla/images/rightway_cards_reference.png');

// Find the red boxes for cards
// In this image, each card has a red rounded border.
// Let's sample inside each cell of a 5x3 grid:
// Top is at y = 165
// Bottom of 5th row is at y = 770
// Card height is approx 115 px, gap is approx 7 px.
// Row tops:
// Row 0: y ~ 166
// Row 1: y ~ 290
// Row 2: y ~ 413
// Row 3: y ~ 536
// Row 4: y ~ 660

// Columns:
// Col 0: x ~ 9, w ~ 114
// Col 1: x ~ 129, w ~ 114
// Col 2: x ~ 249, w ~ 114

const rowTops = [166, 290, 413, 536, 660];
const cols = [
  { x: 9, w: 114 },
  { x: 129, w: 114 },
  { x: 249, w: 114 }
];

const cards = [
  { id: "ui_ux_design", name: "UI/UX design", row: 0, col: 0 },
  { id: "ui_ux_architect", name: "UI/UX Architect", row: 0, col: 1 },
  { id: "graphic_design", name: "Graphic design", row: 0, col: 2 },

  { id: "industrial_design", name: "Industrial design", row: 1, col: 0 },
  { id: "python", name: "Python", row: 1, col: 1 },
  { id: "machine_learn", name: "Machine learn", row: 1, col: 2 },

  { id: "python_ml", name: "Python & ML", row: 2, col: 0 },
  { id: "medical_coding", name: "Medical coding", row: 2, col: 1 },
  { id: "office_accounting", name: "Office Accounting", row: 2, col: 2 },

  { id: "tally", name: "Tally", row: 3, col: 0 },
  { id: "excel", name: "Excel", row: 3, col: 1 },
  { id: "adobe_illustrator", name: "Adobe illustrator", row: 3, col: 2 },

  { id: "adobe_photoshop", name: "Adobe Photoshop", row: 4, col: 0 },
  { id: "coreldraw", name: "Coreldraw", row: 4, col: 1 }
];

const outDir = 'd:/rw/rightway-vanilla/images/courses';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

cards.forEach(c => {
  const col = cols[c.col];
  const rowY = rowTops[c.row];
  // Inside the card, the image is at:
  // x = col.x + 1, y = rowY + 1
  // width = col.w - 2 (approx 112px)
  // height = approx 68px (the top image preview of each card)
  const imgPng = crop(srcImg, col.x + 2, rowY + 2, col.w - 4, 68);
  fs.writeFileSync(path.join(outDir, `${c.id}.png`), imgPng);

  // Also save the whole card (including title & button) just in case
  const fullCardPng = crop(srcImg, col.x, rowY, col.w, 116);
  fs.writeFileSync(path.join(outDir, `${c.id}_card.png`), fullCardPng);
});

console.log(`Saved all 14 cropped card images into ${outDir}`);
