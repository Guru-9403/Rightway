const fs = require('fs');
const path = require('path');

// Read PNG/JPEG/WEBP dimensions
function getDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return { type: 'PNG', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { type: 'GIF', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunkType = buf.toString('ascii', 12, 16);
    if (chunkType === 'VP8 ') {
      const width = buf.readUInt16LE(26) & 0x3fff;
      const height = buf.readUInt16LE(28) & 0x3fff;
      return { type: 'WEBP (VP8)', width, height };
    } else if (chunkType === 'VP8L') {
      const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { type: 'WEBP (VP8L)', width, height };
    } else if (chunkType === 'VP8X') {
      const width = 1 + buf.readUIntLE(24, 3);
      const height = 1 + buf.readUIntLE(27, 3);
      return { type: 'WEBP (VP8X)', width, height };
    }
  }
  // JPEG
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xFF) { offset++; continue; }
      const marker = buf[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { type: 'JPEG', width, height };
      }
      const len = buf.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }
  return { type: 'UNKNOWN', width: 0, height: 0 };
}

const dir = 'd:/rw/rightway-vanilla/images/New folder';
const files = fs.readdirSync(dir);
for (const f of files) {
  const p = path.join(dir, f);
  console.log(f, getDimensions(p));
}
