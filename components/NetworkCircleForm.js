"use client";
import { useState } from "react";

const EMPTY_CATS = Array.from({ length: 8 }, () => ({ name: "", items: [] }));

// 只是「範例」示意 8 大類長什麼樣子，用室內設計業者的人脈圈當說明(跟使用者自己的實際內容無關)，
// 每一類都不一樣，避免使用者誤以為要照抄同一個例子 8 次。
const EXAMPLES = [
  { name: "建材供應", items: "磁磚行、木地板行、油漆行、五金行" },
  { name: "家具家飾", items: "家具行、燈飾行、窗簾布行、寢具行" },
  { name: "廚衛設備", items: "廚具行、衛浴設備商、系統櫃廠商" },
  { name: "空間規劃", items: "建築師、庭園景觀設計師" },
  { name: "工程服務", items: "水電工程、冷氣空調、防水抓漏" },
  { name: "房產相關", items: "房仲業務、代書、銀行貸款專員" },
  { name: "行銷曝光", items: "攝影師、社群小編、網紅部落客" },
  { name: "售後保固", items: "清潔公司、保全系統、搬家公司" },
];

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
        透過業務人脈圈，我們能夠找到與自己有相同客戶但無競爭關係的行業夥伴，並互相合作和共生。
        這樣的合作可以增加業務曝光度、擴大客戶群體，並提升業績。
        這是你自己客製的曼陀羅九宮格/81宮格，沒有固定分類，依你的事業自由填寫（下方灰字僅為範例）。
      </p>
      {msg && <div className="ok">{msg}</div>}

      <label style={{ marginTop: 6 }}>核心身份 / 主力服務 <span className="hint">九宮格正中央</span></label>
      <input value={center} onChange={(e) => setCenter(e.target.value)} placeholder="例：室內設計" />

      <div className="circle-grid">
        {cats.map((c, i) => (
          <div className="circle-cat" key={i}>
            <input
              className="circle-cat-name"
              value={c.name}
              onChange={(e) => setCat(i, { name: e.target.value })}
              placeholder={`分類 ${i + 1}，例：${EXAMPLES[i].name}`}
            />
            <textarea
              className="circle-cat-items"
              value={c.itemsText}
              onChange={(e) => setCat(i, { itemsText: e.target.value })}
              placeholder={`具體項目，用頓號或逗號分隔，最多8個。例：${EXAMPLES[i].items}`}
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
