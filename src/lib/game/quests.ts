// 이 파일이 하는 일: 날짜 시드 기반 퀘스트 자동 생성 (PRD 4-6 기반)

import type { Book } from "@/types/database";

export interface Quest {
  id: string;
  title: string;
  reward: number;       // Gold
  progress: number;
  total: number;
  type: string;
  icon: string;
  completed: boolean;
}

export interface QuestSet {
  daily: Quest[];
  weekly: Quest[];
  monthly: Quest[];
}

// 사용자 독서 통계 (퀘스트 난이도 조정에 사용)
export interface UserReadingStats {
  avgDailyPages: number;
  avgWeeklyPages: number;
  avgMonthlyPages: number;
  avgMonthlyBooks: number;
  streak: number;
}

// 시드 기반 의사 난수 생성기 (같은 날짜 = 같은 퀘스트)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// 날짜 시드 계산
function getSeeds() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const weekNum = Math.floor(d / 7);

  return {
    daily:   y * 10000 + m * 100 + d,
    weekly:  y * 10000 + m * 100 + weekNum * 1000,
    monthly: y * 100 + m,
  };
}

export function generateQuests(books: Book[], userStats: UserReadingStats): QuestSet {
  const readingBooks = books.filter((b) => b.status === "reading");
  const seeds = getSeeds();

  // ── 일일 퀘스트 풀 ────────────────────────────────────
  const dailyPool = [
    (r: () => number) => ({
      title: `오늘 ${Math.round(userStats.avgDailyPages * 1.1)}페이지 읽기`,
      reward: 20, total: Math.round(userStats.avgDailyPages * 1.1), type: "pages_today", icon: "📖",
    }),
    () => ({
      title: `오늘 ${Math.max(15, Math.round(userStats.avgDailyPages * 0.5))}페이지 이상 읽기`,
      reward: 15, total: Math.max(15, Math.round(userStats.avgDailyPages * 0.5)), type: "pages_today", icon: "📖",
    }),
    (r: () => number) => {
      if (!readingBooks.length) return null;
      const book = readingBooks[Math.floor(r() * readingBooks.length)];
      const target = Math.min(book.read_pages + 20, book.total_pages);
      return { title: `"${book.title}" ${target}p까지 읽기`, reward: 25, total: target - book.read_pages, type: "specific_book", icon: "🎯" };
    },
    () => ({ title: "오늘도 독서 기록 남기기", reward: 15, total: 1, type: "record_today", icon: "🔥" }),
    () => ({ title: "독서 메모 1개 작성", reward: 20, total: 1, type: "memo", icon: "✏️" }),
    () => ({ title: "앱 접속하기", reward: 10, total: 1, type: "login", icon: "👋" }),
    () => ({ title: `도전! ${Math.round(userStats.avgDailyPages * 1.1)}p 읽기 (평균+10%)`, reward: 30, total: Math.round(userStats.avgDailyPages * 1.1), type: "pages_challenge", icon: "⚡" }),
    () => ({ title: "자기계발 책 읽기", reward: 20, total: 1, type: "genre_read", icon: "📚" }),
  ];

  // ── 주간 퀘스트 풀 ────────────────────────────────────
  const weeklyPool = [
    () => ({
      title: `이번 주 ${Math.round(userStats.avgWeeklyPages * 1.1)}p 읽기 (평균+10%)`,
      reward: 100, total: Math.round(userStats.avgWeeklyPages * 1.1), type: "weekly_pages", icon: "📊",
    }),
    () => ({ title: "이번 주 1권 완독하기", reward: 120, total: 1, type: "weekly_complete", icon: "🏆" }),
    () => ({ title: "7일 연속 독서하기", reward: 100, total: 7, type: "weekly_streak", icon: "🔥" }),
    () => ({ title: "5일 이상 독서하기", reward: 60, total: 5, type: "weekly_days", icon: "📅" }),
    () => ({ title: "2가지 이상 장르 읽기", reward: 80, total: 2, type: "weekly_genre_variety", icon: "🌈" }),
    () => ({ title: "독서 메모 3개 작성하기", reward: 70, total: 3, type: "weekly_memo", icon: "✏️" }),
    (r: () => number) => {
      if (!readingBooks.length) return null;
      const book = readingBooks[Math.floor(r() * readingBooks.length)];
      const target = Math.min(Math.round((book.total_pages - book.read_pages) * 0.5), 150);
      return { title: `"${book.title}" ${target}p 더 읽기`, reward: 90, total: target, type: "weekly_specific", icon: "🎯" };
    },
  ];

  // ── 월간 퀘스트 풀 ────────────────────────────────────
  const monthlyPool = [
    () => ({
      title: `이번 달 ${Math.round(userStats.avgMonthlyPages * 1.1)}p 읽기 (평균+10%)`,
      reward: 500, total: Math.round(userStats.avgMonthlyPages * 1.1), type: "monthly_pages", icon: "📊",
    }),
    () => ({
      title: `이번 달 ${Math.max(1, Math.round(userStats.avgMonthlyBooks * 1.1))}권 완독하기`,
      reward: 400, total: Math.max(1, Math.round(userStats.avgMonthlyBooks * 1.1)), type: "monthly_books", icon: "📚",
    }),
    () => ({ title: "20일 이상 독서하기", reward: 400, total: 20, type: "monthly_days", icon: "🔥" }),
    () => ({ title: "15일 연속 독서 달성", reward: 500, total: 15, type: "monthly_streak", icon: "💎" }),
    () => ({ title: "3가지 이상 장르 읽기", reward: 300, total: 3, type: "monthly_genre", icon: "🌈" }),
    () => ({ title: "새로운 장르 도전하기", reward: 250, total: 1, type: "monthly_new_genre", icon: "🌟" }),
    (r: () => number) => {
      if (!readingBooks.length) return null;
      const book = readingBooks[Math.floor(r() * readingBooks.length)];
      return { title: `"${book.title}" 완독하기`, reward: 350, total: 1, type: "monthly_specific_complete", icon: "🎯" };
    },
  ];

  function pickQuests(
    pool: Array<(r: () => number) => { title: string; reward: number; total: number; type: string; icon: string } | null>,
    count: number,
    seed: number
  ): Quest[] {
    const r = seededRandom(seed);
    const shuffled = [...pool].sort(() => r() - 0.5);
    const result: Quest[] = [];

    for (const gen of shuffled) {
      if (result.length >= count) break;
      const q = gen(r);
      if (q) {
        result.push({
          ...q,
          id: `q_${seed}_${result.length}`,
          progress: 0,
          completed: false,
        });
      }
    }
    return result;
  }

  return {
    daily:   pickQuests(dailyPool,   3, seeds.daily),
    weekly:  pickQuests(weeklyPool,  3, seeds.weekly),
    monthly: pickQuests(monthlyPool, 3, seeds.monthly),
  };
}

// 기본 사용자 통계 (데이터 없을 때 사용)
export const DEFAULT_USER_READING_STATS: UserReadingStats = {
  avgDailyPages: 30,
  avgWeeklyPages: 210,
  avgMonthlyPages: 840,
  avgMonthlyBooks: 1,
  streak: 0,
};
