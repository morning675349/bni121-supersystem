import Link from "next/link";
import { notFound } from "next/navigation";
import { getBniMember } from "@/lib/members.js";
import { displayText } from "@/lib/textClean.js";

const SECTIONS = [
  { key: "business", label: "我的業務" },
  { key: "idealReferral", label: "理想的引薦" },
  { key: "problemSolved", label: "解決過的最大難題" },
  { key: "idealPartner", label: "我理想中的引薦搭檔" },
  { key: "topProduct", label: "最佳產品" },
  { key: "bniStory", label: "我最喜歡的 BNI 故事" },
];

export default async function MemberDetailPage({ params }) {
  const { id: rawId } = await params;
  // Next.js 這版不會自動解碼動態路由段落裡的 %3D 等保留字元，手動解碼避免比對失敗
  const id = decodeURIComponent(rawId);
  const m = getBniMember(id);
  if (!m) notFound();

  return (
    <div>
      <Link href="/members" className="muted" style={{ fontSize: 14 }}>← 返回會員名錄</Link>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="top" style={{ marginBottom: 6 }}>
          <span className="name" style={{ fontSize: 20 }}>{m.name}</span>
          {m.region && <span className="badge chapter">{m.region}</span>}
          {m.chapter && <span className="badge bni">{m.chapter}分會</span>}
        </div>
        <div className="cat" style={{ fontSize: 15 }}>
          {[m.company, m.categoryEn || m.specialty].filter(Boolean).join("　·　")}
        </div>
        {m.address && <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{m.address}</div>}
      </div>

      {SECTIONS.map((s) => {
        const text = displayText(m[s.key]);
        if (!text) return null;
        return (
          <div className="card" key={s.key}>
            <h2 style={{ fontSize: 16 }}>{s.label}</h2>
            <p style={{ whiteSpace: "pre-line", margin: 0, color: "#374151" }}>{text}</p>
          </div>
        );
      })}

      <div className="card">
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          此夥伴尚未加入平台，聯絡方式請見官方頁；邀請他加入即可在平台上直接發起 121 邀約。
        </p>
        {m.sourceUrl && (
          <div style={{ marginTop: 10 }}>
            <a className="btn ghost sm" href={m.sourceUrl} target="_blank" rel="noreferrer">查看 BNI 官方頁</a>
          </div>
        )}
      </div>
    </div>
  );
}
