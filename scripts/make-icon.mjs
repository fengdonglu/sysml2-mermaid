import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const W = 128;
const H = 128;
const px = Buffer.alloc(W * H * 4, 0);

const BLUE = [31, 111, 235, 255];
const WHITE = [255, 255, 255, 255];

function set(x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
}
function rect(x, y, w, h, color) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, color);
}
function roundRect(x, y, w, h, r, color) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const dx = Math.min(i - x, x + w - 1 - i);
      const dy = Math.min(j - y, y + h - 1 - j);
      if (dx < r && dy < r && Math.hypot(r - dx - 0.5, r - dy - 0.5) > r) continue;
      set(i, j, color);
    }
  }
}
function line(x0, y0, x1, y1, color, t = 3) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    rect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, color);
  }
}

// Background and a small block hierarchy.
roundRect(0, 0, W, H, 22, BLUE);
line(64, 40, 64, 58, WHITE, 4);
line(64, 58, 39, 76, WHITE, 4);
line(64, 58, 89, 76, WHITE, 4);
rect(50, 24, 28, 16, WHITE);
rect(24, 76, 30, 18, WHITE);
rect(74, 76, 30, 18, WHITE);

// Minimal PNG encoder (IHDR/IDAT/IEND) with zlib + CRC32.
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type RGBA
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0; // filter: none
  px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = fileURLToPath(new URL('../packages/vscode-sysml/icon.png', import.meta.url));
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
