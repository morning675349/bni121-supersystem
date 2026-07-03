// 用「分會 → 區域」權威對照表（data/chapterRegions.json，由 fetchChapterRegions.js 建立）
// 統一指派每位會員的區域。
//
// 區域是分會這個組織層級本身固定的屬性（國家→區域→分會→會員），跟會員個人地址無關——
// 同分會的會員，公司可能開在全台任何角落，但都屬於同一個官方認證的區域。
// 故不再用「會員地址」或「同分會地址多數決」去猜，一律以權威對照表為準。
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CONFIG } from "./config.js";

const store = JSON.parse(readFileSync(CONFIG.MEMBERS_FILE, "utf8"));
const members = Object.values(store);

if (!existsSync("data/chapterRegions.json")) {
  console.error("找不到 data/chapterRegions.json，請先執行 node scraper/fetchChapterRegions.js");
  process.exit(1);
}
const chapterRegions = JSON.parse(readFileSync("data/chapterRegions.json", "utf8"));

// 標記有效/失效：BNI 端頁面本身已無資料（停權/私密，sitemap 殘留）者為 active=false
let activeCount = 0, inactiveCount = 0;
for (const m of members) {
  m.active = !!(m.chapter || m.company || m.business);
  if (m.active) activeCount++; else inactiveCount++;
}

// 依分會權威對照表指派區域
let assigned = 0, noChapter = 0, chapterNotInTable = 0;
for (const m of members) {
  delete m.regionSource; // 清掉舊版（地址推斷/分會投票）留下的欄位
  if (!m.chapter) { delete m.region; noChapter++; continue; }
  const entry = chapterRegions[m.chapter];
  if (entry) {
    m.region = entry.region;
    assigned++;
  } else {
    delete m.region;
    chapterNotInTable++;
  }
}

writeFileSync(CONFIG.MEMBERS_FILE, JSON.stringify(store, null, 2));

const total = members.length;
const activeCovered = members.filter((m) => m.active && m.region).length;
console.log(`有效會員：${activeCount}｜失效(BNI端無資料)：${inactiveCount}`);
console.log(`依分會權威對照表指派區域：${assigned}｜無分會：${noChapter}｜分會不在對照表：${chapterNotInTable}`);
console.log(`區域覆蓋率(有效會員)：${activeCovered}/${activeCount}（${(activeCovered / activeCount * 100).toFixed(0)}%）`);
