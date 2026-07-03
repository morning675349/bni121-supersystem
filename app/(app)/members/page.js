import { loadBniMembers } from "@/lib/members.js";
import { displayText } from "@/lib/textClean.js";
import MembersBrowser from "@/components/MembersBrowser.js";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  // 列表只傳「服務」與「需要的引薦」摘要所需欄位，其餘完整資料放內頁，縮小 payload 也讓畫面乾淨
  const members = loadBniMembers().map((m) => ({
    id: m.id,
    name: m.name,
    company: m.company,
    categoryEn: m.categoryEn,
    specialty: m.specialty,
    region: m.region || "",
    chapter: m.chapter,
    business: displayText(m.business),
    idealReferral: displayText(m.idealReferral),
    hasProfile: m.hasProfile,
  }));

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>BNI 會員名錄</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        目前收錄 {members.length} 位夥伴的公開商業資料。聯絡方式請透過官方頁或線上 121。
      </p>
      <MembersBrowser members={members} />
    </div>
  );
}
