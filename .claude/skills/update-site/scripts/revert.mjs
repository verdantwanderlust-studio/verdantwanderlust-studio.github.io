#!/usr/bin/env node
/**
 * 把某一次改動退掉。
 *
 * 設計前提:Ivy 說「改壞了」的時候,她不知道是哪一次改壞的,也講不出 commit
 * 是什麼。所以這支要做的是「用她認得的語言把最近的改動列出來,讓她指認」,
 * 而不是要她提供 SHA。
 *
 * 退的方式是 git revert(建一個反向的改動),不是 reset ——
 * 歷史留著,她之後反悔還能再拿回來。對非工程師來說,「退掉的東西還在」
 * 這件事比乾淨的歷史重要得多。
 *
 * 用法:
 *   node scripts/revert.mjs --list           列出最近的改動
 *   node scripts/revert.mjs --undo 2         退掉第 2 筆
 *   node scripts/revert.mjs --list --all     連 Jason 的改動一起列
 *
 * DRY_RUN=1 → 只印出會退掉什麼,不真的動。
 */

import { execSync, spawnSync } from 'node:child_process';
import { repoPrefix, toSiteRelative } from './_repo.mjs';

const DRY = process.env.DRY_RUN === '1';
const PREFIX = repoPrefix(); // "" 在 Ivy 那台,"site/" 在 Jason 那台
const N = 12;

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', ...opts }).trim();
}
function trySh(cmd) {
  try {
    return sh(cmd);
  } catch {
    return null;
  }
}

/**
 * 把一次 commit 翻譯成 Ivy 看得懂的一行。
 * git 回報 repo-root 相對路徑,要先轉成網站相對才比對得到(見 _repo.mjs 的說明)。
 */
function describe(sha) {
  const raw = (trySh(`git show --name-only --format= ${sha}`) ?? '').split('\n').filter(Boolean);
  const files = raw.map((gitPath) => ({ gitPath, rel: toSiteRelative(gitPath, PREFIX) }));
  const kinds = new Set();
  for (const { rel } of files) {
    if (!rel) {
      kinds.add('網站以外的檔案');
      continue;
    }
    const page = rel.match(/^src\/content\/pages\/(\w+)\.yaml$/);
    if (page) {
      const zh = { about: '關於頁', home: '首頁', contact: '聯繫頁', courses: '課程頁' }[page[1]] ?? page[1];
      kinds.add(`${zh}的文字或圖片`);
    } else if (/^src\/content\/portfolio\//.test(rel)) kinds.add('作品集內容');
    else if (/^src\/assets\//.test(rel)) kinds.add('照片檔案');
    else if (/^src\/styles\/tokens\.css$/.test(rel)) kinds.add('顏色/字級/間距');
    else if (/\.astro$/.test(rel)) kinds.add('版型(要找 Jason)');
    else kinds.add('程式碼或設定(要找 Jason)');
  }
  return { files, kinds: [...kinds] };
}

const args = process.argv.slice(2);
const showAll = args.includes('--all');

// 只列出動過內容的改動 —— Jason 的程式碼改動 Ivy 不該退,列出來只會誤導
const CONTENT_PATHS = 'src/content src/assets src/styles/tokens.css';
const logCmd = showAll
  ? `git log --format=%H%x09%ad%x09%s --date=format:'%m/%d %H:%M' -${N}`
  : `git log --format=%H%x09%ad%x09%s --date=format:'%m/%d %H:%M' -${N} -- ${CONTENT_PATHS}`;

const rows = (trySh(logCmd) ?? '')
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    const [sha, date, ...rest] = l.split('\t');
    return { sha, date, subject: rest.join('\t') };
  });

if (args.includes('--list') || args.length === 0) {
  if (rows.length === 0) {
    console.log('找不到任何改動紀錄。');
    process.exit(0);
  }
  console.log('最近的改動(最新的在最上面):\n');
  rows.forEach((r, i) => {
    const { kinds } = describe(r.sha);
    console.log(`  [${i + 1}] ${r.date}  ${r.subject}`);
    if (kinds.length) console.log(`      動到:${kinds.join('、')}`);
  });
  console.log('');
  console.log('請 Ivy 指認是哪一筆改壞的,然後:');
  console.log('  node .claude/skills/update-site/scripts/revert.mjs --undo <編號>');
  console.log('');
  console.log('提醒:退掉不會刪掉歷史,反悔了還可以再拿回來。');
  if (!showAll) console.log('(只列了內容類的改動。要看全部加 --all,但版型類的不要自己退,找 Jason。)');
  process.exit(0);
}

const undoIdx = args.indexOf('--undo');
if (undoIdx === -1) {
  console.error('用法:--list 列出改動 / --undo <編號> 退掉某一筆');
  process.exit(1);
}

const n = parseInt(args[undoIdx + 1], 10);
if (!n || n < 1 || n > rows.length) {
  console.error(`編號要在 1 到 ${rows.length} 之間。先跑 --list 看有哪些。`);
  process.exit(1);
}

const target = rows[n - 1];
const { files, kinds } = describe(target.sha);

console.log(`要退掉這一筆:`);
console.log(`  ${target.date}  ${target.subject}`);
console.log(`  動到:${kinds.join('、')}`);
console.log('  檔案:');
files.forEach((f) => console.log(`    ${f.rel ?? f.gitPath}`));

// 擋掉版型/程式碼類的退回 —— 那超出 Ivy 能自己救的範圍。
// 用網站相對路徑判斷,理由同 describe()。
const risky = files.filter(
  (f) => !f.rel || /\.(astro|ts|tsx|mjs|json)$/.test(f.rel) || /^\.github\//.test(f.rel),
);
if (risky.length) {
  console.error('');
  console.error('✗ 這一筆動到程式碼或設定檔,不要用這個 skill 退。');
  console.error('  這種退回可能牽動別的地方,要找 Jason 處理。');
  risky.forEach((f) => console.error(`    ${f.rel ?? f.gitPath}`));
  process.exit(1);
}

if (DRY) {
  console.log('');
  console.log('[DRY_RUN] 沒有真的退 —— 只是印出來給你看。');
  process.exit(0);
}

console.log('');
const r = spawnSync('git', ['revert', '--no-edit', target.sha], { encoding: 'utf8' });
if (r.status !== 0) {
  console.error('✗ 退不掉 —— 通常是因為後來又改過同一個地方,兩邊打架了。');
  console.error((r.stderr ?? '').slice(0, 400));
  console.error('');
  console.error('先跑 `git revert --abort` 取消,然後找 Jason。');
  process.exit(1);
}

console.log(`✓ 已經退掉了(建了一筆反向改動,原本那筆還留在歷史裡)`);
console.log('');
console.log('接下來:');
console.log('  1. 開預覽確認真的變回來了:npm run dev');
console.log('  2. Ivy 確認 OK 之後推上線:');
console.log('     node .claude/skills/update-site/scripts/publish.mjs --message "退回上一版"');
