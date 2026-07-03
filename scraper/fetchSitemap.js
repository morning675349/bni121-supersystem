// 從官方 sitemap 取得所有公開會員清單（encryptedMemberId + name）
import { gunzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { CONFIG } from "./config.js";

async function main() {
  console.log("下載官方 sitemap:", CONFIG.SITEMAP_URL);
  const res = await fetch(CONFIG.SITEMAP_URL, {
    headers: { "User-Agent": CONFIG.USER_AGENT },
  });
  if (!res.ok) throw new Error(`sitemap 下載失敗: ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const xml = gunzipSync(buf).toString("utf8");

  // 解析每個 <loc>...</loc>
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const members = [];
  for (const raw of locs) {
    const loc = raw.replace(/&amp;/g, "&");
    const u = new URL(loc);
    const encryptedMemberId = u.searchParams.get("encryptedMemberId");
    const name = (u.searchParams.get("name") || "").replace(/\s+/g, " ").trim();
    if (encryptedMemberId) {
      members.push({ encryptedMemberId, name, url: loc });
    }
  }

  writeFileSync(CONFIG.INDEX_FILE, JSON.stringify(members, null, 2));
  console.log(`✓ 共 ${members.length} 位公開會員，已寫入 ${CONFIG.INDEX_FILE}`);
  console.log("前 3 筆範例:");
  console.log(members.slice(0, 3));
}

main().catch((e) => {
  console.error("錯誤:", e.message);
  process.exit(1);
});
