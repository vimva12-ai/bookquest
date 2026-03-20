// 이 파일이 하는 일: 전체 앱을 감싸는 루트 레이아웃 — 다크모드 초기화 포함
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/ui/ThemeScript";

export const metadata: Metadata = {
  title: "Book Quest — RPG 독서 기록",
  description: "책을 읽을수록 캐릭터가 성장하는 중세 판타지 독서 기록 앱",
};

// 모바일 앱처럼 뷰포트 설정
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 다크모드 깜빡임 방지 — 페이지 로드 전에 실행 */}
        <ThemeScript />
      </head>
      <body className="bg-[#F7F8FC] dark:bg-[#0F1117] text-gray-800 dark:text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
