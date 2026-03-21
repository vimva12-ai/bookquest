// 이 파일이 하는 일: 날짜 시드 기반 퀘스트 자동 생성 (PRD 4-6 기반)

import type { Book, ReadingLog } from "@/types/database";

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

// ── 퀘스트 진행도 계산 ────────────────────────────────────

interface QuestContext {
  todayPages: number;
  todayLogCount: number;
  todayGenres: Set<string>;
  weekPages: number;
  weekReadDays: number;
  weekGenres: number;
  weekCompleted: number;
  monthPages: number;
  monthReadDays: number;
  monthGenres: number;
  monthCompleted: number;
  streak: number;
  bookPagesByTitle: Map<string, number>; // 오늘 책별 읽은 페이지
  weekBookPagesByTitle: Map<string, number>; // 이번 주 책별 읽은 페이지
}

function buildQuestContext(
  logs: ReadingLog[],
  books: Book[],
  streak: number,
): QuestContext {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const monthPrefix = todayStr.slice(0, 7); // "YYYY-MM"

  // 이번 주 시작일 (월요일)
  const dayOfWeek = now.getDay(); // 0=일 ~ 6=토
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  const weekStartStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

  let todayPages = 0;
  let todayLogCount = 0;
  const todayGenres = new Set<string>();
  let weekPages = 0;
  const weekDays = new Set<string>();
  const weekGenresSet = new Set<string>();
  let monthPages = 0;
  const monthDays = new Set<string>();
  const monthGenresSet = new Set<string>();
  const bookPagesByTitle = new Map<string, number>();
  const weekBookPagesByTitle = new Map<string, number>();

  // book_id → title 매핑
  const bookIdToTitle = new Map<string, string>();
  for (const b of books) bookIdToTitle.set(b.id, b.title);

  for (const log of logs) {
    const bookTitle = log.book_id ? bookIdToTitle.get(log.book_id) || "" : "";

    // 오늘
    if (log.date === todayStr) {
      todayPages += log.pages_read;
      todayLogCount++;
      if (log.genre) todayGenres.add(log.genre);
      bookPagesByTitle.set(bookTitle, (bookPagesByTitle.get(bookTitle) || 0) + log.pages_read);
    }

    // 이번 주 (월~일)
    if (log.date >= weekStartStr && log.date <= todayStr) {
      weekPages += log.pages_read;
      weekDays.add(log.date);
      if (log.genre) weekGenresSet.add(log.genre);
      weekBookPagesByTitle.set(bookTitle, (weekBookPagesByTitle.get(bookTitle) || 0) + log.pages_read);
    }

    // 이번 달
    if (log.date.startsWith(monthPrefix)) {
      monthPages += log.pages_read;
      monthDays.add(log.date);
      if (log.genre) monthGenresSet.add(log.genre);
    }
  }

  // 이번 주/달 완독 수
  const weekCompleted = books.filter(
    (b) => b.status === "complete" && b.completed_at && b.completed_at.slice(0, 10) >= weekStartStr && b.completed_at.slice(0, 10) <= todayStr
  ).length;

  const monthCompleted = books.filter(
    (b) => b.status === "complete" && b.completed_at && b.completed_at.slice(0, 7) === monthPrefix
  ).length;

  return {
    todayPages,
    todayLogCount,
    todayGenres,
    weekPages,
    weekReadDays: weekDays.size,
    weekGenres: weekGenresSet.size,
    weekCompleted,
    monthPages,
    monthReadDays: monthDays.size,
    monthGenres: monthGenresSet.size,
    monthCompleted,
    streak,
    bookPagesByTitle,
    weekBookPagesByTitle,
  };
}

// 퀘스트 제목에서 책 제목 추출 ("책제목" ... → 책제목)
function extractBookTitle(questTitle: string): string | null {
  const match = questTitle.match(/^"(.+?)"/);
  return match ? match[1] : null;
}

function computeSingleProgress(quest: Quest, ctx: QuestContext): number {
  switch (quest.type) {
    // ── 일일 ──
    case "pages_today":
    case "pages_challenge":
      return ctx.todayPages;
    case "specific_book": {
      const title = extractBookTitle(quest.title);
      return title ? (ctx.bookPagesByTitle.get(title) || 0) : 0;
    }
    case "record_today":
      return ctx.todayLogCount > 0 ? 1 : 0;
    case "memo":
      return 0; // Phase 3
    case "login":
      return 1;
    case "genre_read":
      return ctx.todayGenres.size > 0 ? 1 : 0;

    // ── 주간 ──
    case "weekly_pages":
      return ctx.weekPages;
    case "weekly_complete":
      return ctx.weekCompleted;
    case "weekly_streak":
      return Math.min(ctx.streak, quest.total);
    case "weekly_days":
      return ctx.weekReadDays;
    case "weekly_genre_variety":
      return ctx.weekGenres;
    case "weekly_memo":
      return 0; // Phase 3
    case "weekly_specific": {
      const title = extractBookTitle(quest.title);
      return title ? (ctx.weekBookPagesByTitle.get(title) || 0) : 0;
    }

    // ── 월간 ──
    case "monthly_pages":
      return ctx.monthPages;
    case "monthly_books":
      return ctx.monthCompleted;
    case "monthly_days":
      return ctx.monthReadDays;
    case "monthly_streak":
      return Math.min(ctx.streak, quest.total);
    case "monthly_genre":
      return ctx.monthGenres;
    case "monthly_new_genre":
      return ctx.monthGenres > 0 ? 1 : 0;
    case "monthly_specific_complete": {
      const title = extractBookTitle(quest.title);
      if (!title) return 0;
      // 해당 책이 완독 상태인지 확인 (books array 접근 불가하므로 ctx에서 처리)
      return 0; // 완독 여부는 아래 applyProgress에서 books로 처리
    }

    default:
      return 0;
  }
}

export function applyQuestProgress(
  quests: QuestSet,
  logs: ReadingLog[],
  books: Book[],
  streak: number,
): QuestSet {
  const ctx = buildQuestContext(logs, books, streak);

  function applyToList(list: Quest[]): Quest[] {
    return list.map((q) => {
      let progress: number;
      if (q.type === "monthly_specific_complete") {
        const title = extractBookTitle(q.title);
        progress = title && books.some((b) => b.title === title && b.status === "complete") ? 1 : 0;
      } else {
        progress = computeSingleProgress(q, ctx);
      }
      progress = Math.min(progress, q.total);
      return { ...q, progress, completed: progress >= q.total };
    });
  }

  return {
    daily: applyToList(quests.daily),
    weekly: applyToList(quests.weekly),
    monthly: applyToList(quests.monthly),
  };
}
