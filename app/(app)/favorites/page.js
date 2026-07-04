import Link from "next/link";
import { getSessionUser } from "@/lib/auth.js";
import { getProfile, listRelationships } from "@/lib/store.js";
import { resolveEntities } from "@/lib/entities.js";
import FavoriteButton from "@/components/FavoriteButton.js";
import MetToggle from "@/components/MetToggle.js";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getSessionUser();
  const [profile, relationships] = await Promise.all([getProfile(user.id), listRelationships(user.id)]);
  const myCategories = profile?.networkCircle?.categories || [];

  const relByTarget = new Map(relationships.map((r) => [r.targetId, r]));
  const favIds = relationships.filter((r) => r.favorite).map((r) => r.targetId);
  const entities = await resolveEntities(favIds);

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>我的最愛</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        收藏你想深入認識的 121 對象，準備好後可以標記「已 121 認識」並歸入你的人脈圈分類。
      </p>
      {entities.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            還沒有收藏任何人。到「媒合推薦」或「會員名錄」看到喜歡的對象時，點擊 ☆ 加入最愛。
          </p>
        </div>
      ) : (
        entities.map((e) => {
          const rel = relByTarget.get(e.id);
          return (
            <div className="match" key={e.id}>
              <div className="top">
                <span className="name">{e.name}</span>
                <span className={`badge ${e.source === "user" ? "user" : "bni"}`}>
                  {e.source === "user" ? "平台會員" : "BNI 夥伴"}
                </span>
                {e.region && <span className="badge chapter">{e.region}</span>}
                <div className="spacer" style={{ flex: 1 }} />
                <FavoriteButton targetId={e.id} initialFavorite />
              </div>
              <div className="cat">
                {[e.company, e.categoryEn || e.specialty, e.chapter && `${e.chapter}分會`].filter(Boolean).join("　·　")}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
                <MetToggle
                  targetId={e.id}
                  initialMet={!!rel?.met}
                  initialCategoryIndex={rel?.categoryIndex ?? null}
                  categories={myCategories}
                />
                {e.source === "bni" && (
                  <Link className="btn ghost sm" href={`/members/${encodeURIComponent(e.id)}`}>查看完整資料</Link>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
