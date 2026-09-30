import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const PURPLE = [0xba, 0xa3, 0xd0, 255];
const INK = [0x14, 0x14, 0x16, 255];

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function sdRoundBox(x, y, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(x - cx) - (halfW - radius);
  const dy = Math.abs(y - cy) - (halfH - radius);
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - radius;
}

function coverage(distance) {
  return Math.max(0, Math.min(1, 0.5 - distance));
}

function blend(dst, src, alpha) {
  const out = src[3] / 255 * alpha;
  const keep = 1 - out;
  dst[0] = src[0] * out + dst[0] * keep;
  dst[1] = src[1] * out + dst[1] * keep;
  dst[2] = src[2] * out + dst[2] * keep;
  dst[3] = 255;
}

function paint(size, { maskable }) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = size / 512;
  const shapes = maskable
    ? [
        { x: 256, y: 256, w: 168, h: 36, r: 18 },
        { x: 168, y: 256, w: 34, h: 168, r: 14 },
        { x: 214, y: 256, w: 26, h: 118, r: 12 },
        { x: 344, y: 256, w: 34, h: 168, r: 14 },
        { x: 298, y: 256, w: 26, h: 118, r: 12 },
      ]
    : [
        { x: 256, y: 256, w: 250, h: 52, r: 26 },
        { x: 132, y: 256, w: 48, h: 236, r: 18 },
        { x: 196, y: 256, w: 36, h: 168, r: 14 },
        { x: 380, y: 256, w: 48, h: 236, r: 18 },
        { x: 316, y: 256, w: 36, h: 168, r: 14 },
      ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const pixel = [INK[0], INK[1], INK[2], 255];
      const sx = (x + 0.5) / scale;
      const sy = (y + 0.5) / scale;
      let plate = 0;
      for (const shape of shapes) {
        plate = Math.max(
          plate,
          coverage(sdRoundBox(sx, sy, shape.x, shape.y, shape.w / 2, shape.h / 2, shape.r))
        );
      }
      blend(pixel, PURPLE, plate);
      const offset = (y * size + x) * 4;
      pixels[offset] = Math.round(pixel[0]);
      pixels[offset + 1] = Math.round(pixel[1]);
      pixels[offset + 2] = Math.round(pixel[2]);
      pixels[offset + 3] = 255;
    }
  }
  return png(size, size, pixels);
}

const outputs = [
  ["public/icon-192.png", 192, false],
  ["public/icon-512.png", 512, false],
  ["public/icon.png", 192, false],
  ["public/icon-maskable-512.png", 512, true],
];

for (const [file, size, maskable] of outputs) {
  writeFileSync(file, paint(size, { maskable }));
  console.log(file, size);
}
