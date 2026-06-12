/* 暫用腳本:洋紅色鍵去背 + 依透明空隙自動切層(不進 git) */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

const SRC = '/tmp/vw3d/exploded-raw.png';
const OUT = '/tmp/vw3d';

const img = sharp(SRC).ensureAlpha();
const { width, height } = await img.metadata();
const buf = await img.raw().toBuffer();

/* 色鍵:洋紅程度 = min(r,b) - g
   - m >= 100:純背景 → 全透明
   - 0 < m < 100:把洋紅成分從 r/b 減掉(中性化),高 m 區(玻璃透出的背景)降 alpha 變半透明 */
for (let i = 0; i < buf.length; i += 4) {
  const r = buf[i], g = buf[i + 1], b = buf[i + 2];
  const m = Math.min(r, b) - g;
  if (m >= 100) {
    buf[i + 3] = 0;
  } else if (m > 0) {
    buf[i] = Math.max(0, r - m);
    buf[i + 2] = Math.max(0, b - m);
    if (m > 35) {
      const k = 0.75 - ((m - 35) / 65) * 0.6; /* 35→0.75, 100→0.15 */
      buf[i + 3] = Math.round(buf[i + 3] * k);
    }
  }
}

/* 找垂直空隙:整列 alpha 幾乎為 0 的 row */
const rowOpaque = new Array(height).fill(0);
for (let y = 0; y < height; y++) {
  let n = 0;
  for (let x = 0; x < width; x++) n += buf[(y * width + x) * 4 + 3] > 24 ? 1 : 0;
  rowOpaque[y] = n;
}
const bands = [];
let inBand = false, start = 0;
for (let y = 0; y < height; y++) {
  const solid = rowOpaque[y] > width * 0.012;
  if (solid && !inBand) { inBand = true; start = y; }
  if (!solid && inBand) { inBand = false; if (y - start > 30) bands.push([start, y]); }
}
if (inBand) bands.push([start, height]);

mkdirSync(OUT, { recursive: true });
const manifest = [];
let idx = 0;
for (const [y0, y1] of bands) {
  idx++;
  const pad = 6;
  const top = Math.max(0, y0 - pad);
  const h = Math.min(height, y1 + pad) - top;
  const out = `${OUT}/layer-${idx}.png`;
  await sharp(buf, { raw: { width, height, channels: 4 } })
    .extract({ left: 0, top, width, height: h })
    .png()
    .toFile(out);
  manifest.push({ idx, top, height: h, cy: (top + h / 2) / 2048 });
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ width, height, bands: manifest }, null, 2));
console.log(`bands: ${bands.length}`, JSON.stringify(manifest));
