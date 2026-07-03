// 抓取設定 —— 全部集中在這裡方便調整
export const CONFIG = {
  SITEMAP_URL: "https://bni.com.tw/sitemaps/memberdetail_sitemap_1.xml.gz",
  DISPLAY_API: "https://bni.com.tw/bnicms/v3/frontend/memberdetail/display",
  BASE_REFERER: "https://bni.com.tw/zh-TW/memberdetails",

  // 禮貌抓取：每次請求間隔（毫秒）與隨機抖動，避免打爆對方伺服器 / 被封 IP
  DELAY_MS: 1500,
  JITTER_MS: 1000,
  MAX_RETRY: 3,
  TIMEOUT_MS: 30000,

  // 這些是頁面上抓到的固定參數（website_id 等）
  WEBSITE_ID: "10065",
  WEBSITE_TYPE: "1",
  USER_AGENT:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",

  // 資料檔位置
  INDEX_FILE: "data/members_index.json",
  MEMBERS_FILE: "data/members.json",
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 帶隨機抖動的禮貌延遲
export function politeDelay() {
  const jitter = Math.floor((CONFIG.JITTER_MS) * (Date.now() % 1000) / 1000);
  return sleep(CONFIG.DELAY_MS + jitter);
}
