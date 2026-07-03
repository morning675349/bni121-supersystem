// 抓單一會員原始 HTML 並印出結構，供設計解析器
import { readFileSync, writeFileSync } from "node:fs";
import { CONFIG } from "./config.js";
import { fetchMemberHtml } from "./fetchMember.js";

const q = process.argv[2] || "于";
const index = JSON.parse(readFileSync(CONFIG.INDEX_FILE, "utf8"));
const m = index.find((x) => x.name.includes(q));
if (!m) { console.log("找不到", q); process.exit(1); }
console.log("抓取:", m.name);
const html = await fetchMemberHtml(m);
writeFileSync("data/one.html", html);
console.log("已存 data/one.html，長度", html.length);
