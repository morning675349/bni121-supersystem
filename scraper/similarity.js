// 中文友善的文字相似度 —— v1 用「中文字 bigram + 英數詞」重疊
// 之後可無痛替換成 OpenAI embeddings（把 textSim 換成向量 cosine 即可）

const STOP = new Set([
  "的", "了", "和", "與", "及", "或", "在", "是", "有", "我", "你", "他", "們",
  "想", "要", "可以", "一般", "好的", "夢幻", "引薦", "公司", "服務", "產品",
  "客戶", "相關", "各種", "以及", "等", "為", "會", "能", "請", "把", "如",
]);

// 取出比對用的 token：中文抽 bigram、英數抽整詞
export function tokenize(text) {
  if (!text) return [];
  const s = String(text)
    .toLowerCase()
    .replace(/[，。、！？；：（）()「」『』\[\]{}<>/\\|.,!?;:"'’“”\-_~@#$%^&*=+\n\r\t]/g, " ");
  const tokens = [];
  // 英數詞
  for (const w of s.match(/[a-z0-9]{2,}/g) || []) tokens.push(w);
  // 中文字序列 → bigram
  for (const seg of s.match(/[一-鿿]{2,}/g) || []) {
    for (let i = 0; i < seg.length - 1; i++) {
      const bg = seg.slice(i, i + 2);
      if (!STOP.has(bg)) tokens.push(bg);
    }
    // 單一常見產業關鍵字（3字詞的 trigram 也加，抓「製造商/理療師」這類）
    for (let i = 0; i < seg.length - 2; i++) tokens.push(seg.slice(i, i + 3));
  }
  return tokens.filter((t) => !STOP.has(t));
}

// 加權重疊相似度（非對稱：want 對 offer）→ 0~1
// 回傳 { score, hits }：hits 是命中的關鍵詞，用於產生「為什麼該 121」的理由
export function textSim(wantText, offerText) {
  const want = tokenize(wantText);
  const offer = new Set(tokenize(offerText));
  if (!want.length || !offer.size) return { score: 0, hits: [] };
  const hitSet = new Map();
  let hit = 0;
  for (const t of want) {
    if (offer.has(t)) {
      hit++;
      // 3 字詞（更具體）給較高權重，並記錄可讀的命中詞
      const w = t.length >= 3 ? 2 : 1;
      hitSet.set(t, (hitSet.get(t) || 0) + w);
    }
  }
  const wantSet = new Set(want);
  const score = hit / Math.sqrt(wantSet.size * offer.size);
  // 命中詞去重：先取長詞，若短詞已被某長詞包含就丟掉（去掉「萬以上/萬以/以上」這類碎片）
  const sorted = [...hitSet.entries()]
    .sort((a, b) => b[0].length - a[0].length || b[1] - a[1])
    .map(([k]) => k)
    .filter((k) => k.length >= 2);
  const hits = [];
  for (const k of sorted) {
    if (!hits.some((h) => h.includes(k))) hits.push(k);
  }
  return { score: Math.min(1, score), hits: hits.slice(0, 6) };
}
