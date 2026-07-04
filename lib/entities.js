// 統一解析「收藏/121計劃」裡的對象顯示資訊，不管是 BNI 原始資料還是平台會員
import { getBniMember } from "./members.js";
import { getProfile, findUserById } from "./store.js";

// targetId 格式：純 encryptedMemberId(BNI原始資料) 或 "user:<uid>"(平台會員)
export async function resolveEntity(targetId) {
  if (targetId.startsWith("user:")) {
    const uid = targetId.slice(5);
    const [user, profile] = await Promise.all([findUserById(uid), getProfile(uid)]);
    if (!user) return null;
    return {
      id: targetId,
      source: "user",
      name: user.name || profile?.name || "平台會員",
      company: profile?.company || "",
      categoryEn: profile?.category || "",
      specialty: profile?.specialty || "",
      chapter: profile?.chapter || "",
      region: profile?.region || "",
      sourceUrl: "",
    };
  }
  const m = getBniMember(targetId);
  if (!m) return null;
  return {
    id: targetId,
    source: "bni",
    name: m.name,
    company: m.company || "",
    categoryEn: m.categoryEn || "",
    specialty: m.specialty || "",
    chapter: m.chapter || "",
    region: m.region || "",
    sourceUrl: m.sourceUrl || "",
  };
}

export async function resolveEntities(targetIds) {
  const results = await Promise.all(targetIds.map((id) => resolveEntity(id)));
  return results.filter(Boolean);
}
