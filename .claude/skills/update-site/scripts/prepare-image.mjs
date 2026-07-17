#!/usr/bin/env node
/**
 * 把 Ivy 的原圖處理成適合上網站的樣子,放進 src/assets/。
 *
 * 為什麼需要這支而不是直接複製檔案:
 * 1. EXIF 裡有 GPS 座標 —— 手機拍的照片會記錄拍攝地點。那是她家、她客戶家。
 *    直接上公開網站等於把地址公開。sharp 預設就會洗掉 metadata,這支明確依賴那個行為。
 * 2. 手機原圖動輒 5-12MB、4000px 寬。Astro 建置時會轉 webp,但原檔還是會進 git,
 *    repo 會越來越肥(這個 repo 就曾經有 25MB 沒人用的 PNG 躺在 public/)。
 * 3. HEIC(iPhone 預設格式)瀏覽器不吃,要轉。
 *
 * 用法:
 *   node scripts/prepare-image.mjs --from <原圖> --to src/assets/about/05.jpg
 *   node scripts/prepare-image.mjs --from <原圖> --to <目標> --max 2400
 *
 * DRY_RUN=1 → 只印出會做什麼,不寫檔。
 */

import { existsSync, statSync, mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import sharp from 'sharp';

const DRY = process.env.DRY_RUN === '1';

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const from = arg('from');
const to = arg('to');
const max = parseInt(arg('max', '2400'), 10);
const quality = parseInt(arg('quality', '82'), 10);

if (!from || !to) {
  console.error('用法:node scripts/prepare-image.mjs --from <原圖> --to <src/assets/…/檔名.jpg>');
  console.error('');
  console.error('  --max      最長邊上限,預設 2400(網站不需要更大,hero 滿版也夠)');
  console.error('  --quality  壓縮品質,預設 82');
  process.exit(1);
}

if (!existsSync(from)) {
  console.error(`找不到這張圖:${from}`);
  console.error('請跟 Ivy 確認檔案位置,不要自己猜一個路徑。');
  process.exit(1);
}

// 目標一定要在 src/assets 底下 —— public/ 不經 Astro 優化會原樣部署,
// 這個 repo 吃過這個虧(25MB 的 PNG 直接掛在線上)。
const toAbs = resolve(to);
if (!toAbs.includes('/src/assets/')) {
  console.error(`目標必須在 src/assets/ 底下,你給的是:${to}`);
  console.error('放 public/ 的圖不會被壓縮,會原樣部署到線上,拖慢載入。');
  process.exit(1);
}

const ext = extname(toAbs).toLowerCase();
if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
  console.error(`目標副檔名要是 .jpg / .jpeg / .png,你給的是:${ext || '(沒有)'}`);
  console.error('不用自己轉 webp —— Astro 建置時會自動轉,而且會產生多種尺寸。');
  process.exit(1);
}

const src = sharp(from, { failOn: 'none' });
const meta = await src.metadata();
const beforeKB = Math.round(statSync(from).size / 1024);

const willResize = Math.max(meta.width ?? 0, meta.height ?? 0) > max;

// 有哪些 metadata 會被洗掉 —— 印出來讓人看見這一步真的有做事
const sensitive = [];
if (meta.exif) sensitive.push('EXIF(可能含 GPS 拍攝地點、相機序號)');
if (meta.icc) sensitive.push('ICC 色彩描述檔');
if (meta.iptc) sensitive.push('IPTC');
if (meta.xmp) sensitive.push('XMP');

console.log(`原圖:${from}`);
console.log(`  ${meta.width}×${meta.height} ${meta.format} ${beforeKB} KB`);
if (sensitive.length) {
  console.log(`  會洗掉:${sensitive.join('、')}`);
} else {
  console.log('  沒有偵測到 EXIF/IPTC 等 metadata');
}
console.log(`目標:${to}`);
console.log(`  ${willResize ? `縮到最長邊 ${max}px` : '尺寸已經夠小,不縮'},品質 ${quality}`);

if (DRY) {
  console.log('');
  console.log('[DRY_RUN] 以上都沒有真的執行。拿掉 DRY_RUN=1 才會實際寫檔。');
  process.exit(0);
}

mkdirSync(dirname(toAbs), { recursive: true });

let pipe = sharp(from, { failOn: 'none' }).rotate(); // rotate() 依 EXIF 轉正後,方向資訊就不需要了
if (willResize) pipe = pipe.resize(max, max, { fit: 'inside', withoutEnlargement: true });

// 關鍵:不呼叫 .withMetadata() —— sharp 預設就不帶 metadata 出去,EXIF 自然被洗掉。
// 不要為了「保留色彩」而加 withMetadata(),那會把 GPS 一起帶上線。
if (ext === '.png') {
  await pipe.png({ compressionLevel: 9 }).toFile(toAbs);
} else {
  await pipe.jpeg({ quality, mozjpeg: true }).toFile(toAbs);
}

const afterKB = Math.round(statSync(toAbs).size / 1024);
const outMeta = await sharp(toAbs).metadata();

console.log('');
console.log(`✓ 好了:${outMeta.width}×${outMeta.height} ${afterKB} KB (原本 ${beforeKB} KB)`);

// 驗證而不是宣稱 —— 實際回讀輸出檔,確認 metadata 真的沒了
const leftover = ['exif', 'iptc', 'xmp'].filter((k) => outMeta[k]);
if (leftover.length) {
  console.error(`⚠️ 還殘留 metadata:${leftover.join('、')} —— 這不該發生,先不要上線,找 Jason。`);
  process.exit(1);
}
console.log('  ✓ 已確認輸出檔沒有 EXIF/IPTC/XMP(實際回讀驗證過,不是假設)');
console.log('');
console.log('接下來:');
console.log(`  1. 把對應 yaml 的 src 指到 ${to.replace(/^src\//, '../../').replace('assets/', 'assets/')}`);
console.log('  2. 寫 alt —— 先用 Read 工具把圖打開看過,照畫面實際內容寫,不要用檔名猜');
