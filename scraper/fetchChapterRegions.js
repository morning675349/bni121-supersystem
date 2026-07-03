// 建立「分會 → 區域」權威對照表（取代舊版「會員地址推斷/同分會多數決」）
//
// 背景：區域是分會這個組織層級本身固定的屬性（國家→區域→分會→會員），
// 不該用會員各自的地址去猜——會員的公司可能開在任何地方，跟分會所屬區域無關。
//
// 做法：每個分會頁都有「分會網站」連結，其子網域即為官方認證的所屬區域
// （連雲榮這種全台線上分會也適用，因為它的分會網站掛在 bniyunlin.com.tw 底下）。
// 少數分會頁沒有這個連結時，退回用「會議地點地址」反推（一般實體分會皆有固定會議地點）。
import { readFileSync, writeFileSync } from "node:fs";
import { CONFIG, politeDelay } from "./config.js";
import { fetchMemberHtml } from "./fetchMember.js";
import { fetchChapterHtml, extractChapterId, extractChapterInfo } from "./fetchChapterDetail.js";
import { inferRegion, listRegionsRaw } from "./regions.js";

const index = JSON.parse(readFileSync(CONFIG.INDEX_FILE, "utf8"));
const store = JSON.parse(readFileSync(CONFIG.MEMBERS_FILE, "utf8"));
const members = Object.values(store);

// 建立 子網域(小寫,去協定) -> 區域中文名 對照
const subdomainToRegion = {};
for (const r of listRegionsRaw()) {
  if (!r.subdomain) continue;
  const host = r.subdomain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  subdomainToRegion[host] = r.zh;
}

// 每個分會取一位代表會員（用來取得 chapterId）
let repByChapter = new Map();
for (const m of members) {
  if (m.chapter && !repByChapter.has(m.chapter)) repByChapter.set(m.chapter, m.encryptedMemberId);
}
const limitArg = process.argv.indexOf("--limit");
if (limitArg >= 0) {
  const n = Number(process.argv[limitArg + 1]);
  repByChapter = new Map([...repByChapter].slice(0, n));
}
console.log(`共 ${repByChapter.size} 個分會（本次查詢），開始逐一查詢區域…`);

const result = {}; // chapter -> { region, source }
let viaSubdomain = 0, viaAddress = 0, unclassified = 0, fail = 0;
let i = 0;
for (const [chapter, repId] of repByChapter) {
  i++;
  try {
    const seed = index.find((x) => x.encryptedMemberId === repId);
    const memberHtml = await fetchMemberHtml(seed);
    const chapterId = extractChapterId(memberHtml);
    if (!chapterId) { unclassified++; continue; }

    await politeDelay();
    const chapterHtml = await fetchChapterHtml(chapterId);
    const { subdomainRegion, address } = extractChapterInfo(chapterHtml, subdomainToRegion);

    let region = subdomainRegion;
    let source = "subdomain";
    if (!region) {
      region = inferRegion(address);
      source = "address";
    }
    if (region) {
      result[chapter] = { region, source };
      if (source === "subdomain") viaSubdomain++; else viaAddress++;
    } else {
      unclassified++;
    }
  } catch (e) {
    fail++;
    console.log(`  ✗ ${chapter}: ${e.message}`);
  }
  if (i % 20 === 0) {
    writeFileSync("data/chapterRegions.json", JSON.stringify(result, null, 2));
    process.stdout.write(`\r[${i}/${repByChapter.size}] 子網域命中${viaSubdomain} 地址命中${viaAddress} 未分類${unclassified} 失敗${fail}          `);
  }
  await politeDelay();
}

writeFileSync("data/chapterRegions.json", JSON.stringify(result, null, 2));
console.log(`\n\n完成：子網域命中 ${viaSubdomain}｜地址命中 ${viaAddress}｜未分類 ${unclassified}｜失敗 ${fail}`);
console.log(`已存 data/chapterRegions.json（${Object.keys(result).length} 個分會）`);
