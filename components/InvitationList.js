"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABEL = {
  pending: "待回覆",
  accepted: "已接受",
  declined: "已婉拒",
  completed: "已完成",
};

export default function InvitationList({ invitations }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function act(id, patch) {
    setBusy(id);
    await fetch("/api/invitations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    setBusy("");
    router.refresh();
  }

  if (!invitations.length) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>還沒有任何 121 邀約。到「媒合推薦」找合適的夥伴發起第一個邀約吧！</p>
      </div>
    );
  }

  return (
    <div>
      {invitations.map((inv) => (
        <div className="match" key={inv.id}>
          <div className="top">
            <span className="name">{inv.direction === "received" ? inv.fromName : inv.toName}</span>
            <span className="badge">{inv.direction === "received" ? "收到邀約" : "我發出的"}</span>
            <span className={`status ${inv.status}`}>{STATUS_LABEL[inv.status]}</span>
          </div>
          {inv.message && <div className="reason">「{inv.message}」</div>}

          {/* 收到的、待回覆 → 接受 / 婉拒 */}
          {inv.direction === "received" && inv.status === "pending" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn sm" disabled={busy === inv.id} onClick={() => act(inv.id, { status: "accepted" })}>接受</button>
              <button className="btn ghost sm" disabled={busy === inv.id} onClick={() => act(inv.id, { status: "declined" })}>婉拒</button>
            </div>
          )}

          {/* 已接受 → 可標記完成 + 留筆記 */}
          {inv.status === "accepted" && (
            <CompleteBox inv={inv} onComplete={(note) => act(inv.id, { status: "completed", note })} busy={busy === inv.id} />
          )}

          {/* 已完成 → 顯示筆記 */}
          {inv.status === "completed" && inv.note && (
            <div className="ok" style={{ marginTop: 4 }}>121 筆記：{inv.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function CompleteBox({ inv, onComplete, busy }) {
  const [note, setNote] = useState(inv.note || "");
  return (
    <div>
      <label style={{ marginTop: 6 }}>121 完成筆記 <span className="hint">聊了什麼、可互相引薦什麼、下一步</span></label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="例：他可以幫我引薦兩家工廠，我幫他看官網 SEO…" />
      <div style={{ marginTop: 8 }}>
        <button className="btn sm" disabled={busy} onClick={() => onComplete(note)}>標記完成並儲存筆記</button>
      </div>
    </div>
  );
}
