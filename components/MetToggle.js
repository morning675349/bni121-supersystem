"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// categories: 使用者自己人脈圈的 8 大類名稱（可能有空的，過濾後顯示）
export default function MetToggle({ targetId, initialMet = false, initialCategoryIndex = null, categories = [] }) {
  const router = useRouter();
  const [met, setMet] = useState(initialMet);
  const [categoryIndex, setCategoryIndex] = useState(initialCategoryIndex);
  const [saving, setSaving] = useState(false);

  const namedCategories = categories
    .map((c, i) => ({ i, name: c?.name || "" }))
    .filter((c) => c.name);

  async function save(patch) {
    setSaving(true);
    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, ...patch }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
    return res.ok;
  }

  async function markMet() {
    const ok = await save({ met: true, categoryIndex });
    if (ok) setMet(true);
  }

  async function unmark() {
    const ok = await save({ met: false });
    if (ok) setMet(false);
  }

  async function changeCategory(e) {
    const v = e.target.value;
    const idx = v === "" ? null : Number(v);
    setCategoryIndex(idx);
    await save({ met: true, categoryIndex: idx });
  }

  if (!met) {
    return (
      <button className="btn ghost sm" onClick={markMet} disabled={saving}>
        {saving ? "處理中…" : "標記已 121 認識"}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span className="badge user">✓ 已 121 認識</span>
      {namedCategories.length > 0 && (
        <select value={categoryIndex ?? ""} onChange={changeCategory} disabled={saving} style={{ width: "auto", fontSize: 13, padding: "4px 8px" }}>
          <option value="">歸入人脈圈分類…</option>
          {namedCategories.map((c) => (
            <option key={c.i} value={c.i}>{c.name}</option>
          ))}
        </select>
      )}
      <button className="btn ghost sm" onClick={unmark} disabled={saving}>取消標記</button>
    </div>
  );
}
