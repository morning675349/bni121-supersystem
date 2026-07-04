import "./globals.css";

export const metadata = {
  title: "BNI 121 對接媒合系統",
  description: "填九宮格，讓系統為你配對最適合 121 的夥伴",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <footer className="site-footer">全冠分會 網站規劃顧問代表 王晨安 製作</footer>
      </body>
    </html>
  );
}
