import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "气温对比看板 | 经营决策支持",
  description: "多城市气温今年与去年同期对比可视化看板",
};

// NOTE: 百度统计追踪 ID，从环境变量读取，不硬编码在代码里
// 在 .env.local 中设置：NEXT_PUBLIC_BAIDU_ANALYTICS_ID=你的32位ID
const BAIDU_ID = process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}

        {/* 百度统计 — 仅在配置了 ID 时注入，不影响本地开发 */}
        {BAIDU_ID && (
          <Script
            id="baidu-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                var _hmt = _hmt || [];
                (function() {
                  var hm = document.createElement("script");
                  hm.src = "https://hm.baidu.com/hm.js?${BAIDU_ID}";
                  var s = document.getElementsByTagName("script")[0];
                  s.parentNode.insertBefore(hm, s);
                })();
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
