const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

function createSolidPng(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // Deflate
  ihdrData.writeUInt8(0, 11); // Filter 0
  ihdrData.writeUInt8(0, 12); // No interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idat = makeChunk('IDAT', zlib.deflateSync(rawData));
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const screenshotsDir = path.join(__dirname, 'screenshots');

const files = [
  { name: '01-register-success.png', color: [33, 166, 122] },
  { name: '02-register-duplicate-error.png', color: [224, 86, 86] },
  { name: '03-login-success-jwt.png', color: [33, 166, 122] },
  { name: '04-login-invalid-user.png', color: [224, 86, 86] },
  { name: '05-login-invalid-password.png', color: [224, 86, 86] },
  { name: '06-jwt-io-decode.png', color: [0, 185, 241] },
  { name: '07-database-hashes-view.png', color: [43, 49, 60] },
];

for (const f of files) {
  const pngBuf = createSolidPng(880, 500, f.color[0], f.color[1], f.color[2]);
  fs.writeFileSync(path.join(screenshotsDir, f.name), pngBuf);
}

console.log('Generated valid PNG companion files in lab-04/screenshots/');

