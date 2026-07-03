import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 上層目錄也有 package-lock.json，Next.js 會誤判 workspace root，明確指定避免猜錯。
  outputFileTracingRoot: __dirname,
  // 部署到 Vercel 時，data/*.json（BNI 抓取資料，用 fs.readFileSync 動態路徑讀取）
  // 不一定會被自動追蹤打包進 serverless function，這裡明確強制納入，避免上線後讀不到資料。
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
  // firebase-admin 的相依鏈(jwks-rsa require 了 ESM-only 的 jose)被 webpack 打包後
  // 在 Vercel serverless 執行環境會噴 ERR_REQUIRE_ESM，排除它讓 Next.js 不要打包、
  // 執行時直接用原生 Node 模組載入即可正常運作。
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
