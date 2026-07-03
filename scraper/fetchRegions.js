// 從官方 regionlist API 取得全台 26 區域 → 行政區 對照，存 data/regions.json
// 這是 BNI 官方對「區域」的定義，之後用來把會員地址歸類到區域。
import { writeFileSync } from "node:fs";
import * as cheerio from "cheerio";

const URL = "https://bni.com.tw/bnicms/v3/frontend/regionlist/display";

async function main() {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0",
      Referer: "https://bni.com.tw/zh-TW/regionlist",
    },
    body: new URLSearchParams({ "orgIds[]": "7699", mappedWidgetSettings: "[]" }),
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const regions = [];
  $("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 2) return;
    const nameCell = $(tds[0]).text().replace(/\s+/g, " ").trim();
    const districts = $(tds[1]).text().replace(/\s+/g, " ").trim();
    const sub = ($(tr).find("a[href^=http]").attr("href") || "").replace(/\/$/, "");
    if (!nameCell) return;
    // nameCell 形如「大台中南區 Greater Taichung South」→ 以最後一個「區」切中英
    // （區名可能含 A/B，如「新竹A區」，故不能用第一個 Latin 字切）
    const cut = nameCell.lastIndexOf("區");
    const zh = cut >= 0 ? nameCell.slice(0, cut + 1).trim() : nameCell;
    const en = cut >= 0 ? nameCell.slice(cut + 1).trim() : "";
    regions.push({
      zh,
      en,
      subdomain: sub,
      districts: districts.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
    });
  });

  writeFileSync("data/regions.json", JSON.stringify(regions, null, 2));
  console.log(`✓ ${regions.length} 個區域已存 data/regions.json`);
  regions.forEach((r) => console.log(`  ${r.zh}（${r.districts.length} 區）`));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
