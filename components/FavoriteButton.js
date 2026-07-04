"use client";
import { useState } from "react";

export default function FavoriteButton({ targetId, initialFavorite = false, size = "sm" }) {
  const [fav, setFav] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);

  async function toggle(e) {
    e.preventDefault(); // 卡片本身可能是 <Link>，避免點收藏連帶觸發導頁
    e.stopPropagation();
    const next = !fav;
    setFav(next); // optimistic
    setLoading(true);
    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, favorite: next }),
    });
    setLoading(false);
    if (!res.ok) setFav(!next); // 失敗就還原
  }

  return (
    <button
      type="button"
      className={`fav-btn ${fav ? "on" : ""}`}
      onClick={toggle}
      disabled={loading}
      title={fav ? "取消最愛" : "加入最愛"}
      aria-label={fav ? "取消最愛" : "加入最愛"}
    >
      {fav ? "★ 已收藏" : "☆ 加入最愛"}
    </button>
  );
}
