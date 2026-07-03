// 主抓取程式：讀 sitemap 索引 → 逐一抓取解析 → 存 members.json
// 特性：禮貌限速、斷點續抓、進度顯示、失敗記錄
//
// 用法：
//   node scraper/scrape.js               # 抓全部（斷點續抓）
//   node scraper/scrape.js --limit 50    # 只抓前 50 位
//   node scraper/scrape.js --sample      # 從清單均勻取樣
//   node scraper/scrape.js --reset       # 清除進度重抓
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CONFIG, politeDelay } from "./config.js";
import { fetchMemberHtml } from "./fetchMember.js";
import { parseMember } from "./parseMember.js";

const args = process.argv.slice(2);
const getArg = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const limit = Number(getArg("--limit", 0));
const sample = args.includes("--sample");
const reset = args.includes("--reset");
const concurrency = Math.max(1, Number(getArg("--concurrency", 6)));
const delayArg = getArg("--delay", "");
if (delayArg) CONFIG.DELAY_MS = Number(delayArg); // 並發時可調低單次延遲

const index = JSON.parse(readFileSync(CONFIG.INDEX_FILE, "utf8"));

// 載入已抓資料（斷點續抓）
let store = {};
if (existsSync(CONFIG.MEMBERS_FILE) && !reset) {
  store = JSON.parse(readFileSync(CONFIG.MEMBERS_FILE, "utf8"));
}
const done = new Set(Object.keys(store));

// 決定要抓的清單
let targets = index;
if (sample && limit) {
  const step = Math.max(1, Math.floor(index.length / limit));
  targets = index.filter((_, i) => i % step === 0).slice(0, limit);
} else if (limit) {
  targets = index.slice(0, limit);
}
// 過濾已抓過的
targets = targets.filter((m) => !done.has(m.encryptedMemberId));

console.log(`總索引 ${index.length} 位｜本次待抓 ${targets.length} 位｜已完成 ${done.size} 位｜並發 ${concurrency}`);

let ok = 0, fail = 0, withProfile = 0, processed = 0;
const failures = [];

// 每抓 30 筆存檔一次，避免中斷全失
const flush = () => writeFileSync(CONFIG.MEMBERS_FILE, JSON.stringify(store, null, 2));

let cursor = 0;
async function worker() {
  while (cursor < targets.length) {
    const m = targets[cursor++];
    try {
      const html = await fetchMemberHtml(m);
      const parsed = parseMember(html, m);
      store[m.encryptedMemberId] = parsed;
      ok++;
      if (parsed.hasProfile) withProfile++;
    } catch (e) {
      fail++;
      failures.push({ name: m.name, id: m.encryptedMemberId, error: e.message });
    }
    processed++;
    if (processed % 25 === 0) {
      flush();
      process.stdout.write(
        `\r[${processed}/${targets.length}] ✓${ok} ✗${fail} 有業務欄位${withProfile}          `
      );
    }
    await politeDelay();
  }
}

// 啟動 N 個 worker 並發拉取
await Promise.all(Array.from({ length: concurrency }, () => worker()));

flush();
if (failures.length) writeFileSync("data/failures.json", JSON.stringify(failures, null, 2));

console.log(`\n\n完成｜成功 ${ok}｜失敗 ${fail}｜有業務欄位 ${withProfile}`);
console.log(`資料已存 ${CONFIG.MEMBERS_FILE}（累計 ${Object.keys(store).length} 位）`);
