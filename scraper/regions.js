// 區域推斷：依官方「區域→行政區」對照 + 會員地址，反推所屬區域
// 註：分會(chapter)是會員頁精確資料；區域為 best-effort（官方區域未涵蓋所有行政區 → 可能 null）
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PATH = join(process.cwd(), "data", "regions.json");
let REGIONS = [];
if (existsSync(PATH)) REGIONS = JSON.parse(readFileSync(PATH, "utf8"));

// 從區域中文名取出「城市」前綴，用來消解單字行政區（東/西/南/北/中）的歧義
function cityHint(zh) {
  const m = zh.match(/^(台北市|新北市|台中市|台南市|高雄市|桃園|新竹|彰化|南投|雲林|嘉義|屏東|基隆|宜蘭|苗栗)/);
  return m ? m[1] : "";
}

// 建立比對規則：{ needle, region, len } —— 長的行政區優先比對
const RULES = [];
for (const r of REGIONS) {
  const city = cityHint(r.zh);
  for (const d of r.districts) {
    if (d.length >= 2) {
      // 多字行政區直接比對（沙鹿、板橋、西屯…）
      RULES.push({ needle: d, region: r.zh, len: d.length + 2 });
    } else if (d.length === 1 && city) {
      // 單字行政區需城市限定：台中市 + 西 + 區
      RULES.push({ needle: `${city}${d}區`, region: r.zh, len: 10 });
    }
  }
}
RULES.sort((a, b) => b.len - a.len); // 長規則優先，避免「中」誤命中

export function inferRegion(address) {
  if (!address) return null;
  const a = String(address).replace(/\s+/g, "");
  // 部分會員頁把「公司主要地址」與「第二地址(郵寄/分公司)」串在同一欄位，
  // 主要地址通常排在最前面 —— 取「最早出現位置」命中的行政區，而非規則清單順序命中的第一個，
  // 否則像「台中市太平區...台北市中山區...」這種串接地址會被後面的「中山」誤判蓋過前面的「太平」。
  let best = null; // { index, len, region }
  for (const rule of RULES) {
    const idx = a.indexOf(rule.needle);
    if (idx === -1) continue;
    if (!best || idx < best.index || (idx === best.index && rule.len > best.len)) {
      best = { index: idx, len: rule.len, region: rule.region };
    }
  }
  return best ? best.region : null;
}

export function listRegions() {
  return REGIONS.map((r) => ({ zh: r.zh, en: r.en, districts: r.districts }));
}

// 含 subdomain 欄位的完整原始資料（給分會→區域的權威比對用）
export function listRegionsRaw() {
  return REGIONS;
}
