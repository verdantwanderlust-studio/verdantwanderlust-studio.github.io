#!/usr/bin/env node
/**
 * 設定精靈 —— 找出 Ivy 放照片的資料夾。
 *
 * 為什麼要這支:寫這個 skill 的時候,我們看不到 Ivy 的電腦,不知道她有沒有裝
 * Google Drive、資料夾叫什麼。與其在 skill 裡寫死一個猜的路徑然後假裝它會動
 * (那是這個 repo 上一版 skill 犯的錯 —— 描述了一整套不存在的架構),
 * 不如第一次執行時實際去掃、掃不到就老實問人。
 *
 * 用法:
 *   node scripts/setup.mjs              掃描並列出候選
 *   node scripts/setup.mjs --set <路徑>  直接設定
 *   node scripts/setup.mjs --show       看目前設定
 */

import { existsSync, readdirSync, statSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const CONFIG_PATH = join(SKILL_DIR, 'config.json');

const IMAGE_EXT = /\.(jpe?g|png|heic|webp|tiff?)$/i;

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(cfg) {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n');
}

/** 數一個資料夾裡(含一層子資料夾)有幾張圖 —— 用來判斷哪個候選比較像「放照片的地方」 */
function countImages(dir, depth = 1) {
  let n = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isFile() && IMAGE_EXT.test(e.name)) n++;
    else if (e.isDirectory() && depth > 0) n += countImages(full, depth - 1);
    if (n > 999) return n; // 夠多了,不用數完
  }
  return n;
}

function findCandidates() {
  const home = homedir();
  const roots = [];

  // macOS 新版 Google Drive 掛在 CloudStorage 底下,資料夾名稱含帳號,所以要展開
  const cloud = join(home, 'Library', 'CloudStorage');
  if (existsSync(cloud)) {
    for (const name of readdirSync(cloud)) {
      if (/^GoogleDrive-/i.test(name)) roots.push(join(cloud, name));
    }
  }

  // 舊版 / 其他常見位置
  for (const p of [
    join(home, 'Google Drive'),
    join(home, 'GoogleDrive'),
    join(home, 'Library', 'CloudStorage', 'Dropbox'),
    join(home, 'Dropbox'),
    join(home, 'Pictures'),
    join(home, 'Desktop'),
  ]) {
    if (existsSync(p)) roots.push(p);
  }

  const out = [];
  for (const root of roots) {
    // 根目錄本身
    const n = countImages(root, 0);
    if (n > 0) out.push({ path: root, images: n });
    // 往下兩層找(「我的雲端硬碟/照片」這種)
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.')) continue;
      const lvl1 = join(root, e.name);
      const n1 = countImages(lvl1, 1);
      if (n1 > 0) out.push({ path: lvl1, images: n1 });
    }
  }

  return out.sort((a, b) => b.images - a.images).slice(0, 8);
}

const args = process.argv.slice(2);

if (args[0] === '--show') {
  const cfg = readConfig();
  if (cfg.photoDir) {
    const ok = existsSync(cfg.photoDir);
    console.log(`目前設定的照片資料夾:${cfg.photoDir}`);
    console.log(ok ? '  ✓ 這個資料夾存在' : '  ✗ 這個資料夾不見了 —— 要重新設定');
    process.exit(ok ? 0 : 1);
  }
  console.log('還沒設定過照片資料夾。跑 `node scripts/setup.mjs` 開始。');
  process.exit(1);
}

if (args[0] === '--set') {
  const p = args[1];
  if (!p) {
    console.error('要給路徑:--set "/path/to/photos"');
    process.exit(1);
  }
  if (!existsSync(p)) {
    console.error(`這個資料夾不存在:${p}`);
    console.error('請跟 Ivy 確認正確的資料夾位置,不要自己猜一個。');
    process.exit(1);
  }
  if (!statSync(p).isDirectory()) {
    console.error(`這是檔案不是資料夾:${p}`);
    process.exit(1);
  }
  const cfg = readConfig();
  cfg.photoDir = p;
  cfg.setAt = new Date().toISOString().slice(0, 10);
  writeConfig(cfg);
  console.log(`✓ 已記住:${p}`);
  console.log(`  (存在 ${CONFIG_PATH},不會進 repo)`);
  console.log(`  裡面有 ${countImages(p, 1)} 張圖`);
  process.exit(0);
}

// 預設:掃描
const existing = readConfig();
if (existing.photoDir && existsSync(existing.photoDir)) {
  console.log(`已經設定過了:${existing.photoDir}`);
  console.log('要改的話:node scripts/setup.mjs --set "<新路徑>"');
  process.exit(0);
}

console.log('在找 Ivy 放照片的資料夾…\n');
const cands = findCandidates();

if (cands.length === 0) {
  console.log('掃不到任何看起來像照片資料夾的地方。');
  console.log('');
  console.log('請直接問 Ivy:「你平常把照片放在哪個資料夾?」');
  console.log('(可以請她在 Finder 裡對著資料夾按右鍵 → 按住 option → 拷貝為路徑名稱)');
  console.log('');
  console.log('拿到路徑之後:node scripts/setup.mjs --set "<她給的路徑>"');
  process.exit(1);
}

console.log('找到這些候選,請 Ivy 確認是哪一個:\n');
cands.forEach((c, i) => {
  console.log(`  [${i + 1}] ${c.path}`);
  console.log(`      裡面有 ${c.images} 張圖`);
});
console.log('');
console.log('都不是的話,請她直接告訴你資料夾在哪。');
console.log('確認後:node scripts/setup.mjs --set "<選定的路徑>"');
