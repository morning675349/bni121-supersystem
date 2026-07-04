// 每週會員名單更新：偵測新加入/離會的會員，只抓「新」的人，不用每次全量重抓。
//
// 邏輯：
// 1. 重新抓官方 sitemap → 取得目前完整的 encryptedMemberId 清單（這一步很輕量，只是 sitemap）
// 2. 跟本地既有 data/members_index.json 比對：
//    - 新出現的 id → 新加入會員，需要抓取完整資料
//    - 原本有、現在 sitemap 沒有的 id → 離會，標記 active:false（保留歷史資料，但全站已用 active 過濾掉）
// 3. 只對「新加入」的人跑完整抓取（fetchMemberHtml + parseMember），比每次全量重抓快很多也更禮貌
// 4. 更新 data/members_index.json、data/members.json
// 5. 重新跑 enrichRegions.js 幫新會員指派區域
//
// 用法：node scraper/weeklyUpdate.js
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CONFIG, politeDelay } from "./config.js";
import { fetchMemberHtml } from "./fetchMember.js";
import { parseMember } from "./parseMember.js";

async function fetchFreshIndex() {
  const res = await fetch(CONFIG.SITEMAP_URL, { headers: { "User-Agent": CONFIG.USER_AGENT } });
  if (!res.ok) throw new Error(`sitemap 下載失敗: ${res.status}`);
  const { gunzipSync } = await import("node:zlib");
  const buf = Buffer.from(await res.arrayBuffer());
  const xml = gunzipSync(buf).toString("utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const members = [];
  for (const raw of locs) {
    const loc = raw.replace(/&amp;/g, "&");
    const u = new URL(loc);
    const encryptedMemberId = u.searchParams.get("encryptedMemberId");
    const name = (u.searchParams.get("name") || "").replace(/\s+/g, " ").trim();
    if (encryptedMemberId) members.push({ encryptedMemberId, name, url: loc });
  }
  return members;
}

async function main() {
  console.log("=== 每週會員名單更新 ===\n");

  const oldIndex = existsSync(CONFIG.INDEX_FILE) ? JSON.parse(readFileSync(CONFIG.INDEX_FILE, "utf8")) : [];
  const oldIds = new Set(oldIndex.map((m) => m.encryptedMemberId));

  console.log("下載最新官方 sitemap…");
  const newIndex = await fetchFreshIndex();
  const newIds = new Set(newIndex.map((m) => m.encryptedMemberId));

  const joined = newIndex.filter((m) => !oldIds.has(m.encryptedMemberId));
  const departedIds = [...oldIds].filter((id) => !newIds.has(id));

  console.log(`目前官方名單共 ${newIndex.length} 位`);
  console.log(`新加入：${joined.length} 位`);
  console.log(`離會/移除：${departedIds.length} 位\n`);

  const store = existsSync(CONFIG.MEMBERS_FILE) ? JSON.parse(readFileSync(CONFIG.MEMBERS_FILE, "utf8")) : {};

  // 標記離會會員為 active:false（保留歷史資料，全站的 active 過濾會自動排除他們）
  for (const id of departedIds) {
    if (store[id]) {
      store[id].active = false;
      store[id].departedAt = new Date().toISOString();
    }
  }

  // 只抓新加入的會員完整資料
  let ok = 0, fail = 0;
  for (let i = 0; i < joined.length; i++) {
    const seed = joined[i];
    try {
      const html = await fetchMemberHtml(seed);
      const parsed = parseMember(html, seed);
      store[seed.encryptedMemberId] = parsed;
      ok++;
      process.stdout.write(`\r新會員抓取 [${i + 1}/${joined.length}] ✓ ${parsed.name}          `);
    } catch (e) {
      fail++;
      console.log(`\n✗ ${seed.name}: ${e.message}`);
    }
    await politeDelay();
  }
  if (joined.length) console.log("");

  writeFileSync(CONFIG.INDEX_FILE, JSON.stringify(newIndex, null, 2));
  writeFileSync(CONFIG.MEMBERS_FILE, JSON.stringify(store, null, 2));

  console.log(`\n新會員抓取完成：成功 ${ok}｜失敗 ${fail}`);
  console.log(`已更新 ${CONFIG.INDEX_FILE} 與 ${CONFIG.MEMBERS_FILE}`);

  const hasChanges = joined.length > 0 || departedIds.length > 0;
  console.log(`\n=== 本次${hasChanges ? "有" : "沒有"}偵測到名單變動 ===`);
  // 讓外部呼叫者（排程腳本）可以用 exit code 判斷是否需要 rebuild+deploy
  process.exit(hasChanges ? 0 : 42);
}

main().catch((e) => {
  console.error("錯誤:", e.message);
  process.exit(1);
});
