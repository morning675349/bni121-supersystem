// 雙向互惠媒合引擎
// 核心：A 想找的(idealReferral/idealPartner) ↔ B 能提供的(business/category/product)
// 雙向都算分，互惠才是好 121；同產業（潛在競爭）略扣分。
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { CONFIG } from "./config.js";
import { textSim } from "./similarity.js";

// 把會員資料整理成 offer（我是誰/我能給）與 want（我想找誰）兩段文字
export function toProfile(m) {
  const offer = [m.company, m.categoryEn, m.specialty, m.business, m.topProduct]
    .filter(Boolean)
    .join("。");
  const want = [m.idealReferral, m.idealPartner].filter(Boolean).join("。");
  return { ...m, _offer: offer, _want: want };
}

// 計算 A、B 的雙向互惠分數
export function reciprocalScore(A, B) {
  const aWantsB = textSim(A._want, B._offer); // A 想找的 ↔ B 能提供
  const bWantsA = textSim(B._want, A._offer); // B 想找的 ↔ A 能提供
  let score = aWantsB.score + bWantsA.score;

  // 互惠加成：雙向都有命中，價值更高
  const mutual = aWantsB.score > 0 && bWantsA.score > 0;
  if (mutual) score *= 1.5;

  // 同產業（潛在競爭者）略扣分——BNI 一個分類通常只留一位
  if (A.categoryEn && A.categoryEn === B.categoryEn) score *= 0.4;

  return {
    score,
    mutual,
    aWantsB: aWantsB.score,
    bWantsA: bWantsA.score,
    aHits: aWantsB.hits, // A 在 B 身上找到的關鍵詞
    bHits: bWantsA.hits, // B 在 A 身上找到的關鍵詞
    sameChapter: A.chapter && A.chapter === B.chapter,
  };
}

// 為某位會員找出前 N 個 121 對象
export function recommendFor(target, pool, topN = 5) {
  const results = [];
  for (const other of pool) {
    if (other.encryptedMemberId === target.encryptedMemberId) continue;
    const r = reciprocalScore(target, other);
    if (r.score <= 0) continue;
    results.push({ member: other, ...r });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

// 產生「為什麼該 121」的人類可讀理由（v1 模板；之後由 GPT 生成更自然的版本）
export function explain(target, rec) {
  const b = rec.member;
  const lines = [];
  lines.push(`建議 121：${b.name}（${b.company || "—"}｜${b.categoryEn || b.specialty || "—"}｜${b.chapter || "—"}分會）`);
  if (rec.aHits.length)
    lines.push(`  ・你想找的方向，對上他的：「${rec.aHits.join("、")}」`);
  if (rec.bHits.length)
    lines.push(`  ・而你的專業，也正是他想認識的：「${rec.bHits.join("、")}」`);
  lines.push(`  ・互惠度：${rec.mutual ? "★ 雙向（彼此都能給價值）" : "單向"}｜綜合分數 ${rec.score.toFixed(2)}`);
  if (rec.sameChapter) lines.push(`  ・（提醒：同分會，可能已認識）`);
  return lines.join("\n");
}

// CLI：讀資料 → 為有填業務欄位的會員產生媒合推薦
function main() {
  const store = JSON.parse(readFileSync(CONFIG.MEMBERS_FILE, "utf8"));
  const all = Object.values(store).map(toProfile);
  const pool = all.filter((m) => (m._offer + m._want).length > 4);
  const rich = pool.filter((m) => m.hasProfile);

  console.log(`資料庫 ${all.length} 位｜可媒合 ${pool.length} 位｜有完整業務欄位 ${rich.length} 位\n`);

  const report = [];
  const demoTargets = rich.slice(0, 8); // 先示範前 8 位
  for (const t of demoTargets) {
    const recs = recommendFor(t, pool, 3);
    console.log(`\n══════════════════════════════════════`);
    console.log(`【${t.name}】${t.company}｜${t.categoryEn}｜想找：${(t._want || "—").slice(0, 40)}…`);
    console.log(`──────────────────────────────────────`);
    if (!recs.length) { console.log("  （目前資料池太小，暫無合適對象）"); continue; }
    for (const r of recs) console.log(explain(t, r));
    report.push({ member: t.name, recommendations: recs.map((r) => ({ name: r.member.name, score: Number(r.score.toFixed(3)), mutual: r.mutual, aHits: r.aHits, bHits: r.bHits })) });
  }
  writeFileSync("data/match_report.json", JSON.stringify(report, null, 2));
  console.log(`\n\n媒合報告已存 data/match_report.json`);
}

// 只有「直接執行此檔」時才跑 CLI；被 import 時不執行
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
