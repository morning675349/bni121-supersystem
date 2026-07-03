import Link from "next/link";
import { getSessionUser } from "@/lib/auth.js";
import { getProfile } from "@/lib/store.js";
import { getBniMember } from "@/lib/members.js";
import { listRegions } from "@/scraper/regions.js";
import ProfileForm from "@/components/ProfileForm.js";
import NetworkCircleForm from "@/components/NetworkCircleForm.js";

export default async function ProfilePage() {
  const user = await getSessionUser();
  const profile = (await getProfile(user.id)) || {};
  const regions = listRegions().map((r) => r.zh);
  const claimed = profile.claimedBniId ? getBniMember(profile.claimedBniId) : null;

  return (
    <div>
      <div className="card">
        {claimed ? (
          <>
            <span className="badge user">✓ 已認領官方資料</span>
            <span style={{ marginLeft: 8 }}>{claimed.name}（{claimed.company || "—"}｜{claimed.chapter || "—"}分會）</span>
          </>
        ) : (
          <>
            <p className="muted" style={{ margin: 0 }}>
              如果你目前就是 BNI 會員，可以在會員名錄找到自己並「認領」，讓官方資料自動補進九宮格。
            </p>
            <Link className="btn ghost sm" href="/members" style={{ marginTop: 10, display: "inline-block" }}>
              前往會員名錄尋找並認領
            </Link>
          </>
        )}
      </div>
      <NetworkCircleForm initial={profile.networkCircle} />
      <ProfileForm initial={profile} regions={regions} />
    </div>
  );
}
