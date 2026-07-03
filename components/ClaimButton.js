"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// status: "unclaimed" | "mine" | "taken"
export default function ClaimButton({ bniId, status: initialStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function claim() {
    if (!confirm("確認這是你本人在 BNI 官方頁的資料嗎？認領後，你九宮格裡沒填的欄位會自動用這份官方資料補齊。")) return;
    setLoading(true);
    setErr("");
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bniId }),
    });
    setLoading(false);
    if (res.ok) {
      setStatus("mine");
      router.refresh();
    } else {
      setErr((await res.json()).error || "認領失敗");
    }
  }

  async function unclaim() {
    if (!confirm("確定要取消認領嗎？")) return;
    setLoading(true);
    await fetch("/api/claim", { method: "DELETE" });
    setLoading(false);
    setStatus("unclaimed");
    router.refresh();
  }

  if (status === "mine") {
    return (
      <div>
        <span className="badge user">✓ 已由你認領</span>
        <button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={unclaim} disabled={loading}>
          取消認領
        </button>
      </div>
    );
  }

  if (status === "taken") {
    return <span className="badge chapter">此資料已被其他會員認領</span>;
  }

  return (
    <div>
      <button className="btn sm" onClick={claim} disabled={loading}>
        {loading ? "處理中…" : "這是我，認領這筆資料"}
      </button>
      {err && <div className="error" style={{ marginTop: 6 }}>{err}</div>}
    </div>
  );
}
