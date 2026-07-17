/**
 * 共用:算出「git 回報的路徑」與「網站根目錄」之間的前綴。
 *
 * 為什麼需要這個:git 的 --name-only / status --porcelain 一律回報
 * **相對 repo root** 的路徑。而這個網站在兩種 repo 裡的位置不一樣:
 *
 *   Ivy 的機器  → canonical repo(verdantwanderlust-studio.github.io)
 *                 網站就是 repo 根目錄 → git 回報 "src/content/pages/about.yaml"
 *   Jason 的機器 → 規劃 repo(ivy-landscape),網站在 site/ 子目錄
 *                 → git 回報 "site/src/content/pages/about.yaml"
 *
 * 寫死任何一種都會在另一邊靜默壞掉,而且「在 Ivy 那台剛好會動」的 bug
 * 最難發現 —— 測試環境正常,真實環境正常,只有 Jason 自己測的時候壞。
 * 所以一律問 git。
 */

import { execSync } from 'node:child_process';

/**
 * 回傳從 repo root 到目前工作目錄的前綴,例如 "site/" 或 ""(已在根目錄)。
 */
export function repoPrefix() {
  try {
    return execSync('git rev-parse --show-prefix', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/**
 * 把 git 回報的路徑(repo-root 相對)轉成網站根目錄相對。
 * 前綴對不上的檔案回傳 null —— 代表它根本不在這個網站底下。
 */
export function toSiteRelative(gitPath, prefix = repoPrefix()) {
  if (!prefix) return gitPath;
  if (!gitPath.startsWith(prefix)) return null;
  return gitPath.slice(prefix.length);
}
