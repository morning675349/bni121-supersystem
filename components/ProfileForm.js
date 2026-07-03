"use client";
import { useState } from "react";

// 九宮格欄位定義（對應媒合引擎的欄位）
const NINE = [
  { key: "company", label: "公司 / 單位", ph: "奇策整合行銷", half: true },
  { key: "category", label: "產業別", ph: "Marketing / 數位行銷", half: true },
  { key: "specialty", label: "主要專長 / 服務", ph: "網站規劃、SEO、數位行銷" },
  { key: "business", label: "我的業務", hint: "一句話說明你在做什麼", ph: "幫中小企業把網站變成會賺錢的業務員" },
  { key: "idealReferral", label: "理想的引薦", hint: "你想被引薦給誰（一般 / 好的 / 夢幻）", ph: "想做網站或做 SEO 的中小企業主、工廠老闆" },
  { key: "idealPartner", label: "理想的引薦搭檔", hint: "哪些行業最能幫你引薦", ph: "平面設計、系統開發、記帳士、企管顧問、商會幹部" },
  { key: "problemSolved", label: "我能解決的最大難題", ph: "讓沒有流量、沒有名單的公司，靠網站與內容穩定接單" },
  { key: "topProduct", label: "最佳產品 / 主打", ph: "客製化官網 + SEO 內容行銷方案", half: true },
  { key: "chapter", label: "所屬 BNI 分會", ph: "例：卓越分會", half: true },
];

export default function ProfileForm({ initial, regions = [] }) {
  const [form, setForm] = useState(() => {
    const f = { region: initial?.region || "" };
    for (const n of NINE) f[n.key] = initial?.[n.key] || "";
    return f;
  });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMsg(res.ok ? "已儲存！可到「媒合推薦」看為你配對的 121 對象。" : "儲存失敗");
  }

  return (
    <form className="card" onSubmit={save}>
      <h2>我的 BNI 官方檔案（GAINS）</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        對應 BNI 官網會員頁的標準欄位。填得越完整，系統配對越準，這些欄位直接餵給雙向互惠媒合引擎。
      </p>
      {msg && <div className="ok">{msg}</div>}
      <div className="grid2">
        {NINE.filter((n) => n.half).slice(0, 2).map((n) => (
          <Field key={n.key} n={n} v={form[n.key]} onChange={set(n.key)} />
        ))}
      </div>
      {NINE.filter((n) => !n.half).map((n) => (
        <Field key={n.key} n={n} v={form[n.key]} onChange={set(n.key)} />
      ))}
      <div className="grid2">
        <div>
          <label>所屬區域 <span className="hint">BNI 26 區</span></label>
          <select value={form.region} onChange={set("region")}>
            <option value="">— 請選擇區域 —</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {NINE.filter((n) => n.key === "chapter").map((n) => (
          <Field key={n.key} n={n} v={form[n.key]} onChange={set(n.key)} />
        ))}
      </div>
      <div className="grid2">
        {NINE.filter((n) => n.key === "topProduct").map((n) => (
          <Field key={n.key} n={n} v={form[n.key]} onChange={set(n.key)} />
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <button className="btn" disabled={saving}>{saving ? "儲存中…" : "儲存九宮格"}</button>
      </div>
    </form>
  );
}

function Field({ n, v, onChange }) {
  const isLong = !n.half;
  return (
    <div>
      <label>
        {n.label}
        {n.hint && <span className="hint">{n.hint}</span>}
      </label>
      {isLong ? (
        <textarea value={v} onChange={onChange} placeholder={n.ph} />
      ) : (
        <input value={v} onChange={onChange} placeholder={n.ph} />
      )}
    </div>
  );
}
