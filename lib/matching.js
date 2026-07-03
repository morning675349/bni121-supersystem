// Web 端媒合橋接：把「BNI 公開會員 + 平台註冊用戶」合成媒合池，
// 呼叫抓取器裡驗證過的雙向互惠引擎，並疊加「業務人脈圈」專屬的比對訊號。
import { toProfile, reciprocalScore, explain } from "@/scraper/match.js";
import { loadBniMembers } from "./members.js";
import { allProfiles } from "./store.js";

// 業務人脈圈攤平成不重複項目清單（8大類名稱＋每類最多8個具體項目）。
// 填多少算多少：沒填的分類/項目本來就是空字串或空陣列，這裡自然被濾掉，不影響比對。
function networkCircleItems(nc) {
  if (!nc || !Array.isArray(nc.categories)) return [];
  const items = [];
  for (const c of nc.categories) {
    if (c.name) items.push(c.name);
    if (Array.isArray(c.items)) items.push(...c.items);
  }
  return [...new Set(items.map((s) => String(s).trim()).filter(Boolean))];
}
function networkCircleText(nc) {
  return networkCircleItems(nc).join("、");
}

// 訊號①：人脈圈項目 vs 對方專業文字——「我人脈圈想認識律師」對上「對方專業是律師」
function circleToProfessionHits(items, professionText) {
  if (!items.length || !professionText) return [];
  const hay = professionText.toLowerCase();
  return items.filter((item) => item.length >= 2 && hay.includes(item.toLowerCase()));
}

// 訊號②：兩人人脈圈項目互相重疊——「我們都想認識同一類人」，值得互相認識
function circleOverlapHits(itemsA, itemsB) {
  if (!itemsA.length || !itemsB.length) return [];
  const setB = new Set(itemsB.map((s) => s.toLowerCase()));
  return itemsA.filter((item) => setB.has(item.toLowerCase()));
}

// 把平台用戶的九宮格 profile 正規化成與 BNI 會員相同的欄位。
// 認領 BNI 官方資料時（見 app/api/claim/route.js），官方欄位已直接覆蓋寫進 profile，
// 這裡單純讀 profile 本身欄位即可，不用再另外處理認領的 fallback 邏輯。
export function userProfileToEntity(profile, user) {
  return {
    id: `user:${profile.userId}`,
    source: "user",
    encryptedMemberId: `user:${profile.userId}`,
    name: user?.name || profile.name || "平台會員",
    company: profile.company || "",
    categoryEn: profile.category || "",
    specialty: profile.specialty || "",
    region: profile.region || "",
    chapter: profile.chapter || "",
    business: [profile.business, profile.networkCircle?.center].filter(Boolean).join("。"),
    idealReferral: profile.idealReferral || "",
    problemSolved: profile.problemSolved || "",
    idealPartner: [profile.idealPartner, networkCircleText(profile.networkCircle)].filter(Boolean).join("、"),
    topProduct: profile.topProduct || "",
    hasProfile: true,
    claimedBniId: profile.claimedBniId || null,
    _networkCircle: profile.networkCircle || null, // 保留原始結構，供人脈圈專屬比對訊號使用
  };
}

// 建立媒合池（含 BNI 會員與其他平台用戶），排除指定 id。
// 已被平台用戶認領的 BNI 原始資料要排除，否則同一個真實人會在池子裡出現兩份（本人帳號 + 官方原始資料）。
export async function buildPool(excludeId) {
  const profiles = await allProfiles();
  const claimedIds = new Set(profiles.map((p) => p.claimedBniId).filter(Boolean));

  const bni = loadBniMembers().filter((m) => !claimedIds.has(m.id));
  const users = profiles.map((p) => userProfileToEntity(p, { name: p.name }));
  const pool = [...bni, ...users]
    .map(toProfile)
    .filter((m) => (m._offer + m._want).length > 4)
    .filter((m) => m.id !== excludeId && m.encryptedMemberId !== excludeId);
  return pool;
}

// 為某個 entity（平台用戶或 BNI 會員）取得 121 推薦
// 分數 = 核心雙向互惠分數 + 人脈圈加成（項目對專業／兩人人脈圈重疊）
export async function getRecommendations(targetEntity, topN = 6) {
  const target = toProfile(targetEntity);
  const pool = await buildPool(target.id || target.encryptedMemberId);
  const targetCircleItems = networkCircleItems(target._networkCircle);

  const scored = [];
  for (const other of pool) {
    const r = reciprocalScore(target, other);
    const circleHits = circleToProfessionHits(targetCircleItems, other._offer || "");
    const mutualCircleHits = circleOverlapHits(targetCircleItems, networkCircleItems(other._networkCircle));

    let score = r.score;
    if (circleHits.length) score += 0.08 * circleHits.length;
    if (mutualCircleHits.length) score += 0.12 * mutualCircleHits.length;
    if (score <= 0) continue;

    scored.push({ member: other, ...r, score, circleHits, mutualCircleHits });
  }
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN).map((r) => ({
    id: r.member.id || r.member.encryptedMemberId,
    source: r.member.source,
    name: r.member.name,
    company: r.member.company,
    categoryEn: r.member.categoryEn,
    specialty: r.member.specialty,
    region: r.member.region || "",
    chapter: r.member.chapter,
    business: r.member.business,
    sourceUrl: r.member.sourceUrl || "",
    score: Number(r.score.toFixed(3)),
    mutual: r.mutual,
    aHits: r.aHits,
    bHits: r.bHits,
    circleHits: r.circleHits,
    mutualCircleHits: r.mutualCircleHits,
    sameChapter: r.sameChapter,
    reason: buildReason(r),
  }));
}

// 產生「為什麼該 121」的人類可讀理由（v1 模板；之後接 GPT）
// 依序：兩人人脈圈重疊 → 人脈圈對上對方專業 → GAINS 雙向互惠命中
function buildReason(r) {
  const parts = [];
  if (r.mutualCircleHits?.length)
    parts.push(`你們的人脈圈都想認識「${r.mutualCircleHits.slice(0, 3).join("、")}」`);
  if (r.circleHits?.length)
    parts.push(`你人脈圈裡想認識的「${r.circleHits.slice(0, 3).join("、")}」，正是對方的專業`);
  if (r.aHits.length) parts.push(`對方能提供你想找的「${r.aHits.slice(0, 3).join("、")}」`);
  if (r.bHits.length) parts.push(`你的專業也正是對方想認識的「${r.bHits.slice(0, 3).join("、")}」`);
  if (!parts.length) return "產業互補，值得認識";
  return parts.join("；") + (r.mutual ? "，雙向互惠。" : "。");
}

export { reciprocalScore, explain };
