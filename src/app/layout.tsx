import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中国高职院校政策研究平台",
  description: "1540所专科层次院校数据查询、政策研究与统计分析平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#F2F5FA] text-[#1A2742] text-[13px] h-screen overflow-hidden flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
