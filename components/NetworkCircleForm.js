"use client";
import { useState } from "react";

const EMPTY_CATS = Array.from({ length: 8 }, () => ({ name: "", items: [] }));

export default function NetworkCircleForm({ initial }) {
  const initCats = initial?.categories?.length ? initial.categories : EMPTY_CATS;
  const [center, setCenter] = useState(initial?.center || "");
  const [cats, setCats] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      name: initCats[i]?.name || "",
      itemsText: (initCats[i]?.items || []).join("、"),
    }))
  );
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function setCat(i, patch) {
    setCats((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const categories = cats.map((c) => ({
      name: c.name.trim(),
      items: c.itemsText.split(/[、,，\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 8),
    }));
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ networkCircle: { center, categories } }),
    });
    setSaving(false);
    setMsg(res.ok ? "已儲存！媒合時會參考你想認識的夥伴類型。" : "儲存失敗");
  }

  return (
    <form className="card" onSubmit={save}>
      <h2>我的業務人脈圈</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        以你的核心服務為中心，往外盤點 8 類「營運／營銷夥伴」，每類再列出具體想認識的角色（最多 8 個）。
        這是你自己客製的曼陀羅九宮格/81宮格，沒有固定分類，依你的事業自由填寫。
      </p>
      {msg && <div className="ok">{msg}</div>}

      <label style={{ marginTop: 6 }}>核心身份 / 主力服務 <span className="hint">九宮格正中央</span></label>
      <input value={center} onChange={(e) => setCenter(e.target.value)} placeholder="例：網站行銷" />

      <div className="circle-grid">
        {cats.map((c, i) => (
          <div className="circle-cat" key={i}>
            <input
              className="circle-cat-name"
              value={c.name}
              onChange={(e) => setCat(i, { name: e.target.value })}
              placeholder={`分類 ${i + 1}，例：政府計劃`}
            />
            <textarea
              className="circle-cat-items"
              value={c.itemsText}
              onChange={(e) => setCat(i, { itemsText: e.target.value })}
              placeholder="具體項目，用頓號或逗號分隔，最多8個。例：中衛中心、工研院、商研院、生產力中心"
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn" disabled={saving}>{saving ? "儲存中…" : "儲存業務人脈圈"}</button>
      </div>

      <NetworkCirclePreview center={center} cats={cats} />
    </form>
  );
}

function NetworkCirclePreview({ center, cats }) {
  const hasContent = center || cats.some((c) => c.name || c.itemsText);
  if (!hasContent) return null;

  return (
    <div className="circle-preview">
      <h3 style={{ fontSize: 14, color: "#6b7280", marginBottom: 10 }}>預覽</h3>
      <div className="mandala">
        {cats.map((c, i) => {
          const items = c.itemsText.split(/[、,，\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
          return (
            <div className="mandala-cell" key={i}>
              <div className="mandala-cell-title">{c.name || `分類 ${i + 1}`}</div>
              <div className="mandala-cell-items">
                {items.length ? items.map((it, j) => <span key={j} className="mandala-chip">{it}</span>) : <span className="mandala-chip empty">未填寫</span>}
              </div>
            </div>
          );
        })}
        <div className="mandala-center">{center || "核心身份"}</div>
      </div>
    </div>
  );
}
