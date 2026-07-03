// 呼叫官方 chapterdetail/display API，取得單一分會的詳情 HTML 片段
import * as cheerio from "cheerio";
import { CONFIG } from "./config.js";

const MAPPED_WIDGET_SETTINGS = JSON.stringify([
  { key: 83, name: "Chapter Website", value: "分會網站" },
  { key: 84, name: "View Chapter Gallery", value: "檢視分會相片錦集" },
]);

export async function fetchChapterHtml(chapterId) {
  const cleanReferer = `https://bni.com.tw/zh-TW/chapterdetail?chapterId=${encodeURIComponent(chapterId)}`;
  const body = new URLSearchParams({
    pageMode: "Live_Site",
    chapterId,
    languageLocaleCode: "zh_TW",
    website_type: CONFIG.WEBSITE_TYPE,
    website_id: CONFIG.WEBSITE_ID,
    mappedWidgetSettings: MAPPED_WIDGET_SETTINGS,
    planyourvisit: "y",
  });

  let lastErr;
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRY; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS);
      const res = await fetch("https://bni.com.tw/bnicms/v3/frontend/chapterdetail/display", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": CONFIG.USER_AGENT,
          Referer: cleanReferer,
        },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastErr;
}

// 從會員頁 HTML 抽出其分會的 chapterId（Chapter 欄位的連結 href）
export function extractChapterId(memberHtml) {
  const $ = cheerio.load(memberHtml);
  let chapterId = null;
  $("strong").each((_, el) => {
    if ($(el).text().trim() !== "Chapter") return;
    const href = $(el).nextAll("a").first().attr("href") || "";
    const m = href.match(/chapterId=([^"&]+)/);
    if (m) chapterId = decodeURIComponent(m[1]);
  });
  return chapterId;
}

// 從分會詳情頁 HTML 抽出區域：優先用「分會網站」連結的子網域（連虛擬/線上分會都適用），
// 找不到則退回用會議地址反推（一般實體分會皆有固定會議地點）。
export function extractChapterInfo(html, subdomainToRegion) {
  const $ = cheerio.load(html);
  let subdomainRegion = null;
  $("a[href^='http']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/^https?:\/\/(bni[a-z0-9-]+\.com\.tw)/i);
    if (m && subdomainToRegion[m[1].toLowerCase()]) subdomainRegion = subdomainToRegion[m[1].toLowerCase()];
  });
  const address = $(".address").first().text().replace(/\s+/g, "").trim();
  return { subdomainRegion, address };
}
