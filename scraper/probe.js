// 探測用：抓幾位會員，印出可讀文字與區塊標題，協助設計解析器
import { readFileSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { CONFIG, politeDelay } from "./config.js";
import { fetchMemberHtml } from "./fetchMember.js";

const index = JSON.parse(readFileSync(CONFIG.INDEX_FILE, "utf8"));
const N = Number(process.argv[2] || 15);

// 從清單各處取樣，增加拿到「有填業務欄位」的機會
const step = Math.floor(index.length / N);
const sample = [];
for (let i = 0; i < N; i++) sample.push(index[i * step]);

const out = [];
for (const m of sample) {
  try {
    const html = await fetchMemberHtml(m);
    const $ = cheerio.load(html);
    // 收集所有標題類文字
    const headings = [];
    $("h1,h2,h3,h4,h5,strong,.title,[class*='title'],[class*='Title'],[class*='heading']").each((_, el) => {
      const t = $(el).text().replace(/\s+/g, " ").trim();
      if (t && t.length < 40) headings.push(t);
    });
    const text = $.root().text().replace(/\s+/g, " ").trim().slice(0, 300);
    const hasBiz = html.includes("我的業務") || html.includes("理想的引薦");
    out.push({ name: m.name, hasBiz, headings: [...new Set(headings)], preview: text });
    console.log(`${hasBiz ? "★" : " "} ${m.name} | 標題: ${[...new Set(headings)].join(" / ")}`);
  } catch (e) {
    console.log(`✗ ${m.name} 失敗: ${e.message}`);
  }
  await politeDelay();
}

writeFileSync("data/probe.json", JSON.stringify(out, null, 2));
console.log(`\n已存 data/probe.json（${out.length} 筆），其中有業務欄位: ${out.filter((o) => o.hasBiz).length} 筆`);
