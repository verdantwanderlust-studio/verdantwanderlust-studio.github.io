#!/usr/bin/env node
/**
 * 把改動推上線。
 *
 * ⚠️ 這是整套 skill 裡唯一會影響對外網站的地方。push 到 main 之後,
 * GitHub Actions 會在約一分鐘內把新版部署到 verdantwanderlust-studio.github.io,
 * 全世界都看得到。所以這支的每一道檢查都不是形式,是真的在擋事情。
 *
 * 用法:
 *   node scripts/publish.mjs --message "更新關於頁第二段文案"
 *   node scripts/publish.mjs --check      看上次推的部署好了沒
 *
 * DRY_RUN=1 → 只印出會做什麼,不 commit 不 push。跑測試時一律要設。
 */

import { execSync, spawnSync } from 'node:child_process';
import { repoPrefix, toSiteRelative } from './_repo.mjs';

const DRY = process.env.DRY_RUN === '1';
const PREFIX = repoPrefix(); // "" 在 Ivy 那台,"site/" 在 Jason 那台

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

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

// ---------- --check:看部署狀態 ----------
if (process.argv.includes('--check')) {
  const sha = trySh('git rev-parse --short HEAD');
  console.log(`本機最新一次改動:${sha}`);
  const runs = trySh(
    'gh run list --limit 3 --json status,conclusion,headSha,createdAt ' +
      "--template '{{range .}}{{.status}} {{.conclusion}} {{slice .headSha 0 7}}{{\"\\n\"}}{{end}}'",
  );
  if (runs === null || !runs.trim()) {
    // 空手而回不要裝沒事。兩種可能:
    // (a) gh 沒登入 / 沒權限
    // (b) 這台的 repo 不是那個會部署的 repo —— 在 Jason 的規劃 repo(ivy-landscape)
    //     跑就會這樣,因為部署的 Actions 在 verdant 那邊。Ivy 的機器上不會有這問題。
    console.log('查不到部署紀錄。');
    console.log('');
    const origin = trySh('git remote get-url origin') ?? '(不明)';
    console.log(`  這台的 origin:${origin}`);
    if (!/verdantwanderlust-studio/.test(origin)) {
      console.log('  → 這不是那個會自動部署的 repo,所以查不到是正常的。');
    } else {
      console.log('  → 可能是 gh 沒登入,跑 `gh auth status` 看看。');
    }
    console.log('');
    console.log('要確認網站狀態,直接開 https://verdantwanderlust-studio.github.io/ 最準。');
    process.exit(0);
  }
  console.log('');
  console.log('最近的部署:');
  console.log(
    runs
      .split('\n')
      .map((l) => '  ' + l.replace('completed success', '✓ 成功').replace('in_progress', '⏳ 進行中').replace('completed failure', '✗ 失敗'))
      .join('\n'),
  );
  console.log('');
  console.log('顯示「進行中」的話再等 30 秒左右。');
  process.exit(0);
}

// ---------- 上線流程 ----------
const message = arg('message');
if (!message) {
  console.error('要給說明:--message "更新關於頁第二段文案"');
  console.error('');
  console.error('用 Ivy 日後看得懂的白話,不要寫 feat(content): 這種。');
  console.error('這行字是她之後想「我上次到底改了什麼」時唯一的線索。');
  process.exit(1);
}

// 1. 有東西要推嗎
//    注意:不能用會 trim() 的 helper 讀 porcelain —— 它的格式是「兩個狀態字元 + 空格 + 路徑」,
//    未修改的那一欄是空格,所以「 M path」開頭就是空白。trim 掉會讓第一行少一個字元,
//    路徑變成 "ite/..." 而白名單全部對不上。這個 bug 實際發生過。
const status = execSync('git status --porcelain', { encoding: 'utf8' }).replace(/\n$/, '');
if (!status) {
  console.log('沒有任何改動 —— 沒東西要上線。');
  process.exit(0);
}

// git 回報的是 repo-root 相對路徑,先轉成網站根目錄相對再比對白名單。
// 不轉的話:在 Jason 的機器上(網站在 site/ 底下)每個檔案都會對不上白名單、
// 被當成禁區擋掉;而在 Ivy 的機器上剛好正常 —— 這種只在一邊壞的 bug 最難抓。
const changed = status
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    // 格式:XY<space>path,rename 是 "R  old -> new" —— 用正則解,不用字元位置
    const m = line.match(/^(..) (.+)$/);
    if (!m) return null;
    const gitPath = m[2].includes(' -> ') ? m[2].split(' -> ')[1] : m[2];
    return { gitPath, rel: toSiteRelative(gitPath, PREFIX) };
  })
  .filter(Boolean)
  // skill 自己的檔案不由 publish 管(它是 Jason 維護的工具,不是 Ivy 的內容)
  .filter((f) => !f.gitPath.includes('/.claude/'));

// 2. 只准動內容與素材。這道閘是這支腳本存在的主要理由 ——
//    skill 說明裡寫「不要改 .astro」是靠人記得,這裡是機器擋。
const ALLOWED = [
  /^src\/content\/pages\/.+\.yaml$/,
  /^src\/content\/portfolio\/.+\.mdx?$/,
  /^src\/assets\/.+\.(jpe?g|png|webp|svg)$/i,
  /^src\/styles\/tokens\.css$/,
];
// rel 是 null = 這個檔根本不在網站目錄底下(例如 Jason repo 的 docs/),一樣擋
const blocked = changed.filter((f) => !f.rel || !ALLOWED.some((re) => re.test(f.rel)));

if (blocked.length) {
  console.error('這些檔案不該由這個 skill 改動:');
  blocked.forEach((f) => console.error(`  ✗ ${f.gitPath}`));
  console.error('');
  console.error('這個 skill 只負責內容(文字/圖片)與 token 數值。');
  console.error('版型、程式碼、設定檔的改動要找 Jason —— 那些改壞了 Ivy 自己救不回來。');
  console.error('');
  console.error('如果這些改動是你剛剛做的,先 git restore 掉再回來。');
  process.exit(1);
}

// 3. tokens.css 只准改值,不准增刪 token。
//    理由:token 是全站共用的,新增/刪除會讓別的頁面靜默壞掉,而 Ivy 看不出來。
if (changed.some((f) => f.rel === 'src/styles/tokens.css')) {
  const diff = trySh('git diff -U0 -- src/styles/tokens.css') ?? '';
  const added = (diff.match(/^\+\s*--[\w-]+\s*:/gm) ?? []).length;
  const removed = (diff.match(/^-\s*--[\w-]+\s*:/gm) ?? []).length;
  if (added !== removed) {
    console.error('tokens.css 的 token 數量變了(新增或刪除了 token)。');
    console.error(`  新增 ${added} 行 token 宣告,移除 ${removed} 行`);
    console.error('');
    console.error('這個 skill 只能改「已存在 token 的數值」,不能增刪 token。');
    console.error('增刪 token 會讓別的頁面靜默壞掉,要找 Jason。');
    process.exit(1);
  }
}

// 4. build 一定要綠。沒 build 過就推 = 拿線上網站賭。
console.log('先確認網站建得起來…');
const build = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' });
if (build.status !== 0) {
  console.error('');
  console.error('✗ 建置失敗 —— 不能上線,推上去網站會壞。');
  console.error('');
  const out = (build.stdout ?? '') + (build.stderr ?? '');
  const lines = out.split('\n').filter((l) => /error|Error|✗|does not match|must contain/i.test(l));
  console.error(lines.slice(0, 6).join('\n') || out.slice(-800));
  console.error('');
  console.error('如果錯誤訊息裡有「alt」——那是圖片說明文字沒填,補上就好。');
  console.error('看不懂的話,把上面的訊息整段給 Jason,不要自己亂試。');
  process.exit(1);
}
console.log('  ✓ 建置成功');

// 5. 確認我們在 main、而且遠端沒有跑在前面
const branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  console.error(`現在在 ${branch} 分支,不是 main。這個情況不該發生,找 Jason。`);
  process.exit(1);
}

console.log('');
console.log('準備上線:');
console.log(`  說明:${message}`);
console.log('  改動的檔案:');
changed.forEach((f) => console.log(`    ${f.rel}`));

if (DRY) {
  console.log('');
  console.log('[DRY_RUN] 停在這裡 —— 沒有 commit、沒有 push,線上網站沒有變。');
  console.log('[DRY_RUN] 拿掉 DRY_RUN=1 才會真的上線。');
  process.exit(0);
}

// 6. 真的做
sh('git add -A src/content src/assets src/styles/tokens.css');
execSync(`git commit -q -F -`, { input: `${message}\n`, encoding: 'utf8' });
const sha = sh('git rev-parse --short HEAD');
console.log(`  ✓ 已記錄改動(${sha})`);

// pull --rebase:萬一 Jason 那邊也推了東西,不要直接撞掉
const pull = spawnSync('git', ['pull', '--rebase', '--quiet', 'origin', 'main'], { encoding: 'utf8' });
if (pull.status !== 0) {
  console.error('');
  console.error('✗ 跟遠端同步時出問題 —— 可能是 Jason 那邊也改了同一個地方。');
  console.error('先不要繼續,把這個訊息給他看:');
  console.error((pull.stderr ?? '').slice(0, 500));
  process.exit(1);
}

sh('git push -q origin main');
console.log('  ✓ 已推上線');
console.log('');
console.log('網站大概一分鐘後會更新。');
console.log('想確認的話:node .claude/skills/update-site/scripts/publish.mjs --check');
console.log('或直接開 https://verdantwanderlust-studio.github.io/');
