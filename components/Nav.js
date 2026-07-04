"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/matches", label: "媒合推薦" },
  { href: "/favorites", label: "我的最愛" },
  { href: "/plan", label: "121 計劃" },
  { href: "/invitations", label: "121 邀約" },
  { href: "/members", label: "會員名錄" },
  { href: "/profile", label: "我的資料" },
];

export default function Nav({ userName }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/matches" className="brand brand-logo" style={{ textDecoration: "none" }}>
          <img src="/bni-badge.png" alt="BNI" />
          BNI 121 <small>對接媒合</small>
        </Link>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
        <div className="spacer" />
        <span className="muted" style={{ fontSize: 13 }}>{userName}</span>
        <button className="btn ghost sm" onClick={logout}>登出</button>
      </div>
    </nav>
  );
}
