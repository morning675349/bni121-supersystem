import { getSessionUser } from "@/lib/auth.js";
import { getProfile } from "@/lib/store.js";
import { listRegions } from "@/scraper/regions.js";
import ProfileForm from "@/components/ProfileForm.js";
import NetworkCircleForm from "@/components/NetworkCircleForm.js";

export default async function ProfilePage() {
  const user = await getSessionUser();
  const profile = (await getProfile(user.id)) || {};
  const regions = listRegions().map((r) => r.zh);
  return (
    <div>
      <NetworkCircleForm initial={profile.networkCircle} />
      <ProfileForm initial={profile} regions={regions} />
    </div>
  );
}
