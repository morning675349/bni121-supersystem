// 顯示層文字清理：部分會員在官方頁業務欄位貼了原始網址(如 LINE OAuth 連結)等雜訊，
// 不動原始抓取資料，只在畫面呈現前濾除，讓卡片維持乾淨。
export function displayText(text) {
  if (!text) return "";
  return String(text)
    .replace(/https?:\/\/\S+/gi, "") // 移除網址
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}
