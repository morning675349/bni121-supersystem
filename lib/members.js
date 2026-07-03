// 載入已抓取的 BNI 公開會員資料
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MEMBERS_PATH = join(process.cwd(), "data", "members.json");

let _cache = null;
let _cacheKey = null;

export function loadBniMembers() {
  if (!existsSync(MEMBERS_PATH)) return [];
  // 以檔案內容長度當簡易快取鍵（dev 熱更新時能反映重抓）
  const raw = readFileSync(MEMBERS_PATH, "utf8");
  if (_cache && _cacheKey === raw.length) return _cache;
  const store = JSON.parse(raw);
  _cache = Object.values(store)
    // 排除 BNI 端已無資料的失效會員（停權/私密，sitemap 殘留）
    .filter((m) => m.active !== false && (m.chapter || m.company || m.business))
    .map((m) => ({
      ...m,
      id: m.encryptedMemberId,
      source: "bni",
    }));
  _cacheKey = raw.length;
  return _cache;
}

export function getBniMember(id) {
  return loadBniMembers().find((m) => m.id === id) || null;
}
