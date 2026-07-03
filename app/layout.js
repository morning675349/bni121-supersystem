import "./globals.css";

export const metadata = {
  title: "BNI 121 對接媒合系統",
  description: "填九宮格，讓系統為你配對最適合 121 的夥伴",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
