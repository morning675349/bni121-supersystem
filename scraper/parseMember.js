// 解析 memberdetail/display 回傳的 HTML 片段 → 結構化會員物件
// 註：region（區域）不在這裡算——區域是「分會」這個組織層級本身固定的屬性，
// 跟會員個人地址無關，由 scraper/enrichRegions.js 依 data/chapterRegions.json 權威對照表統一指派。
import * as cheerio from "cheerio";

// GAINS / 引薦相關區塊：英文標題 key → 我們的欄位名
const SECTION_MAP = {
  "My Business": "business", // 我的業務
  "Ideal Referral": "idealReferral", // 理想的引薦（想被引薦給誰）
  "Top Problem Solved": "problemSolved", // 解決過的最大難題
  "My Ideal Referral Partner": "idealPartner", // 我理想中的引薦搭檔（能互相引薦的人）
  "Top Product": "topProduct", // 最佳產品
  "My Favorite BNI Story": "bniStory", // 我最喜歡的 BNI 故事
};

// 聯絡欄位標籤（中文）→ 欄位名
const CONTACT_MAP = {
  "電話": "phone",
  "行動電話": "mobile",
  "董事": "direct",
  "免費專線": "freephone",
  "傳真": "fax",
};

const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
// 保留段落換行的清理（給長文欄位用）
const cleanMultiline = (s) =>
  (s || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();

export function parseMember(html, seed = {}) {
  const $ = cheerio.load(html);
  const top = $(".widgetMemberProfileTop, .memberProfileInfo").first();

  // 姓名：優先用頁面 h2，退回 sitemap 帶入的 name
  const name = clean(top.find("h2").first().text()) || clean(seed.name) || "";

  // 公司：姓名後的第一個連結
  const company = clean(top.find("a").first().text());

  // 產業別 + 專長：h6 內容形如 "Health & Wellness (Other) | 幸福腦波調整"
  const catRaw = clean(top.find("h6").first().text());
  const [categoryEn, specialty] = catRaw.split("|").map((s) => clean(s));

  // 聯絡方式 + 分會：用 <strong> 標籤配對其後的 <a>
  const contact = {};
  let chapter = "";
  top.find("strong").each((_, el) => {
    const label = clean($(el).text());
    const val = clean($(el).next("a").text()) || clean($(el).nextAll("a").first().text());
    if (label === "Chapter") chapter = val;
    else if (CONTACT_MAP[label] && val) contact[CONTACT_MAP[label]] = val;
  });

  // 公司地址 / 網站
  const companyDetail = $(".widgetMemberCompanyDetail").first();
  const address = clean(companyDetail.find("h6").first().text());
  const website = clean(companyDetail.find("a").first().text());

  // 頭像
  const photo = $("img.img-responsive").first().attr("src") || "";

  // GAINS / 引薦區塊：找 h2/h3 標題文字命中 SECTION_MAP，取其後內容
  // 版面有兩種：單一兄弟區塊、或「My Business」這種左右兩欄(col-md-6 x2)並存 —
  // 兩欄時要把兩塊都收集起來，不能只取第一個就停。
  const sections = {};
  const HEADINGS = new Set(["h2", "h3", "h4"]);
  $("h2, h3, h4").each((_, el) => {
    const heading = clean($(el).clone().children().remove().end().text());
    const field = SECTION_MAP[heading];
    if (!field) return;

    const parts = [];
    // 先試自己緊接的兄弟
    let sib = $(el).next();
    let container = null;
    if (sib.length && clean(sib.text())) {
      container = $(el);
    } else {
      // 標題自己獨占一個 div（常見於雙欄版面），改從父層的下一個兄弟開始收集
      container = $(el).parent();
      sib = container.next();
    }
    // 持續收集兄弟區塊，直到遇到下一個標題（h2/h3/h4）或內容變空為止
    while (sib.length) {
      const tag = (sib.prop("tagName") || "").toLowerCase();
      if (HEADINGS.has(tag) || sib.find("h2,h3,h4").length) break;
      const t = clean(sib.text());
      if (!t) break;
      parts.push(cleanMultiline(sib.text()));
      sib = sib.next();
    }
    if (parts.length) sections[field] = parts.join("\n\n").trim();
  });

  return {
    encryptedMemberId: seed.encryptedMemberId || "",
    name,
    company,
    categoryEn: categoryEn || "",
    specialty: specialty || "",
    chapter,
    contact,
    address,
    website,
    photo,
    ...sections, // business / idealReferral / problemSolved / idealPartner / topProduct / bniStory
    hasProfile: Object.keys(sections).length > 0,
    sourceUrl: seed.url || "",
    scrapedAt: new Date().toISOString(),
  };
}
