import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth.js";
import { loadBniMembers } from "@/lib/members.js";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/matches");

  const count = loadBniMembers().length;

  return (
    <main className="container narrow">
      <div className="hero">
        <div className="brand" style={{ fontSize: 22 }}>
          BNI 121 <small>對接媒合系統</small>
        </div>
        <h1 style={{ marginTop: 20 }}>找到最值得<br />121 的那個人</h1>
        <p>
          填好你的九宮格，系統用<b>雙向互惠</b>邏輯，從全台 BNI 夥伴中
          為你配對「你想找的 × 對方能給的」最佳 121 對象。
        </p>
      </div>

      <div className="card center">
        <p className="muted" style={{ marginTop: 0 }}>目前資料庫已收錄 <b>{count}</b> 位 BNI 夥伴的公開商業資料</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
          <Link className="btn" href="/register">建立帳號</Link>
          <Link className="btn ghost" href="/login">登入</Link>
        </div>
      </div>

      <p className="center muted" style={{ fontSize: 13 }}>
        資料來源為 BNI 官方公開會員頁；聯絡方式於雙方同意 121 後才顯示。
      </p>
    </main>
  );
}
