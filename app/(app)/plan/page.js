import Link from "next/link";
import { getSessionUser } from "@/lib/auth.js";
import { getProfile, listRelationships } from "@/lib/store.js";
import { resolveEntities } from "@/lib/entities.js";

export const dynamic = "force-dynamic";

const EMPTY_CATS = Array.from({ length: 8 }, () => ({ name: "", items: [] }));

export default async function PlanPage() {
  const user = await getSessionUser();
  const [profile, relationships] = await Promise.all([getProfile(user.id), listRelationships(user.id)]);
  const nc = profile?.networkCircle;
  const cats = nc?.categories?.length ? nc.categories : EMPTY_CATS;

  const met = relationships.filter((r) => r.met);
  const metEntities = await resolveEntities(met.map((r) => r.targetId));
  const entityById = new Map(metEntities.map((e) => [e.id, e]));

  // 依 categoryIndex 分組已認識的人
  const byCategory = new Map();
  const uncategorized = [];
  for (const r of met) {
    const e = entityById.get(r.targetId);
    if (!e) continue;
    if (typeof r.categoryIndex === "number") {
      if (!byCategory.has(r.categoryIndex)) byCategory.set(r.categoryIndex, []);
      byCategory.get(r.categoryIndex).push(e);
    } else {
      uncategorized.push(e);
    }
  }

  const filledCount = cats.filter((_, i) => (byCategory.get(i) || []).length > 0).length;
  const namedCatCount = cats.filter((c) => c.name).length;

  const hasCircle = !!nc?.center || cats.some((c) => c.name);

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>我的 121 計劃</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        依你的業務人脈圈盤點：哪些分類已經有認識的關鍵人脈、哪些還是空缺。
        標記「已 121 認識」並歸類，就會顯示在這裡。
      </p>

      {!hasCircle ? (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>你還沒填業務人脈圈，先去設定 8 大類，才能盤點目前擁有的人脈資源。</p>
          <Link className="btn" href="/profile">前往設定業務人脈圈</Link>
        </div>
      ) : (
        <>
          <div className="stat-row" style={{ margin: "4px 0 20px" }}>
            <div className="stat"><b>{met.length}</b><span>位已 121 認識</span></div>
            <div className="stat"><b>{filledCount}/{namedCatCount || 8}</b><span>分類已有人脈</span></div>
            <div className="stat"><b>{uncategorized.length}</b><span>待歸類</span></div>
          </div>

          <div className="mandala" style={{ marginBottom: 24 }}>
            {cats.map((c, i) => {
              const people = byCategory.get(i) || [];
              return (
                <div className="mandala-cell" key={i}>
                  <div className="mandala-cell-title">{c.name || `分類 ${i + 1}`}</div>
                  <div className="mandala-cell-items">
                    {people.length ? (
                      people.map((p) => (
                        p.source === "bni" ? (
                          <Link key={p.id} href={`/members/${encodeURIComponent(p.id)}`} className="mandala-chip met">
                            ✓ {p.name}
                          </Link>
                        ) : (
                          <span key={p.id} className="mandala-chip met">✓ {p.name}</span>
                        )
                      ))
                    ) : (
                      <span className="mandala-chip empty">尚無人脈，還是空缺</span>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="mandala-center">{nc?.center || "核心身份"}</div>
          </div>

          {uncategorized.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: 15 }}>待歸類（已 121 但還沒指定分類）</h2>
              <div className="mandala-cell-items">
                {uncategorized.map((p) => (
                  p.source === "bni" ? (
                    <Link key={p.id} href={`/members/${encodeURIComponent(p.id)}`} className="mandala-chip met">{p.name}</Link>
                  ) : (
                    <span key={p.id} className="mandala-chip met">{p.name}</span>
                  )
                ))}
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 10, marginBottom: 0 }}>
                到對方的頁面或「我的最愛」，用下拉選單把他歸入對應分類。
              </p>
            </div>
          )}

          {met.length === 0 && (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>
                還沒有標記任何「已 121 認識」的對象。到「媒合推薦」「會員名錄」或「我的最愛」找到人後，點擊「標記已 121 認識」即可。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
