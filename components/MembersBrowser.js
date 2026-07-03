"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

export default function MembersBrowser({ members }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [chapter, setChapter] = useState("");

  // 區域選項（依人數排序，未分類殿後）
  const regions = useMemo(() => {
    const c = {};
    for (const m of members) c[m.region || "未分類"] = (c[m.region || "未分類"] || 0) + 1;
    return Object.entries(c).sort((a, b) => (a[0] === "未分類") - (b[0] === "未分類") || b[1] - a[1]);
  }, [members]);

  // 依所選區域，動態列出該區的分會
  const chapters = useMemo(() => {
    const pool = region ? members.filter((m) => (m.region || "未分類") === region) : members;
    const c = {};
    for (const m of pool) if (m.chapter) c[m.chapter] = (c[m.chapter] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [members, region]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let list = members;
    if (region) list = list.filter((m) => (m.region || "未分類") === region);
    if (chapter) list = list.filter((m) => m.chapter === chapter);
    if (kw)
      list = list.filter((m) =>
        [m.name, m.company, m.categoryEn, m.specialty, m.business, m.chapter, m.region]
          .filter(Boolean).join(" ").toLowerCase().includes(kw)
      );
    return list;
  }, [members, q, region, chapter]);

  return (
    <div>
      <div className="grid2" style={{ marginBottom: 10 }}>
        <div>
          <label style={{ marginTop: 0 }}>區域</label>
          <select value={region} onChange={(e) => { setRegion(e.target.value); setChapter(""); }}>
            <option value="">全部區域（{members.length}）</option>
            {regions.map(([r, n]) => <option key={r} value={r}>{r}（{n}）</option>)}
          </select>
        </div>
        <div>
          <label style={{ marginTop: 0 }}>分會</label>
          <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
            <option value="">{region ? `${region} 全部分會` : "全部分會"}</option>
            {chapters.map(([ch, n]) => <option key={ch} value={ch}>{ch}（{n}）</option>)}
          </select>
        </div>
      </div>
      <input placeholder="搜尋姓名 / 公司 / 產業 / 專長…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
        符合 {filtered.length} 位{filtered.length > 120 ? "（顯示前 120，請縮小搜尋範圍）" : ""}
      </p>
      {filtered.slice(0, 120).map((m) => (
        <MemberCard key={m.id} m={m} />
      ))}
    </div>
  );
}

function MemberCard({ m }) {
  return (
    <Link href={`/members/${encodeURIComponent(m.id)}`} className="member-card">
      <div className="top">
        <span className="name">{m.name}</span>
        {m.region && <span className="badge chapter">{m.region}</span>}
        {m.chapter && <span className="badge bni">{m.chapter}</span>}
        {m.hasProfile && <span className="badge user">完整資料</span>}
      </div>
      <div className="cat">{[m.company, m.categoryEn || m.specialty].filter(Boolean).join("　·　")}</div>
      <div className="kv-grid">
        <MiniField label="服務" value={m.business} />
        <MiniField label="需要的引薦" value={m.idealReferral} />
      </div>
      <span className="view-more">查看完整資料 →</span>
    </Link>
  );
}

function MiniField({ label, value }) {
  if (!value) return null;
  return (
    <div className="kv-row">
      <span className="kv-label">{label}</span>
      <span className="kv-value clamp2">{value}</span>
    </div>
  );
}
