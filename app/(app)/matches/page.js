import Link from "next/link";
import { getSessionUser } from "@/lib/auth.js";
import { getProfile, listRelationships } from "@/lib/store.js";
import { userProfileToEntity, getRecommendations } from "@/lib/matching.js";
import { loadBniMembers } from "@/lib/members.js";
import MatchCard from "@/components/MatchCard.js";

const RECOMMEND_COUNT = 20;

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await getSessionUser();
  const profile = await getProfile(user.id);

  const filled = profile && (profile.business || profile.idealReferral || profile.specialty);
  if (!filled) {
    return (
      <div className="card">
        <h2>先填九宮格，才能為你配對</h2>
        <p className="muted">系統需要你的業務、理想引薦等資料，才能算出雙向互惠的 121 對象。</p>
        <Link className="btn" href="/profile">前往填寫九宮格</Link>
      </div>
    );
  }

  const entity = userProfileToEntity(profile, user);
  const [recs, relationships] = await Promise.all([
    getRecommendations(entity, RECOMMEND_COUNT),
    listRelationships(user.id),
  ]);
  const favoriteIds = new Set(relationships.filter((r) => r.favorite).map((r) => r.targetId));
  const poolSize = loadBniMembers().length;

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>為你配對的 121 對象</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        從 {poolSize.toLocaleString()} 位 BNI 夥伴中，依「你想找的 × 對方能提供的」雙向互惠計算出前 {recs.length} 位，★ 代表彼此都能給對方價值。
      </p>
      {recs.length === 0 ? (
        <div className="card">
          <p className="muted">目前資料池中還沒有明顯合適的對象。試著把九宮格的「理想引薦 / 理想搭檔」寫得更具體，或等更多會員資料匯入。</p>
        </div>
      ) : (
        recs.map((m) => <MatchCard key={m.id} m={m} initialFavorite={favoriteIds.has(m.id)} />)
      )}
    </div>
  );
}
