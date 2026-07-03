# BNI 121 對接媒合系統

讓 BNI 會員以九宮格/81宮格資料，被系統自動配對出最適合 121 的對象，並在平台上互相邀約。

## 快速啟動 Web 平台

後端：**Firebase**（Auth 做帳號登入、Firestore 存九宮格與 121 邀約）。BNI 抓取的公開會員資料維持本地 JSON（唯讀、資料量大、不需進資料庫）。

### 1. 設定 Firebase
1. 到 [Firebase Console](https://console.firebase.google.com/) 開啟你的專案 → **Authentication** → Sign-in method → 啟用「電子郵件/密碼」
2. **Firestore Database** → 建立資料庫（production mode）→ 到 Rules 分頁貼上 [firestore.rules](firestore.rules) 的內容（前端不直接連 Firestore，一律由伺服器端 Admin SDK 存取，故規則設為拒絕直接存取）
3. 專案設定 → **Service accounts** → Generate new private key，下載 JSON
4. 複製 `.env.local.example` 為 `.env.local`，把 JSON 裡的 `client_email` / `private_key` 填入對應欄位（`private_key` 保留 `\n`，不要真的換行）

### 2. 啟動
```bash
npm install
npm run dev          # 開發模式（webpack）→ http://localhost:3000
# 首次或想更新資料：npm run sitemap && npm run scrape -- --sample --limit 60
```
> 註：路徑含中文時 Turbopack 會崩，故 dev/build 已固定用 `--webpack`。新增動態路由(如 `[id]`)後 dev server 需重啟才會註冊。

功能：帳號登入 → 填九宮格 → 媒合推薦（雙向互惠）→ 121 邀約/接受/完成筆記 → BNI 會員名錄搜尋（列表精簡摘要，完整資料在內頁）。

### Web 目錄
```
app/                Next.js App Router 頁面
  page.js           首頁（未登入導向）
  login/ register/  登入 / 註冊
  (app)/            登入後區塊（媒合/邀約/名錄+內頁/九宮格）
  api/              auth / profile / invitations 後端
components/          Nav / ProfileForm / MatchCard / InvitationList / MembersBrowser
lib/
  firebaseAdmin.js  Firebase Admin SDK 初始化（讀 .env.local 服務帳戶金鑰）
  auth.js           Firebase Auth：Identity Toolkit REST 驗證密碼 + session cookie
  store.js          Firestore：profiles / invitations CRUD
  members.js        BNI 抓取資料（本地 JSON，唯讀）
  matching.js        橋接引擎（BNI 會員 + 平台用戶 → 雙向互惠媒合）
  textClean.js      顯示層文字清理（濾除會員自行貼上的網址雜訊）
```

---


## 現況（Phase 0：資料管道 + 媒合核心，已驗證可運作）

資料來源走 **官方公開會員頁**（bni.com.tw 自己放在 sitemap 供搜尋引擎索引的 12,753 位會員），
免登入、照官方 sitemap 走、禮貌限速。

```
官方 sitemap（12,753 人）
   → memberdetail/display API（POST）
   → 解析：姓名/公司/產業/專長/分會/聯絡/GAINS 六大欄位
   → 雙向互惠媒合引擎（A 想找的 ↔ B 能提供的，互惠加成、同業扣分）
```

### 目錄
```
scraper/
  config.js        抓取設定（限速、端點、UA）
  fetchSitemap.js  下載官方 sitemap → data/members_index.json
  fetchMember.js   呼叫 display API 取單一會員 HTML
  parseMember.js   HTML → 結構化會員物件（含 6 大業務欄位）
  scrape.js        主抓取程式（斷點續抓、限速、進度）
  similarity.js    中文友善相似度（bigram/trigram 重疊；之後換 embedding）
  match.js         雙向互惠媒合引擎 + 產生「為什麼該 121」理由
data/
  members_index.json  全體會員索引
  members.json        已抓取的會員資料
  match_report.json   媒合結果示範
```

### 執行
```bash
npm install
npm run sitemap                 # 建立全體會員索引
npm run scrape -- --sample --limit 60   # 抓樣本（測試用）
# npm run scrape                # 抓全部（斷點續抓，可分批）
npm run match                   # 產生媒合示範報告
```

## 抓取的欄位
- 基本：姓名、公司、產業別(BNI category)、專長、分會、頭像、地址、網站
- 聯絡：電話/行動/董事/免費專線/傳真（**建議：平台上配對成立才顯示**）
- GAINS/引薦：我的業務、理想的引薦、解決過的最大難題、理想引薦搭檔、最佳產品、BNI 故事

## 媒合邏輯（reciprocalScore）
- `A 想找的(idealReferral/idealPartner)` ↔ `B 能提供的(business/category/product)`
- 雙向都算分 → **互惠(mutual) x1.5 加成**
- 同一 BNI 產業別（潛在競爭者）x0.4 降權
- 之後：embedding 撈候選 + GPT 排序並生成自然的「該 121 理由 + 破冰話題」

## Roadmap
- **Phase 1**：Web 平台（帳號登入 + 九宮格填寫 + 媒合推薦 + 121 邀約/狀態）— Next.js + Firebase ✅
- **Phase 2**：81宮格、統計儀表板、遊戲化排行榜、LINE/Email 通知、embedding+GPT 媒合理由
- **Phase 3**：多分會/跨區、談官方合作與資料串接、全台推廣、部署上線（Vercel）

## 合規備註
- 僅抓取 bni.com.tw 主動放入 sitemap 的公開會員頁；robots.txt 無 Disallow。
- 禮貌限速（預設每請求 1.5s+ 抖動），避免造成對方伺服器負擔。
- 聯絡方式建議「配對成立才顯示」或深連結回官方頁，降低變成群發名單的風險。
