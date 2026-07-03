// 呼叫官方 memberdetail/display API，取得單一會員的 HTML 片段
import { CONFIG, sleep } from "./config.js";

// 頁面上這兩個 JSON 參數是固定樣板，照原樣帶上即可
const LANGUAGES = JSON.stringify({
  availableLanguages: [
    {
      type: "published",
      url: "http://bni.com.tw/zh-TW/memberdetails",
      descriptionKey: "繁體中文",
      id: 8,
      localeCode: "zh_TW",
    },
  ],
  activeLanguage: { id: 8, localeCode: "zh_TW", descriptionKey: "繁體中文", cookieBotCode: "zh" },
});

const MAPPED_WIDGET_SETTINGS = JSON.stringify([
  { key: 124, name: "Direct", value: "董事" },
  { key: 125, name: "Mobile", value: "行動電話" },
  { key: 126, name: "Freephone", value: "免費專線" },
  { key: 127, name: "Fax", value: "傳真" },
  { key: 217, name: "Phone", value: "電話" },
]);

export async function fetchMemberHtml({ encryptedMemberId, url }) {
  // parameters = 網址 ? 之後的原始 query string
  const parameters = url.includes("?") ? url.slice(url.indexOf("?") + 1) : `encryptedMemberId=${encodeURIComponent(encryptedMemberId)}`;

  // Referer 標頭只能是 Latin1，不能含中文 → 用乾淨、只帶 id 的版本
  const cleanReferer = `${CONFIG.BASE_REFERER}?encryptedMemberId=${encodeURIComponent(encryptedMemberId)}`;

  const body = new URLSearchParams({
    parameters,
    languages: LANGUAGES,
    pageMode: "Live_Site",
    mappedWidgetSettings: MAPPED_WIDGET_SETTINGS,
    websitetype: CONFIG.WEBSITE_TYPE,
    website_type: CONFIG.WEBSITE_TYPE,
    website_id: CONFIG.WEBSITE_ID,
    memberId: encryptedMemberId, // 已是解碼後的值（== 而非 %3D%3D）
  });

  let lastErr;
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRY; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS);
      const res = await fetch(CONFIG.DISPLAY_API, {
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
      await sleep(1000 * attempt); // 退避重試
    }
  }
  throw lastErr;
}
