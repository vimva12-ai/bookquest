// 이 파일이 하는 일: 구글 로그인 버튼이 있는 로그인 페이지 (클라이언트 컴포넌트)
// force-dynamic: 로그인 상태에 따라 달라지므로 정적 생성 불가
"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    // Supabase 클라이언트는 브라우저에서만 생성 (클릭 시점에 초기화)
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // 로그인 후 돌아올 주소 — Supabase 대시보드 허용 URL에도 추가해야 함
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    // signInWithOAuth는 리다이렉트하므로 여기서 setLoading(false) 불필요
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FC] dark:bg-[#0F1117] p-6">
      {/* 앱 로고 & 타이틀 */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">⚔️📖</div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Book Quest
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          책을 읽을수록 캐릭터가 성장하는<br />
          중세 판타지 독서 기록 앱
        </p>
      </div>

      {/* 로그인 카드 */}
      <div className="w-full max-w-sm bg-white dark:bg-[#1A1D27] rounded-2xl shadow-md p-8 flex flex-col items-center gap-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
          구글 계정으로 시작하세요
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-[#22252F] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 shadow-sm"
        >
          {/* 구글 아이콘 (SVG) */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
          {loading ? "로그인 중..." : "Google로 시작하기"}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-4 leading-relaxed">
          로그인 시 서비스 이용약관 및<br />개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>

      {/* 기능 소개 힌트 */}
      <div className="mt-8 flex gap-6 text-center">
        {[
          { icon: "📖", text: "독서 기록" },
          { icon: "⚔️", text: "캐릭터 성장" },
          { icon: "🏆", text: "업적 달성" },
        ].map((item) => (
          <div key={item.text} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
