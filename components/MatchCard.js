"use client";
import { useState } from "react";
import Link from "next/link";

export default function MatchCard({ m }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [err, setErr] = useState("");

  async function invite() {
    setState("sending");
    setErr("");
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: m.id, message: `想跟你約個 121 交流！` }),
    });
    if (res.ok) setState("sent");
    else { setState("error"); setErr((await res.json()).error || "邀約失敗"); }
  }

  return (
    <div className="match">
      <div className="top">
        <span className="name">{m.name}</span>
        {m.mutual && <span className="badge mutual">★ 雙向互惠</span>}
        <span className={`badge ${m.source === "user" ? "user" : "bni"}`}>
          {m.source === "user" ? "平台會員" : "BNI 夥伴"}
        </span>
        {m.region && <span className="badge chapter">{m.region}</span>}
        {m.sameChapter && <span className="badge chapter">同分會</span>}
      </div>
      <div className="cat">
        {[m.company, m.categoryEn || m.specialty, m.chapter && `${m.chapter}分會`].filter(Boolean).join("　·　")}
      </div>
      <div className="reason">💡 {m.reason}</div>
      {(m.mutualCircleHits?.length > 0 || m.circleHits?.length > 0 || m.aHits?.length > 0) && (
        <div className="hits">
          {m.mutualCircleHits?.slice(0, 5).map((h, i) => (
            <span className="hit hit-circle-mutual" key={`mc${i}`} title="你們的人脈圈都想認識">★ {h}</span>
          ))}
          {m.circleHits?.slice(0, 5).map((h, i) => (
            <span className="hit hit-circle" key={`c${i}`} title="你的人脈圈想認識，正是對方專業">{h}</span>
          ))}
          {m.aHits?.slice(0, 5).map((h, i) => <span className="hit" key={`a${i}`}>{h}</span>)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
        <span className="score">綜合分數 {m.score}</span>
        <div className="spacer" style={{ flex: 1 }} />
        {m.source === "user" ? (
          state === "sent" ? (
            <span className="status accepted">已送出邀約</span>
          ) : (
            <button className="btn sm" onClick={invite} disabled={state === "sending"}>
              {state === "sending" ? "送出中…" : "邀約 121"}
            </button>
          )
        ) : (
          <>
            <Link className="btn ghost sm" href={`/members/${encodeURIComponent(m.id)}`}>查看完整資料</Link>
            {m.sourceUrl && (
              <a className="btn ghost sm" href={m.sourceUrl} target="_blank" rel="noreferrer">查看官方頁</a>
            )}
          </>
        )}
      </div>
      {m.source !== "user" && (
        <div className="muted" style={{ fontSize: 12 }}>此夥伴尚未加入平台，聯絡方式請見官方頁；可邀請他加入以進行線上 121。</div>
      )}
      {err && <div className="error" style={{ marginTop: 6 }}>{err}</div>}
    </div>
  );
}
