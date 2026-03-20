// 이 파일이 하는 일: 상단 헤더 — 앱 로고, 골드, 레벨, 다크모드 토글, 크레딧
"use client";

import { useEffect, useState } from "react";
import { CreditsModal } from "./CreditsModal";

interface Props {
  gold: number;
  level: number;
}

export function Header({ gold, level }: Props) {
  const [dark, setDark] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  // 마운트 시 localStorage에서 테마 읽기
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bq-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bq-theme", "light");
    }
  }

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-4 bg-white dark:bg-[#242B24] border-b border-[#E8E4DD] dark:border-[#333D33] shadow-sm">
      {/* 로고 */}
      <div className="flex items-center gap-2">
        <span className="text-xl">⚔️</span>
        <span className="font-bold text-gray-800 dark:text-gray-100 text-base tracking-tight">
          Book Quest
        </span>
      </div>

      {/* 우측: 골드·레벨·다크모드 */}
      <div className="flex items-center gap-3">
        {/* 골드 */}
        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full">
          <span className="text-sm">🪙</span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {gold.toLocaleString()}
          </span>
        </div>

        {/* 레벨 */}
        <div className="flex items-center gap-1 bg-[#EEF3EE] dark:bg-[#3D5A3E]/25 px-2.5 py-1 rounded-full">
          <span className="text-xs font-bold text-[#3D5A3E] dark:text-[#6BA368]">
            Lv.{level}
          </span>
        </div>

        {/* 크레딧 */}
        <button
          onClick={() => setShowCredits(true)}
          className="text-sm leading-none text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="크레딧"
        >
          ⓘ
        </button>

        {/* 다크모드 토글 */}
        <button
          onClick={toggleTheme}
          className="text-lg leading-none text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>
    </header>

    {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
    </>
  );
}
