import { useState, useMemo, useCallback } from "react";

/* ============ CONSTANTS ============ */
const TABS = [
  { id: "library", icon: "📖", label: "서재" },
  { id: "character", icon: "⚔️", label: "캐릭터" },
  { id: "shop", icon: "🏪", label: "상점" },
  { id: "achievements", icon: "🏆", label: "업적" },
  { id: "stats", icon: "📊", label: "통계" },
];

const GENRES = [
  { id: "wisdom", label: "비문학", sublabel: "과학/철학/역사/인문", stat: "지혜", color: "#5B8DEF", icon: "📘" },
  { id: "empathy", label: "문학", sublabel: "소설/에세이/시/전기", stat: "공감", color: "#66BB6A", icon: "📗" },
  { id: "insight", label: "자기계발", sublabel: "심리/경영/경제/처세", stat: "통찰", color: "#FFA726", icon: "📙" },
  { id: "creation", label: "기타", sublabel: "예술/판타지/SF/만화", stat: "창조", color: "#EF5350", icon: "📕" },
];

const EQUIPMENT_SLOTS = [
  { id: "helmet", label: "투구", icon: "⛑️" },
  { id: "armor", label: "갑옷", icon: "🛡️" },
  { id: "cloak", label: "망토", icon: "🧣" },
  { id: "weapon", label: "무기", icon: "⚔️" },
  { id: "shield", label: "방패", icon: "🔰" },
  { id: "boots", label: "신발", icon: "👢" },
];

const EQUIPMENT_TIERS = [
  { id: "iron", label: "Iron", color: "#9E9E9E", price: 100, bg: "#F5F5F5", bgDark: "#2a2a2a", desc: "~3일치 독서" },
  { id: "bronze", label: "Bronze", color: "#BC8F5A", price: 350, bg: "#FFF3E0", bgDark: "#2d2518", desc: "~1주치 독서" },
  { id: "silver", label: "Silver", color: "#90A4AE", price: 800, bg: "#ECEFF1", bgDark: "#252a2d", desc: "~2주치 독서" },
  { id: "gold", label: "Gold", color: "#FFB300", price: 2000, bg: "#FFF8E1", bgDark: "#2d2a18", desc: "~1개월치 독서" },
  { id: "platinum", label: "Platinum", color: "#29B6F6", price: 5000, bg: "#E1F5FE", bgDark: "#182530", desc: "~2.5개월치 독서" },
  { id: "master", label: "Master", color: "#AB47BC", price: 12000, bg: "#F3E5F5", bgDark: "#281830", desc: "~6개월치 독서" },
  { id: "challenger", label: "Challenger", color: "#EF5350", price: 30000, bg: "#FFEBEE", bgDark: "#301818", desc: "~1년 이상" },
];

/* ============ BALANCED LEVEL SYSTEM ============ */
// EXP curve: each level requires more EXP. Total cumulative EXP to reach each level.
// Based on ~40p/day average reader reaching Lv10 in ~1 month, Lv25 in ~9 months
function getExpForLevel(level) {
  if (level <= 1) return 0;
  // Smooth exponential curve: sum of (30 * level^1.4) for each level
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += Math.round(30 * Math.pow(i, 1.4));
  }
  return total;
}
function getExpToNextLevel(level) {
  return Math.round(30 * Math.pow(level + 1, 1.4));
}

/* ============ JOB (TITLE) SYSTEM ============ */
// Jobs are titles earned by meeting specific criteria. Users can select which to display.
const ALL_JOBS = [
  // Tier 0: Starting
  { id: "apprentice", name: "견습 모험가", icon: "🌱", tier: 0, color: "#9E9E9E",
    condition: "시작 시 자동 획득", requirement: () => true },
  
  // Tier 1: Basic (Lv5+ and stat conditions, ~1-2 weeks)
  { id: "bookworm", name: "책벌레", icon: "📖", tier: 1, color: "#8D6E63",
    condition: "Lv.5 달성", reqLevel: 5, requirement: (s) => s.level >= 5 },
  { id: "curious", name: "호기심 탐험가", icon: "🔍", tier: 1, color: "#78909C",
    condition: "2가지 장르 읽기", requirement: (s) => s.genresRead >= 2 },

  // Tier 2: 1차 전직 (Lv10+, ~1 month) - stat-based
  { id: "sage", name: "현자", icon: "🧙", tier: 2, color: "#5B8DEF",
    condition: "Lv.10 + 지혜 스탯 1위 (15 이상)", reqLevel: 10,
    requirement: (s) => s.level >= 10 && s.wisdom >= 15 && s.wisdom >= s.empathy && s.wisdom >= s.insight && s.wisdom >= s.creation },
  { id: "bard", name: "음유시인", icon: "🎵", tier: 2, color: "#66BB6A",
    condition: "Lv.10 + 공감 스탯 1위 (15 이상)", reqLevel: 10,
    requirement: (s) => s.level >= 10 && s.empathy >= 15 && s.empathy >= s.wisdom && s.empathy >= s.insight && s.empathy >= s.creation },
  { id: "knight", name: "전략기사", icon: "⚔️", tier: 2, color: "#FFA726",
    condition: "Lv.10 + 통찰 스탯 1위 (15 이상)", reqLevel: 10,
    requirement: (s) => s.level >= 10 && s.insight >= 15 && s.insight >= s.wisdom && s.insight >= s.empathy && s.insight >= s.creation },
  { id: "mage", name: "마법사", icon: "🔮", tier: 2, color: "#EF5350",
    condition: "Lv.10 + 창조 스탯 1위 (15 이상)", reqLevel: 10,
    requirement: (s) => s.level >= 10 && s.creation >= 15 && s.creation >= s.wisdom && s.creation >= s.empathy && s.creation >= s.insight },

  // Tier 2 special: achievement-based
  { id: "iron_will", name: "강철 의지", icon: "💎", tier: 2, color: "#607D8B",
    condition: "30일 연속 독서", requirement: (s) => s.streak >= 30 },
  { id: "speed_reader", name: "속독의 달인", icon: "⚡", tier: 2, color: "#FF7043",
    condition: "한 달에 1,500p 이상 읽기", requirement: (s) => s.monthlyPages >= 1500 },

  // Tier 3: 2차 전직 순수형 (Lv20+, ~6-9 months)
  { id: "arch_scholar", name: "대현자", icon: "📖", tier: 3, color: "#1565C0",
    condition: "Lv.20 + 지혜 40 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.wisdom >= 40 },
  { id: "legendary_bard", name: "전설의 이야기꾼", icon: "🎭", tier: 3, color: "#2E7D32",
    condition: "Lv.20 + 공감 40 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.empathy >= 40 },
  { id: "paladin", name: "성기사", icon: "🛡️", tier: 3, color: "#E65100",
    condition: "Lv.20 + 통찰 40 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.insight >= 40 },
  { id: "grand_sorcerer", name: "대마법사", icon: "⚡", tier: 3, color: "#C62828",
    condition: "Lv.20 + 창조 40 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.creation >= 40 },
  
  // Tier 3: 2차 전직 하이브리드형 (Lv20+, two stats ≥ 30)
  { id: "rune_translator", name: "룬 해독사", icon: "📜", tier: 3, color: "#00838F",
    condition: "Lv.20 + 지혜·공감 모두 30 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.wisdom >= 30 && s.empathy >= 30 },
  { id: "royal_advisor", name: "왕실 고문관", icon: "🏛️", tier: 3, color: "#4527A0",
    condition: "Lv.20 + 지혜·통찰 모두 30 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.wisdom >= 30 && s.insight >= 30 },
  { id: "dimension_weaver", name: "차원술사", icon: "🌌", tier: 3, color: "#6A1B9A",
    condition: "Lv.20 + 지혜·창조 모두 30 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.wisdom >= 30 && s.creation >= 30 },
  { id: "soul_healer", name: "영혼치유사", icon: "💫", tier: 3, color: "#AB47BC",
    condition: "Lv.20 + 공감·통찰 모두 30 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.empathy >= 30 && s.insight >= 30 },
  { id: "beast_summoner", name: "환수소환사", icon: "🐉", tier: 3, color: "#D84315",
    condition: "Lv.20 + 공감·창조 모두 30 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.empathy >= 30 && s.creation >= 30 },
  { id: "arcane_engineer", name: "마법공학사", icon: "⚗️", tier: 3, color: "#00695C",
    condition: "Lv.20 + 통찰·창조 모두 30 이상", reqLevel: 20,
    requirement: (s) => s.level >= 20 && s.insight >= 30 && s.creation >= 30 },

  // Tier 3 special
  { id: "completionist", name: "완독의 제왕", icon: "👑", tier: 3, color: "#FFB300",
    condition: "20권 이상 완독", requirement: (s) => s.totalBooksCompleted >= 20 },
  { id: "genre_master", name: "만물박사", icon: "🌈", tier: 3, color: "#00BCD4",
    condition: "모든 장르에서 스탯 20 이상", requirement: (s) => s.wisdom >= 20 && s.empathy >= 20 && s.insight >= 20 && s.creation >= 20 },
];

const ACHIEVEMENTS = [
  // 시작 & 기본
  { id: "first_book", title: "첫 발걸음", desc: "첫 번째 책 등록", reward: "+50 Gold", icon: "🌱", done: true },
  { id: "first_record", title: "기록의 시작", desc: "첫 독서 기록 남기기", reward: "칭호: 신입 모험가", icon: "✏️", done: true },
  { id: "first_complete", title: "완독의 기쁨", desc: "첫 번째 책 완독", reward: "Iron 무기", icon: "📕", done: true },
  { id: "login_3", title: "습관 만들기", desc: "3일 연속 앱 접속", reward: "+30 Gold", icon: "📱", done: true },
  
  // 연속 독서
  { id: "streak_7", title: "꾸준함의 시작", desc: "7일 연속 독서", reward: "+100 Gold", icon: "🔥", done: true },
  { id: "streak_14", title: "2주의 열정", desc: "14일 연속 독서", reward: "+200 Gold", icon: "🔥", done: false, progress: 12, total: 14 },
  { id: "streak_30", title: "강철 의지", desc: "30일 연속 독서", reward: "칭호: 강철 의지", icon: "💎", done: false, progress: 12, total: 30 },
  { id: "streak_100", title: "전설의 독서가", desc: "100일 연속 독서", reward: "칭호: 전설의 독서가 + 500G", icon: "🏆", done: false, progress: 12, total: 100 },

  // 완독 수
  { id: "books_3", title: "세 권의 이야기", desc: "3권 완독", reward: "+100 Gold", icon: "📚", done: true },
  { id: "books_5", title: "다섯 고개 넘기", desc: "5권 완독", reward: "Bronze 방패", icon: "📚", done: true },
  { id: "books_10", title: "다독가", desc: "10권 완독", reward: "Silver 망토", icon: "📚", done: false, progress: 6, total: 10 },
  { id: "books_20", title: "서재의 주인", desc: "20권 완독", reward: "칭호: 완독의 제왕", icon: "📚", done: false, progress: 6, total: 20 },
  { id: "books_50", title: "살아있는 도서관", desc: "50권 완독", reward: "Gold 갑옷 + 1000G", icon: "📚", done: false, progress: 6, total: 50 },

  // 페이지 누적
  { id: "pages_500", title: "첫 번째 이정표", desc: "누적 500p 읽기", reward: "+50 Gold", icon: "📄", done: true },
  { id: "pages_1000", title: "천 페이지의 벽", desc: "누적 1,000p 읽기", reward: "캐릭터 외양 변화", icon: "⭐", done: false, progress: 680, total: 1000 },
  { id: "pages_5000", title: "만 페이지 돌파", desc: "누적 5,000p 읽기", reward: "칭호: 만권의 지혜", icon: "⭐", done: false, progress: 680, total: 5000 },
  { id: "pages_10000", title: "독서 마라톤", desc: "누적 10,000p 읽기", reward: "Platinum 투구 + 2000G", icon: "👑", done: false, progress: 680, total: 10000 },

  // 장르 탐험
  { id: "genre_2", title: "두 세계의 여행자", desc: "2가지 장르 읽기", reward: "+50 Gold", icon: "🌍", done: true },
  { id: "genre_all", title: "장르 탐험가", desc: "4개 장르 모두 읽기", reward: "칭호: 만물박사", icon: "🌈", done: false, progress: 3, total: 4 },
  { id: "genre_deep", title: "장르의 달인", desc: "한 장르에서 스탯 30 달성", reward: "Master 무기", icon: "🎯", done: false, progress: 24, total: 30 },

  // 특별
  { id: "first_equip", title: "무장 완료", desc: "첫 장비 구매", reward: "+30 Gold", icon: "🛡️", done: true },
  { id: "full_iron", title: "철의 기사", desc: "전 부위 Iron 장비 장착", reward: "+100 Gold", icon: "⚔️", done: true },
  { id: "full_set", title: "풀셋 달성", desc: "전 부위 같은 등급 장착 (Bronze 이상)", reward: "+300 Gold", icon: "✨", done: false, progress: 4, total: 6 },
  { id: "level_5", title: "모험의 시작", desc: "Lv.5 달성", reward: "칭호: 책벌레", icon: "⬆️", done: true },
  { id: "level_10", title: "견습 졸업", desc: "Lv.10 달성", reward: "1차 직업 칭호 해금", icon: "⬆️", done: true },
  { id: "level_20", title: "베테랑 독서가", desc: "Lv.20 달성", reward: "2차 직업 칭호 해금", icon: "⬆️", done: false, progress: 12, total: 20 },
  { id: "memo_10", title: "기록광", desc: "독서 메모 10개 작성", reward: "+150 Gold", icon: "📝", done: false, progress: 4, total: 10 },
  { id: "weekend_warrior", title: "주말 독서가", desc: "주말에 100p 이상 읽기", reward: "+80 Gold", icon: "🏖️", done: false, progress: 60, total: 100 },
];

/* ============ QUEST GENERATION SYSTEM ============ */
// Simulated user stats for quest generation context
const USER_STATS = {
  avgDailyPages: 30,    // 최근 7일 평균 일일 독서량
  avgWeeklyPages: 210,  // 최근 4주 평균 주간 독서량
  avgMonthlyPages: 840, // 최근 3개월 평균 월간 독서량
  avgDailyBooks: 0.05,  // 일간 평균 완독 권수 (approx)
  avgWeeklyBooks: 0.3,
  avgMonthlyBooks: 1.2,
  streak: 12,
  totalBooksRead: 3,
};

// Seeded pseudo-random for deterministic daily/weekly/monthly quests
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function generateQuests(books, userStats) {
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const weekSeed = daySeed + Math.floor(today.getDate() / 7) * 1000;
  const monthSeed = today.getFullYear() * 100 + today.getMonth() + 1;

  const readingBooks = books.filter(b => b.status === "reading");
  const rng = (seed) => seededRandom(seed);

  // ---- QUEST TEMPLATE POOLS ----
  const dailyPool = [
    // Page-based
    (r, stats) => {
      const target = Math.round(stats.avgDailyPages * (1 + 0.1));
      return { title: `오늘 ${target}페이지 읽기`, reward: 20, total: target, type: "pages_today", icon: "📖" };
    },
    (r, stats) => ({ title: `오늘 ${Math.max(15, Math.round(stats.avgDailyPages * 0.5))}페이지 이상 읽기`, reward: 15, total: Math.max(15, Math.round(stats.avgDailyPages * 0.5)), type: "pages_today", icon: "📖" }),
    // Specific book
    (r, stats, reading) => {
      if (reading.length === 0) return null;
      const book = reading[Math.floor(r() * reading.length)];
      const target = Math.min(book.readPages + 20, book.totalPages);
      return { title: `"${book.title}" ${target}p까지 읽기`, reward: 25, total: target - book.readPages, type: "specific_book", icon: "🎯", bookId: book.id };
    },
    // Streak
    (r, stats) => ({ title: "오늘도 독서 기록 남기기", reward: 15, total: 1, type: "record_today", icon: "🔥" }),
    // Memo
    (r, stats) => ({ title: "독서 메모 1개 작성", reward: 20, total: 1, type: "memo", icon: "✏️" }),
    // App open
    (r, stats) => ({ title: "앱 접속하기", reward: 10, total: 1, type: "login", icon: "👋" }),
    // Genre-specific
    (r, stats) => {
      const genres = ["과학/철학", "소설/에세이", "자기계발", "판타지/SF"];
      const genre = genres[Math.floor(r() * genres.length)];
      return { title: `${genre} 장르 책 읽기`, reward: 20, total: 1, type: "genre_read", icon: "📚" };
    },
    // 10% challenge
    (r, stats) => {
      const target = Math.round(stats.avgDailyPages * 1.1);
      return { title: `도전! ${target}p 읽기 (평균+10%)`, reward: 30, total: target, type: "pages_challenge", icon: "⚡" };
    },
  ];

  const weeklyPool = [
    // Total pages (10% increase)
    (r, stats) => {
      const target = Math.round(stats.avgWeeklyPages * 1.1);
      return { title: `이번 주 ${target}p 읽기 (평균+10%)`, reward: 100, total: target, type: "weekly_pages", icon: "📊" };
    },
    (r, stats) => ({ title: `이번 주 ${stats.avgWeeklyPages}p 이상 읽기`, reward: 80, total: stats.avgWeeklyPages, type: "weekly_pages", icon: "📖" }),
    // Complete a book
    (r, stats) => ({ title: "이번 주 1권 완독하기", reward: 120, total: 1, type: "weekly_complete", icon: "🏆" }),
    // Reading streak
    (r, stats) => ({ title: "7일 연속 독서하기", reward: 100, total: 7, type: "weekly_streak", icon: "🔥" }),
    (r, stats) => ({ title: "5일 이상 독서하기", reward: 60, total: 5, type: "weekly_days", icon: "📅" }),
    // Genre variety
    (r, stats) => ({ title: "2가지 이상 장르 읽기", reward: 80, total: 2, type: "weekly_genre_variety", icon: "🌈" }),
    // Specific book progress
    (r, stats, reading) => {
      if (reading.length === 0) return null;
      const book = reading[Math.floor(r() * reading.length)];
      const remaining = book.totalPages - book.readPages;
      const target = Math.min(Math.round(remaining * 0.5), 150);
      return { title: `"${book.title}" ${target}p 더 읽기`, reward: 90, total: target, type: "weekly_specific", icon: "🎯", bookId: book.id };
    },
    // Memo challenge
    (r, stats) => ({ title: "독서 메모 3개 작성하기", reward: 70, total: 3, type: "weekly_memo", icon: "✏️" }),
  ];

  const monthlyPool = [
    // Total pages (10% increase)
    (r, stats) => {
      const target = Math.round(stats.avgMonthlyPages * 1.1);
      return { title: `이번 달 ${target}p 읽기 (평균+10%)`, reward: 500, total: target, type: "monthly_pages", icon: "📊" };
    },
    // Book count
    (r, stats) => {
      const target = Math.max(1, Math.round(stats.avgMonthlyBooks * 1.1));
      return { title: `이번 달 ${target}권 완독하기`, reward: 400, total: target, type: "monthly_books", icon: "📚" };
    },
    (r, stats) => ({ title: "이번 달 2권 이상 완독하기", reward: 350, total: 2, type: "monthly_books", icon: "🏆" }),
    // Streak
    (r, stats) => ({ title: "20일 이상 독서하기", reward: 400, total: 20, type: "monthly_days", icon: "🔥" }),
    (r, stats) => ({ title: "15일 연속 독서 달성", reward: 500, total: 15, type: "monthly_streak", icon: "💎" }),
    // Genre
    (r, stats) => ({ title: "3가지 이상 장르 읽기", reward: 300, total: 3, type: "monthly_genre", icon: "🌈" }),
    (r, stats) => ({ title: "새로운 장르 도전하기", reward: 250, total: 1, type: "monthly_new_genre", icon: "🌟" }),
    // Page milestones
    (r, stats) => ({ title: "누적 1,500p 달성하기", reward: 600, total: 1500, type: "monthly_cumulative", icon: "⭐" }),
    // Specific book complete
    (r, stats, reading) => {
      if (reading.length === 0) return null;
      const book = reading[Math.floor(r() * reading.length)];
      return { title: `"${book.title}" 완독하기`, reward: 350, total: 1, type: "monthly_specific_complete", icon: "🎯", bookId: book.id };
    },
  ];

  function pickQuests(pool, count, seed, stats, reading) {
    const r = rng(seed);
    const shuffled = [...pool].sort(() => r() - 0.5);
    const result = [];
    for (const gen of shuffled) {
      if (result.length >= count) break;
      const q = gen(r, stats, reading);
      if (q) result.push({ ...q, id: `q_${seed}_${result.length}` });
    }
    return result;
  }

  // Generate quests with simulated progress
  const daily = pickQuests(dailyPool, 3, daySeed, userStats, readingBooks).map((q, i) => {
    // Simulate varied progress states
    const progressStates = [
      { progress: Math.round(q.total * 0.6), done: false },
      { progress: q.total, done: true },
      { progress: q.total, done: true },
    ];
    return { ...q, ...progressStates[i % 3] };
  });

  const weekly = pickQuests(weeklyPool, 3, weekSeed, userStats, readingBooks).map((q, i) => {
    const progressStates = [
      { progress: Math.round(q.total * 0.4), done: false },
      { progress: Math.round(q.total * 0.75), done: false },
      { progress: q.total, done: true },
    ];
    return { ...q, ...progressStates[i % 3] };
  });

  const monthly = pickQuests(monthlyPool, 3, monthSeed, userStats, readingBooks).map((q, i) => {
    const progressStates = [
      { progress: Math.round(q.total * 0.3), done: false },
      { progress: Math.round(q.total * 0.55), done: false },
      { progress: Math.round(q.total * 0.15), done: false },
    ];
    return { ...q, ...progressStates[i % 3] };
  });

  return { daily, weekly, monthly };
}

const INITIAL_BOOKS = [
  { id: 1, title: "데미안", author: "헤르만 헤세", genre: "empathy", totalPages: 280, readPages: 190, status: "reading", cover: "📗", completedMonth: null },
  { id: 2, title: "사피엔스", author: "유발 하라리", genre: "wisdom", totalPages: 636, readPages: 636, status: "complete", cover: "📘", completedMonth: "2026-01" },
  { id: 3, title: "해리포터와 마법사의 돌", author: "J.K. 롤링", genre: "creation", totalPages: 320, readPages: 0, status: "wishlist", cover: "📕", completedMonth: null },
  { id: 4, title: "아토믹 해빗", author: "제임스 클리어", genre: "insight", totalPages: 328, readPages: 328, status: "complete", cover: "📙", completedMonth: "2026-02" },
  { id: 5, title: "1984", author: "조지 오웰", genre: "empathy", totalPages: 368, readPages: 120, status: "reading", cover: "📗", completedMonth: null },
  { id: 6, title: "코스모스", author: "칼 세이건", genre: "wisdom", totalPages: 520, readPages: 520, status: "complete", cover: "📘", completedMonth: "2026-03" },
];

const WEEKLY_PAGES = [28, 45, 32, 0, 55, 40, 18];
const DAYS_LABEL = ["월", "화", "수", "목", "금", "토", "일"];

/* ============ THEME ============ */
const themes = {
  light: {
    bg: "#F7F8FC", surface: "#FFFFFF", surfaceAlt: "#FAFAFA",
    text: "#333333", textSub: "#888888", textMuted: "#BBBBBB",
    border: "#F0F0F0", borderStrong: "#E0E0E0",
    cardShadow: "0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    inputBg: "#FFFFFF", inputBorder: "#E0E0E0",
    scrollThumb: "#DDD",
    questBg: "linear-gradient(135deg, #FFF8E1, #FFFDE7)", questBorder: "#FFE082",
    readingBg: "linear-gradient(135deg, #E8F5E9, #F1F8E9)", readingBorder: "#C8E6C9",
    charBg: "linear-gradient(180deg, #E8EAF6 0%, #F5F5FF 50%, #FFFFFF 100%)", charBorder: "#C5CAE9",
    goldBg: "linear-gradient(135deg, #FFF8E1, #FFFDE7)", goldBorder: "#FFE082",
    jobBg: "linear-gradient(135deg, #FFF8E1, #FFFDE7)", jobBorder: "#FFE082",
    chipBg: "#F5F5F5", chipActive: "#5B8DEF",
    completedBg: "#FAFAFA", completedBorder: "#F0F0F0", completedOpacity: 0.55,
    barBg: "#F0F0F0", barTrack: "#F5F5F5",
    statCardBgs: ["#E3F2FD", "#E8F5E9", "#FFEBEE", "#FFF8E1"],
    achieveDoneBg: "linear-gradient(135deg, #E8F5E9, #F1F8E9)", achieveDoneBorder: "#C8E6C9",
    monthActiveBg: "#E3F2FD", monthActiveBorder: "#5B8DEF",
    streakRead: "#66BB6A", streakEmpty: "#F0F0F0",
    hintBg: "#FFF3E0", hintBorder: "#FFE0B2", hintText: "#E65100",
    headerBg: "#FFFFFF", headerShadow: "0 1px 3px rgba(0,0,0,0.03)",
    tabBg: "#FFFFFF", tabShadow: "0 -2px 8px rgba(0,0,0,0.04)",
    modalOverlay: "rgba(0,0,0,0.3)",
  },
  dark: {
    bg: "#0F1117", surface: "#1A1D27", surfaceAlt: "#22252F",
    text: "#E8E8E8", textSub: "#8888AA", textMuted: "#555566",
    border: "#2A2D3A", borderStrong: "#3A3D4A",
    cardShadow: "0 1px 4px rgba(0,0,0,0.3)",
    inputBg: "#22252F", inputBorder: "#3A3D4A",
    scrollThumb: "#3A3D4A",
    questBg: "linear-gradient(135deg, #2A2518, #252218)", questBorder: "#4A3D18",
    readingBg: "linear-gradient(135deg, #1A2A1A, #1A251A)", readingBorder: "#2A4A2A",
    charBg: "linear-gradient(180deg, #1A1D30 0%, #151825 50%, #1A1D27 100%)", charBorder: "#2A2D4A",
    goldBg: "linear-gradient(135deg, #2A2518, #252218)", goldBorder: "#4A3D18",
    jobBg: "linear-gradient(135deg, #2A2518, #252218)", jobBorder: "#4A3D18",
    chipBg: "#22252F", chipActive: "#5B8DEF",
    completedBg: "#15171F", completedBorder: "#22252F", completedOpacity: 0.4,
    barBg: "#22252F", barTrack: "#2A2D3A",
    statCardBgs: ["#151D2A", "#152015", "#201515", "#201D15"],
    achieveDoneBg: "linear-gradient(135deg, #152015, #152515)", achieveDoneBorder: "#2A4A2A",
    monthActiveBg: "#151D2A", monthActiveBorder: "#5B8DEF",
    streakRead: "#4CAF50", streakEmpty: "#22252F",
    hintBg: "#2A2015", hintBorder: "#4A3520", hintText: "#FFB74D",
    headerBg: "#1A1D27", headerShadow: "0 1px 3px rgba(0,0,0,0.4)",
    tabBg: "#1A1D27", tabShadow: "0 -2px 8px rgba(0,0,0,0.4)",
    modalOverlay: "rgba(0,0,0,0.6)",
  }
};

/* ============ THEME CONTEXT ============ */
function useTheme(dark) {
  return dark ? themes.dark : themes.light;
}

/* ============ CUTE PIXEL CHARACTER ============ */
function CutePixelCharacter({ equipment }) {
  const tierColors = {};
  EQUIPMENT_TIERS.forEach(t => { tierColors[t.id] = t.color; });
  const helmetColor = equipment.helmet ? tierColors[equipment.helmet] : "#C5CAE9";
  const armorColor = equipment.armor ? tierColors[equipment.armor] : "#7986CB";
  const cloakColor = equipment.cloak ? tierColors[equipment.cloak] : null;
  const weaponColor = equipment.weapon ? tierColors[equipment.weapon] : null;
  const shieldColor = equipment.shield ? tierColors[equipment.shield] : null;
  const bootsColor = equipment.boots ? tierColors[equipment.boots] : "#8D6E63";

  return (
    <svg width={144} height={162} viewBox="0 0 32 36" style={{ imageRendering: "pixelated" }}>
      <ellipse cx="16" cy="34" rx="7" ry="2" fill="#00000015" />
      {cloakColor && (
        <>
          <rect x="5" y="15" width="3" height="10" fill={cloakColor} />
          <rect x="4" y="17" width="2" height="7" fill={cloakColor} opacity="0.7" />
          <rect x="24" y="15" width="3" height="10" fill={cloakColor} />
          <rect x="26" y="17" width="2" height="7" fill={cloakColor} opacity="0.7" />
          <rect x="4" y="24" width="3" height="2" fill={cloakColor} opacity="0.5" />
          <rect x="25" y="24" width="3" height="2" fill={cloakColor} opacity="0.5" />
        </>
      )}
      <rect x="10" y="2" width="12" height="3" fill={helmetColor} />
      <rect x="9" y="4" width="14" height="3" fill={helmetColor} />
      <rect x="8" y="6" width="16" height="1" fill={helmetColor} />
      <rect x="14" y="3" width="4" height="2" fill="#FF8A80" />
      <rect x="15" y="3" width="2" height="1" fill="#FFCDD2" />
      <rect x="8" y="6" width="2" height="2" fill="#FFB74D" />
      <rect x="22" y="6" width="2" height="2" fill="#FFB74D" />
      <rect x="9" y="7" width="14" height="9" fill="#FFCC80" />
      <rect x="8" y="8" width="16" height="7" fill="#FFCC80" />
      <rect x="11" y="10" width="3" height="3" fill="#37474F" />
      <rect x="18" y="10" width="3" height="3" fill="#37474F" />
      <rect x="11" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="18" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="13" y="12" width="1" height="1" fill="#BBDEFB" />
      <rect x="20" y="12" width="1" height="1" fill="#BBDEFB" />
      <rect x="9" y="13" width="2" height="1" fill="#FF8A80" opacity="0.5" />
      <rect x="21" y="13" width="2" height="1" fill="#FF8A80" opacity="0.5" />
      <rect x="14" y="14" width="1" height="1" fill="#E65100" />
      <rect x="17" y="14" width="1" height="1" fill="#E65100" />
      <rect x="15" y="15" width="2" height="1" fill="#E65100" />
      <rect x="9" y="16" width="14" height="9" fill={armorColor} />
      <rect x="8" y="17" width="16" height="7" fill={armorColor} />
      <rect x="13" y="17" width="6" height="1" fill="#FFFFFF" opacity="0.25" />
      <rect x="14" y="19" width="4" height="3" fill="#FFFFFF" opacity="0.1" />
      <rect x="9" y="23" width="14" height="2" fill="#5D4037" />
      <rect x="15" y="23" width="2" height="2" fill="#FFD54F" />
      <rect x="6" y="17" width="3" height="7" fill="#FFCC80" />
      <rect x="23" y="17" width="3" height="7" fill="#FFCC80" />
      <rect x="6" y="23" width="3" height="2" fill="#FFCC80" />
      <rect x="23" y="23" width="3" height="2" fill="#FFCC80" />
      {weaponColor && (
        <>
          <rect x="26" y="12" width="2" height="14" fill={weaponColor} />
          <rect x="24" y="10" width="6" height="3" fill={weaponColor} />
          <rect x="26" y="9" width="2" height="1" fill="#FFFFFF" opacity="0.5" />
          <rect x="26" y="11" width="2" height="1" fill="#E1F5FE" />
        </>
      )}
      {shieldColor && (
        <>
          <rect x="2" y="17" width="5" height="7" fill={shieldColor} />
          <rect x="3" y="16" width="3" height="9" fill={shieldColor} />
          <rect x="4" y="20" width="1" height="1" fill="#FFFFFF" opacity="0.4" />
        </>
      )}
      <rect x="10" y="25" width="4" height="5" fill="#5C6BC0" />
      <rect x="18" y="25" width="4" height="5" fill="#5C6BC0" />
      <rect x="9" y="30" width="5" height="3" fill={bootsColor} />
      <rect x="18" y="30" width="5" height="3" fill={bootsColor} />
      <rect x="8" y="32" width="6" height="1" fill={bootsColor} />
      <rect x="18" y="32" width="6" height="1" fill={bootsColor} />
      <rect x="10" y="30" width="2" height="1" fill="#FFFFFF" opacity="0.2" />
      <rect x="19" y="30" width="2" height="1" fill="#FFFFFF" opacity="0.2" />
    </svg>
  );
}

/* ============ STAT RADAR ============ */
function StatRadar({ stats, t }) {
  const labels = ["지혜", "공감", "통찰", "창조"];
  const colors = ["#5B8DEF", "#66BB6A", "#FFA726", "#EF5350"];
  const emojis = ["📘", "📗", "📙", "📕"];
  const maxStat = 30;
  const cx = 85, cy = 85, r = 62;
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / labels.length - Math.PI / 2);
  const values = [stats.wisdom, stats.empathy, stats.insight, stats.creation];
  const points = angles.map((a, i) => {
    const val = Math.min(values[i] / maxStat, 1);
    return `${cx + Math.cos(a) * r * val},${cy + Math.sin(a) * r * val}`;
  }).join(" ");

  return (
    <svg width="170" height="170" viewBox="0 0 170 170">
      {[0.25, 0.5, 0.75, 1].map((scale, si) => (
        <polygon key={si} points={angles.map(a => `${cx + Math.cos(a) * r * scale},${cy + Math.sin(a) * r * scale}`).join(" ")} fill="none" stroke={t.borderStrong} strokeWidth="0.8" />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke={t.borderStrong} strokeWidth="0.8" />
      ))}
      <polygon points={points} fill="rgba(91,141,239,0.15)" stroke="#5B8DEF" strokeWidth="2" />
      {angles.map((a, i) => {
        const val = Math.min(values[i] / maxStat, 1);
        return (
          <g key={i}>
            <circle cx={cx + Math.cos(a) * r * val} cy={cy + Math.sin(a) * r * val} r="5" fill={colors[i]} stroke={t.surface} strokeWidth="2" />
            <text x={cx + Math.cos(a) * (r + 20)} y={cy + Math.sin(a) * (r + 20)} textAnchor="middle" dominantBaseline="middle" fill={t.textSub} fontSize="11" fontWeight="600">
              {emojis[i]} {values[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============ SHARED COMPONENTS ============ */
function ProgressBar({ value, max, color = "#5B8DEF", height = 10, showText = true, label = "", t }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: "100%" }}>
      {label && <div style={{ fontSize: 11, color: t.textSub, marginBottom: 3, fontWeight: 500 }}>{label}</div>}
      <div style={{ width: "100%", height, background: t.barBg, borderRadius: height / 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}DD)`, borderRadius: height / 2, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
      {showText && <div style={{ fontSize: 10, color: t.textMuted, marginTop: 3 }}>{value.toLocaleString()} / {max.toLocaleString()}</div>}
    </div>
  );
}

function Card({ children, style = {}, onClick = null, t }) {
  return (
    <div onClick={onClick} style={{
      background: t.surface, borderRadius: 14, padding: 16,
      boxShadow: t.cardShadow, border: `1px solid ${t.border}`,
      transition: "all 0.2s", cursor: onClick ? "pointer" : "default",
      ...style
    }}>{children}</div>
  );
}

/* ============ QUEST PANEL COMPONENT ============ */
function QuestPanel({ t, books }) {
  const [questTab, setQuestTab] = useState("daily");
  const quests = useMemo(() => generateQuests(books, USER_STATS), [books]);

  const tabConfig = [
    { id: "daily", label: "일일", icon: "⚡", color: "#F57F17", resetLabel: "매일 자정 갱신" },
    { id: "weekly", label: "주간", icon: "📅", color: "#5B8DEF", resetLabel: "매주 월요일 갱신" },
    { id: "monthly", label: "월간", icon: "🏰", color: "#AB47BC", resetLabel: "매월 1일 갱신" },
  ];

  const currentQuests = quests[questTab];
  const currentTab = tabConfig.find(tc => tc.id === questTab);
  const totalReward = currentQuests.reduce((sum, q) => sum + q.reward, 0);
  const earnedReward = currentQuests.filter(q => q.done).reduce((sum, q) => sum + q.reward, 0);
  const doneCount = currentQuests.filter(q => q.done).length;

  return (
    <Card t={t} style={{ background: t.questBg, border: `1px solid ${t.questBorder}`, padding: 14 }}>
      {/* Quest tab selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {tabConfig.map(tc => (
          <button key={tc.id} onClick={() => setQuestTab(tc.id)} style={{
            flex: 1, padding: "7px 4px", borderRadius: 10, cursor: "pointer", border: "none",
            background: questTab === tc.id ? tc.color : `${tc.color}15`,
            color: questTab === tc.id ? "#FFF" : tc.color,
            fontSize: 12, fontWeight: 700, transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4
          }}>
            {tc.icon} {tc.label}
          </button>
        ))}
      </div>

      {/* Header with progress summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: currentTab.color }}>
          {currentTab.icon} {currentTab.label} 퀘스트
          <span style={{ fontSize: 10, fontWeight: 500, color: t.textMuted, marginLeft: 6 }}>{doneCount}/{currentQuests.length}</span>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#FFB300",
          background: "#FFD54F20", padding: "3px 10px", borderRadius: 10
        }}>
          💰 {earnedReward}/{totalReward}G
        </div>
      </div>

      {/* Quest list */}
      {currentQuests.map((q, i) => {
        const pct = Math.min((q.progress / q.total) * 100, 100);
        return (
          <div key={q.id} style={{
            padding: "10px 0",
            borderBottom: i < currentQuests.length - 1 ? `1px solid ${t.border}` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: q.done ? 0 : 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: q.done ? "#66BB6A" : t.surface,
                  border: q.done ? "none" : `2px solid ${t.borderStrong}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#FFF", flexShrink: 0
                }}>{q.done ? "✓" : q.icon}</div>
                <span style={{
                  fontSize: 13, color: q.done ? t.textMuted : t.text,
                  textDecoration: q.done ? "line-through" : "none",
                  lineHeight: 1.3
                }}>{q.title}</span>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                color: q.done ? t.textMuted : "#FFB300"
              }}>+{q.reward}G</span>
            </div>
            {/* Progress bar for incomplete quests */}
            {!q.done && (
              <div style={{ marginLeft: 30 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: t.barBg, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: `linear-gradient(90deg, ${currentTab.color}, ${currentTab.color}CC)`,
                      borderRadius: 3, transition: "width 0.5s ease"
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: t.textMuted, whiteSpace: "nowrap" }}>
                    {q.progress}/{q.total}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Reset info */}
      <div style={{ marginTop: 8, fontSize: 10, color: t.textMuted, textAlign: "center" }}>
        🔄 {currentTab.resetLabel}
      </div>
    </Card>
  );
}

/* ============ TAB: LIBRARY ============ */
function LibraryTab({ t }) {
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [filter, setFilter] = useState("all");
  const [showAddPage, setShowAddPage] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const [selectedBookId, setSelectedBookId] = useState(1);
  const [toast, setToast] = useState(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", author: "", totalPages: "", genre: "" });

  const selectedBook = books.find(b => b.id === selectedBookId) || books.find(b => b.status === "reading");

  const sortedFiltered = useMemo(() => {
    let list = filter === "all" ? [...books] : books.filter(b => b.status === filter);
    list.sort((a, b) => {
      if (a.status === "complete" && b.status !== "complete") return 1;
      if (a.status !== "complete" && b.status === "complete") return -1;
      return 0;
    });
    return list;
  }, [books, filter]);

  const handleRecordPage = useCallback(() => {
    const targetPage = parseInt(pageInput);
    if (!selectedBook || isNaN(targetPage)) return;
    if (targetPage <= selectedBook.readPages) {
      setToast("⚠️ 현재 읽은 페이지보다 큰 수를 입력해주세요");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    if (targetPage > selectedBook.totalPages) {
      setToast("⚠️ 전체 페이지를 초과할 수 없어요");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const pagesRead = targetPage - selectedBook.readPages;
    const isComplete = targetPage >= selectedBook.totalPages;
    setBooks(prev => prev.map(b => b.id === selectedBook.id ? {
      ...b,
      readPages: targetPage,
      status: isComplete ? "complete" : "reading",
      completedMonth: isComplete ? "2026-03" : b.completedMonth
    } : b));
    setToast(`✨ ${pagesRead}페이지 읽었어요! (+${pagesRead} EXP, +${pagesRead} Gold)${isComplete ? " 🎉 완독!" : ""}`);
    setPageInput("");
    setShowAddPage(false);
    setTimeout(() => setToast(null), 3000);
  }, [pageInput, selectedBook]);

  const filterBtns = [
    { id: "all", label: "전체" },
    { id: "reading", label: "읽는 중" },
    { id: "complete", label: "완독" },
    { id: "wishlist", label: "읽을 책" },
  ];

  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: "#333", color: "#FFF", padding: "10px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.3s ease"
        }}>{toast}</div>
      )}

      {/* Quest Panel - Daily/Weekly/Monthly */}
      <QuestPanel t={t} books={books} />

      {/* Current Reading */}
      {selectedBook && selectedBook.status === "reading" && (
        <Card t={t} style={{ background: t.readingBg, border: `1px solid ${t.readingBorder}` }}>
          <div style={{ fontSize: 12, color: "#66BB6A", fontWeight: 600, marginBottom: 10 }}>📖 현재 읽는 중</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              fontSize: 44, width: 56, height: 56, borderRadius: 12,
              background: t.surface, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: t.cardShadow
            }}>{selectedBook.cover}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{selectedBook.title}</div>
              <div style={{ fontSize: 12, color: t.textSub, marginBottom: 8 }}>{selectedBook.author}</div>
              <ProgressBar t={t} value={selectedBook.readPages} max={selectedBook.totalPages} color="#66BB6A" height={8} />
            </div>
          </div>
          <button onClick={() => setShowAddPage(!showAddPage)} style={{
            marginTop: 12, width: "100%", padding: 11,
            border: `2px solid #66BB6A`,
            background: showAddPage ? "#66BB6A" : t.surface,
            color: showAddPage ? "#FFF" : "#66BB6A",
            borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s"
          }}>
            {showAddPage ? "닫기" : "📝 어디까지 읽었나요?"}
          </button>
          {showAddPage && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: t.textSub, marginBottom: 6 }}>
                현재 <b style={{ color: "#66BB6A" }}>{selectedBook.readPages}p</b>까지 읽음 · 어디까지 읽었는지 입력하세요
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  placeholder={`${selectedBook.readPages + 1} ~ ${selectedBook.totalPages}`}
                  value={pageInput}
                  onChange={e => setPageInput(e.target.value)}
                  style={{
                    flex: 1, padding: 10, background: t.inputBg, border: `2px solid ${t.inputBorder}`,
                    color: t.text, borderRadius: 10, fontSize: 14, outline: "none"
                  }}
                />
                <span style={{ fontSize: 13, color: t.textSub, fontWeight: 600 }}>p까지</span>
                <button onClick={handleRecordPage} style={{
                  padding: "10px 18px", background: "#66BB6A", color: "#FFF", border: "none",
                  borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13
                }}>기록!</button>
              </div>
              {pageInput && !isNaN(parseInt(pageInput)) && parseInt(pageInput) > selectedBook.readPages && (
                <div style={{
                  marginTop: 8, padding: "8px 12px", background: t.hintBg,
                  borderRadius: 8, border: `1px solid ${t.hintBorder}`,
                  fontSize: 12, color: t.hintText
                }}>
                  📊 {selectedBook.readPages + 1}p → {Math.min(parseInt(pageInput), selectedBook.totalPages)}p = <b>{Math.min(parseInt(pageInput), selectedBook.totalPages) - selectedBook.readPages}페이지</b> 읽게 됩니다
                  {parseInt(pageInput) >= selectedBook.totalPages && " 🎉 완독!"}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: 6 }}>
        {filterBtns.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "7px 14px", borderRadius: 20, cursor: "pointer",
            background: filter === f.id ? t.chipActive : t.chipBg,
            color: filter === f.id ? "#FFF" : t.textSub,
            border: "none", fontSize: 12, fontWeight: 600, transition: "all 0.2s"
          }}>{f.label}</button>
        ))}
      </div>

      {/* Book List - completed sorted to bottom + grayed */}
      {sortedFiltered.map(book => {
        const isComplete = book.status === "complete";
        return (
          <Card key={book.id} t={t}
            onClick={() => book.status === "reading" ? setSelectedBookId(book.id) : null}
            style={{
              padding: 12,
              opacity: isComplete ? t.completedOpacity : 1,
              background: isComplete ? t.completedBg : t.surface,
              border: selectedBookId === book.id && book.status === "reading"
                ? "2px solid #66BB6A" : `1px solid ${isComplete ? t.completedBorder : t.border}`,
              filter: isComplete ? "saturate(0.3)" : "none"
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ fontSize: 30, filter: isComplete ? "grayscale(0.5)" : "none" }}>{book.cover}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isComplete ? t.textMuted : t.text }}>{book.title}</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>{book.author}</div>
                {book.status === "reading" && (
                  <div style={{ marginTop: 6 }}>
                    <ProgressBar t={t} value={book.readPages} max={book.totalPages} color="#66BB6A" height={6} showText={false} />
                    <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
                      {Math.round(book.readPages / book.totalPages * 100)}% · {book.readPages}/{book.totalPages}p
                    </div>
                  </div>
                )}
                {isComplete && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>✅ 완독 · {book.totalPages}p</div>}
                {book.status === "wishlist" && <div style={{ fontSize: 11, color: "#FFA726", marginTop: 4 }}>📋 읽을 예정</div>}
              </div>
              <div style={{
                fontSize: 10, color: "#FFF", padding: "3px 8px", borderRadius: 8,
                background: GENRES.find(g => g.id === book.genre)?.color,
                opacity: isComplete ? 0.5 : 1,
                textAlign: "center", lineHeight: 1.3
              }}>
                <div>{GENRES.find(g => g.id === book.genre)?.stat}</div>
                <div style={{ fontSize: 8, opacity: 0.8 }}>({GENRES.find(g => g.id === book.genre)?.label})</div>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Add Book Form */}
      {!showAddBook ? (
        <button onClick={() => setShowAddBook(true)} style={{
          width: "100%", padding: 14, border: `2px dashed ${t.borderStrong}`,
          background: "transparent", color: t.textMuted, borderRadius: 14, cursor: "pointer",
          fontSize: 14, fontWeight: 600
        }}>+ 새 책 추가</button>
      ) : (
        <Card t={t} style={{ border: `2px solid #5B8DEF` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 12 }}>📖 새 책 추가</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              placeholder="책 제목"
              value={newBook.title}
              onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))}
              style={{ padding: 10, background: t.inputBg, border: `2px solid ${t.inputBorder}`, color: t.text, borderRadius: 10, fontSize: 13, outline: "none" }}
            />
            <input
              placeholder="저자"
              value={newBook.author}
              onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))}
              style={{ padding: 10, background: t.inputBg, border: `2px solid ${t.inputBorder}`, color: t.text, borderRadius: 10, fontSize: 13, outline: "none" }}
            />
            <input
              type="number"
              placeholder="전체 페이지 수"
              value={newBook.totalPages}
              onChange={e => setNewBook(p => ({ ...p, totalPages: e.target.value }))}
              style={{ padding: 10, background: t.inputBg, border: `2px solid ${t.inputBorder}`, color: t.text, borderRadius: 10, fontSize: 13, outline: "none" }}
            />
            {/* Genre selector with stat mapping */}
            <div style={{ fontSize: 12, color: t.textSub, fontWeight: 600, marginTop: 2 }}>장르 선택 (스탯 연동)</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {GENRES.map(g => (
                <button key={g.id} onClick={() => setNewBook(p => ({ ...p, genre: g.id }))}
                  style={{
                    flex: 1, minWidth: 70, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                    background: newBook.genre === g.id ? g.color : t.surfaceAlt,
                    color: newBook.genre === g.id ? "#FFF" : t.textSub,
                    border: newBook.genre === g.id ? `2px solid ${g.color}` : `1px solid ${t.border}`,
                    fontSize: 11, fontWeight: 600, textAlign: "center", transition: "all 0.2s"
                  }}
                >
                  {g.icon} {g.stat}<br/>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>({g.label})</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => setShowAddBook(false)} style={{
                flex: 1, padding: 11, background: t.surfaceAlt, color: t.textSub,
                border: `1px solid ${t.border}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600
              }}>취소</button>
              <button onClick={() => {
                if (!newBook.title || !newBook.totalPages || !newBook.genre) {
                  setToast("⚠️ 제목, 페이지 수, 장르를 모두 입력해주세요");
                  setTimeout(() => setToast(null), 2500);
                  return;
                }
                const genre = GENRES.find(g => g.id === newBook.genre);
                setBooks(prev => [...prev, {
                  id: Date.now(), title: newBook.title, author: newBook.author || "미입력",
                  genre: newBook.genre, totalPages: parseInt(newBook.totalPages),
                  readPages: 0, status: "reading", cover: genre?.icon || "📖", completedMonth: null
                }]);
                setNewBook({ title: "", author: "", totalPages: "", genre: "" });
                setShowAddBook(false);
                setToast("✨ 새 책이 추가되었어요!");
                setTimeout(() => setToast(null), 2500);
              }} style={{
                flex: 1, padding: 11, background: "#5B8DEF", color: "#FFF",
                border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700
              }}>추가하기</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============ TAB: CHARACTER ============ */
function CharacterTab({ t, equipment, gold }) {
  // Simulated player state with balanced numbers
  // Lv.12 = ~1500 cumulative EXP = ~1.5 months of reading (~40p/day)
  const playerStats = {
    level: 12, wisdom: 18, empathy: 24, insight: 12, creation: 16,
    streak: 12, genresRead: 3, totalBooksCompleted: 6,
    monthlyPages: 920,
  };
  const currentLevelExp = getExpForLevel(playerStats.level);
  const nextLevelExp = getExpToNextLevel(playerStats.level);
  const expInLevel = 142; // progress within current level
  const totalStat = playerStats.wisdom + playerStats.empathy + playerStats.insight + playerStats.creation;

  // Calculate unlocked jobs
  const unlockedJobs = ALL_JOBS.filter(j => j.requirement(playerStats));
  const lockedJobs = ALL_JOBS.filter(j => !j.requirement(playerStats));

  // Selected display title (simulated - user would pick this)
  const [selectedJobId, setSelectedJobId] = useState("bard");
  const [showJobSelector, setShowJobSelector] = useState(false);
  const selectedJob = ALL_JOBS.find(j => j.id === selectedJobId) || ALL_JOBS[0];

  // Group jobs by tier for display
  const jobsByTier = [0, 1, 2, 3].map(tier => ({
    tier,
    label: ["시작", "초급", "1차 전직", "2차 전직"][tier],
    jobs: ALL_JOBS.filter(j => j.tier === tier)
  }));

  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Main Character Card */}
      <Card t={t} style={{ background: t.charBg, textAlign: "center", padding: "20px 16px", border: `1px solid ${t.charBorder}`, position: "relative", overflow: "hidden" }}>
        {[{ top: 15, left: 25, s: 6, c: "#FFD54F", d: "0s" }, { top: 40, left: "auto", s: 5, c: "#90CAF9", d: "0.8s" }, { top: 70, left: 50, s: 4, c: "#CE93D8", d: "1.5s" }].map((sp, i) => (
          <div key={i} style={{ position: "absolute", top: sp.top, left: sp.left !== "auto" ? sp.left : undefined, right: sp.left === "auto" ? 30 : undefined, width: sp.s, height: sp.s, background: sp.c, borderRadius: "50%", opacity: 0.6, animation: `sparkle 3s ${sp.d} infinite` }} />
        ))}

        {/* Selected title - clickable */}
        <div onClick={() => setShowJobSelector(true)} style={{
          display: "inline-block", padding: "4px 16px",
          background: `${selectedJob.color}20`, borderRadius: 20,
          fontSize: 12, color: selectedJob.color, fontWeight: 600, marginBottom: 8,
          cursor: "pointer", border: `1px solid ${selectedJob.color}40`,
          transition: "all 0.2s"
        }}>
          {selectedJob.icon} {selectedJob.name} ▾
        </div>

        <CutePixelCharacter equipment={equipment} />

        <div style={{ fontSize: 20, fontWeight: 800, color: t.text, marginTop: 4 }}>
          Lv.{playerStats.level}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "4px 12px", background: "#FFD54F30", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#F57F17" }}>💰 {gold.toLocaleString()}</div>
          <div style={{ padding: "4px 12px", background: "#CE93D830", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#8E24AA" }}>⚡ {totalStat} SP</div>
          <div style={{ padding: "4px 12px", background: "#5B8DEF20", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#5B8DEF" }}>🏅 {unlockedJobs.length}칭호</div>
        </div>

        <div style={{ maxWidth: 260, margin: "14px auto 0" }}>
          <div style={{ fontSize: 11, color: t.textSub, marginBottom: 3 }}>
            EXP (다음 레벨까지 {nextLevelExp - expInLevel} EXP)
          </div>
          <ProgressBar t={t} value={expInLevel} max={nextLevelExp} color="#7C4DFF" height={10} showText={true} />
        </div>
      </Card>

      {/* Job Title Selector Modal */}
      {showJobSelector && (
        <div onClick={() => setShowJobSelector(false)} style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: t.modalOverlay, zIndex: 300,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: t.surface, borderRadius: 16, padding: 20,
            maxWidth: 380, width: "100%", maxHeight: "75vh", overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 4 }}>🏅 칭호 선택</div>
            <div style={{ fontSize: 12, color: t.textSub, marginBottom: 16 }}>표시할 칭호를 선택하세요</div>

            {jobsByTier.map(tierGroup => (
              <div key={tierGroup.tier} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 8, textTransform: "uppercase" }}>
                  {"★".repeat(tierGroup.tier + 1)} {tierGroup.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {tierGroup.jobs.map(job => {
                    const unlocked = job.requirement(playerStats);
                    const isSelected = selectedJobId === job.id;
                    return (
                      <div key={job.id}
                        onClick={() => { if (unlocked) { setSelectedJobId(job.id); setShowJobSelector(false); } }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 12px", borderRadius: 10,
                          background: isSelected ? `${job.color}15` : unlocked ? t.surfaceAlt : t.surface,
                          border: isSelected ? `2px solid ${job.color}` : `1px solid ${t.border}`,
                          cursor: unlocked ? "pointer" : "default",
                          opacity: unlocked ? 1 : 0.4,
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ fontSize: 22, filter: unlocked ? "none" : "grayscale(1)" }}>{job.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: unlocked ? job.color : t.textMuted }}>
                            {job.name}
                            {isSelected && <span style={{ fontSize: 10, marginLeft: 6, color: "#66BB6A" }}>✓ 사용 중</span>}
                          </div>
                          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
                            {unlocked ? "✅ 달성 완료" : `🔒 ${job.condition}`}
                          </div>
                        </div>
                        {unlocked && !isSelected && (
                          <div style={{
                            fontSize: 10, padding: "4px 10px", borderRadius: 8,
                            background: `${job.color}15`, color: job.color, fontWeight: 700
                          }}>선택</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Radar */}
      <Card t={t}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>📊 스탯 분포</div>
        <div style={{ display: "flex", justifyContent: "center" }}><StatRadar stats={playerStats} t={t} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {GENRES.map(g => {
            const key = g.id === "wisdom" ? "wisdom" : g.id === "empathy" ? "empathy" : g.id === "insight" ? "insight" : "creation";
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 16, width: 24, textAlign: "center" }}>{g.icon}</div>
                <div style={{ width: 32, fontSize: 11, color: t.textSub, fontWeight: 600 }}>{g.stat}</div>
                <div style={{ flex: 1 }}><ProgressBar t={t} value={playerStats[key]} max={50} color={g.color} height={8} showText={false} /></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: g.color, width: 24, textAlign: "right" }}>{playerStats[key]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: t.textMuted, marginTop: 8, textAlign: "center" }}>
          📖 장르별 페이지를 읽으면 해당 스탯 +1 (50p당)
        </div>
      </Card>

      {/* Equipment Slots */}
      <Card t={t}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 12 }}>🛡️ 장착 장비</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {EQUIPMENT_SLOTS.map(slot => {
            const equipped = equipment[slot.id];
            const tier = EQUIPMENT_TIERS.find(ti => ti.id === equipped);
            return (
              <div key={slot.id} style={{
                background: tier ? (t === themes.dark ? tier.bgDark : tier.bg) : t.surfaceAlt,
                borderRadius: 12, padding: "12px 8px", textAlign: "center",
                border: tier ? `2px solid ${tier.color}40` : `2px solid ${t.border}`
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{slot.icon}</div>
                <div style={{ fontSize: 10, color: t.textMuted }}>{slot.label}</div>
                {tier ? <div style={{ fontSize: 10, color: tier.color, fontWeight: 700, marginTop: 2 }}>{tier.label}</div> : <div style={{ fontSize: 10, color: t.textMuted }}>비어있음</div>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Unlocked Titles */}
      <Card t={t}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>🏅 획득한 칭호</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5B8DEF", background: `#5B8DEF15`, padding: "3px 10px", borderRadius: 10 }}>
            {unlockedJobs.length} / {ALL_JOBS.length}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {unlockedJobs.map(job => (
            <div key={job.id} onClick={() => { setSelectedJobId(job.id); }}
              style={{
                padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                background: selectedJobId === job.id ? `${job.color}20` : t.surfaceAlt,
                border: selectedJobId === job.id ? `2px solid ${job.color}` : `1px solid ${t.border}`,
                fontSize: 12, fontWeight: 600, color: job.color,
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 4
              }}
            >
              {job.icon} {job.name}
            </div>
          ))}
        </div>
      </Card>

      {/* Next unlock hints */}
      <Card t={t} style={{ background: t.hintBg, border: `1px solid ${t.hintBorder}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 10 }}>🔮 다음 칭호 힌트</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lockedJobs.slice(0, 4).map(job => {
            // Calculate rough progress
            let progressText = "";
            let pct = 0;
            if (job.reqLevel && playerStats.level < job.reqLevel) {
              pct = (playerStats.level / job.reqLevel) * 100;
              progressText = `Lv.${playerStats.level}/${job.reqLevel}`;
            } else if (job.condition.includes("연속")) {
              pct = (playerStats.streak / 30) * 100;
              progressText = `${playerStats.streak}/30일`;
            } else {
              pct = 30; // rough estimate
              progressText = "조건 미달";
            }
            return (
              <div key={job.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${t.border}`
              }}>
                <div style={{ fontSize: 20, opacity: 0.4, filter: "grayscale(1)" }}>{job.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.textSub }}>{job.name}</div>
                  <div style={{ fontSize: 10, color: t.textMuted }}>{job.condition}</div>
                  <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 4, background: t.barBg, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: job.color, borderRadius: 2, opacity: 0.6 }} />
                    </div>
                    <span style={{ fontSize: 9, color: t.textMuted }}>{progressText}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div onClick={() => setShowJobSelector(true)} style={{
          marginTop: 10, textAlign: "center", fontSize: 12, color: "#5B8DEF",
          cursor: "pointer", fontWeight: 600
        }}>
          전체 칭호 보기 ({ALL_JOBS.length}개) →
        </div>
      </Card>

      {/* Balance info card */}
      <Card t={t} style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 8 }}>📐 성장 가이드</div>
        <div style={{ fontSize: 11, color: t.textSub, lineHeight: 1.8 }}>
          • 1페이지 읽기 = <b style={{ color: "#7C4DFF" }}>+1 EXP</b> + <b style={{ color: "#FFB300" }}>+1 Gold</b><br/>
          • 50페이지 같은 장르 = <b style={{ color: "#5B8DEF" }}>해당 스탯 +1</b><br/>
          • 책 완독 보너스 = <b style={{ color: "#7C4DFF" }}>+50 EXP</b> + <b style={{ color: "#FFB300" }}>+30 Gold</b><br/>
          • 일일퀘스트 = <b style={{ color: "#FFB300" }}>+10~30 Gold</b><br/>
          • 주간퀘스트 = <b style={{ color: "#FFB300" }}>+60~120 Gold</b><br/>
          • 월간퀘스트 = <b style={{ color: "#FFB300" }}>+250~600 Gold</b>
        </div>
      </Card>
    </div>
  );
}

/* ============ TAB: SHOP ============ */
function ShopTab({ t, equipment, setEquipment, gold, setGold }) {
  const [selectedSlot, setSelectedSlot] = useState("helmet");
  const [toast, setToast] = useState(null);
  const currentTierIndex = equipment[selectedSlot] ? EQUIPMENT_TIERS.findIndex(ti => ti.id === equipment[selectedSlot]) : -1;

  const handleBuy = (tier, tierIndex) => {
    if (gold < tier.price) return;
    setGold(prev => prev - tier.price);
    setEquipment(prev => ({ ...prev, [selectedSlot]: tier.id }));
    setToast(`✨ ${tier.label} ${EQUIPMENT_SLOTS.find(s => s.id === selectedSlot)?.label} 구매 완료! (-${tier.price.toLocaleString()}G)`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: "#333", color: "#FFF", padding: "10px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.3s ease"
        }}>{toast}</div>
      )}

      <Card t={t} style={{ background: t.goldBg, border: `1px solid ${t.goldBorder}`, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#F57F17", fontWeight: 700 }}>💰 보유 골드</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#F57F17" }}>{gold.toLocaleString()} G</span>
        </div>
        <div style={{ fontSize: 10, color: t.textMuted, marginTop: 6 }}>
          💡 골드 수입: 페이지 읽기 + 퀘스트 보상 + 완독 보너스 (일평균 ~60G)
        </div>
      </Card>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {EQUIPMENT_SLOTS.map(slot => {
          const eq = equipment[slot.id];
          const eqTier = eq ? EQUIPMENT_TIERS.find(ti => ti.id === eq) : null;
          return (
            <button key={slot.id} onClick={() => setSelectedSlot(slot.id)} style={{
              padding: "8px 12px", borderRadius: 12, cursor: "pointer",
              background: selectedSlot === slot.id ? t.chipActive : t.chipBg,
              color: selectedSlot === slot.id ? "#FFF" : t.textSub,
              border: "none", fontSize: 12, fontWeight: 600,
              position: "relative"
            }}>
              {slot.icon} {slot.label}
              {eqTier && <span style={{ fontSize: 8, marginLeft: 2, opacity: 0.7 }}>({eqTier.label})</span>}
            </button>
          );
        })}
      </div>

      {EQUIPMENT_TIERS.map((tier, i) => {
        const owned = i <= currentTierIndex;
        const isCurrent = i === currentTierIndex;
        const isNext = i === currentTierIndex + 1;
        const canAfford = gold >= tier.price;
        return (
          <Card key={tier.id} t={t} style={{
            padding: 12,
            background: isCurrent ? (t === themes.dark ? tier.bgDark : tier.bg) : owned ? t.surfaceAlt : t.surface,
            border: isCurrent ? `2px solid ${tier.color}` : `1px solid ${t.border}`,
            opacity: owned && !isCurrent ? 0.5 : 1
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tier.color}18`, border: `2px solid ${tier.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {EQUIPMENT_SLOTS.find(s => s.id === selectedSlot)?.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tier.color }}>{tier.label}</div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>{tier.price.toLocaleString()} Gold <span style={{ fontSize: 10, opacity: 0.7 }}>({tier.desc})</span></div>
                </div>
              </div>
              <div>
                {isCurrent && <span style={{ fontSize: 12, color: tier.color, fontWeight: 700, padding: "5px 14px", background: `${tier.color}15`, borderRadius: 20 }}>장착 중</span>}
                {owned && !isCurrent && <span style={{ fontSize: 12, color: t.textMuted }}>보유</span>}
                {isNext && canAfford && <button onClick={() => handleBuy(tier, i)} style={{ padding: "7px 18px", background: "#66BB6A", color: "#FFF", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>구매</button>}
                {isNext && !canAfford && <span style={{ fontSize: 12, color: "#EF5350" }}>골드 부족</span>}
                {!owned && !isNext && <span style={{ fontSize: 14, color: t.textMuted }}>🔒</span>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ============ TAB: ACHIEVEMENTS ============ */
function AchievementsTab({ t }) {
  const doneCount = ACHIEVEMENTS.filter(a => a.done).length;
  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>🏆 업적</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#5B8DEF", background: t.chipBg, padding: "4px 12px", borderRadius: 20 }}>{doneCount} / {ACHIEVEMENTS.length}</div>
      </div>
      {ACHIEVEMENTS.map(ach => (
        <Card key={ach.id} t={t} style={{
          padding: 14,
          background: ach.done ? t.achieveDoneBg : t.surface,
          border: `1px solid ${ach.done ? t.achieveDoneBorder : t.border}`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 32, filter: ach.done ? "none" : "grayscale(0.7)", opacity: ach.done ? 1 : 0.4 }}>{ach.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: ach.done ? t.text : t.textMuted }}>{ach.title}</span>
                {ach.done && <span style={{ fontSize: 12, color: "#66BB6A" }}>✅</span>}
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{ach.desc}</div>
              <div style={{ fontSize: 11, marginTop: 4, display: "inline-block", padding: "2px 8px", borderRadius: 8, background: "#FFD54F20", color: "#F57F17", fontWeight: 600 }}>🎁 {ach.reward}</div>
              {!ach.done && ach.progress !== undefined && (
                <div style={{ marginTop: 8 }}><ProgressBar t={t} value={ach.progress} max={ach.total} color="#FFA726" height={8} /></div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ============ TAB: STATS (with monthly book list) ============ */
function StatsTab({ t }) {
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const totalPages = 1274, completedBooks = 3, totalBooks = 6, streak = 12;
  const maxBar = Math.max(...WEEKLY_PAGES);

  const genreData = [
    { label: "공감", value: 45, color: "#66BB6A" },
    { label: "지혜", value: 30, color: "#5B8DEF" },
    { label: "창조", value: 15, color: "#EF5350" },
    { label: "통찰", value: 10, color: "#FFA726" },
  ];

  const months = [
    { id: "2026-01", label: "1월", pages: 636, books: 1 },
    { id: "2026-02", label: "2월", pages: 328, books: 1 },
    { id: "2026-03", label: "3월", pages: 310, books: 1 },
  ];

  const monthlyBooks = INITIAL_BOOKS.filter(b => b.completedMonth === selectedMonth);

  const summaryCards = [
    { label: "총 페이지", value: totalPages.toLocaleString(), unit: "p", icon: "📄", color: "#5B8DEF" },
    { label: "완독", value: completedBooks, unit: `/ ${totalBooks}권`, icon: "📚", color: "#66BB6A" },
    { label: "연속 독서", value: streak, unit: "일", icon: "🔥", color: "#EF5350" },
    { label: "보유 골드", value: "10,000", unit: "G", icon: "💰", color: "#FFB300" },
  ];

  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {summaryCards.map((card, i) => (
          <Card key={i} t={t} style={{ padding: 14, textAlign: "center", background: t.statCardBgs[i], border: "none" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{card.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>
              {card.value}<span style={{ fontSize: 12, fontWeight: 500, color: t.textMuted }}> {card.unit}</span>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{card.label}</div>
          </Card>
        ))}
      </div>

      {/* Weekly chart */}
      <Card t={t}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 14 }}>📈 이번 주 독서량</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
          {WEEKLY_PAGES.map((pages, i) => {
            const isToday = i === 6;
            const barH = maxBar > 0 ? (pages / maxBar) * 90 : 0;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: isToday ? "#5B8DEF" : t.textMuted, fontWeight: 600 }}>{pages > 0 ? pages : ""}</span>
                <div style={{
                  width: "100%", maxWidth: 32, height: Math.max(barH, pages > 0 ? 4 : 0),
                  background: isToday ? "linear-gradient(180deg, #5B8DEF, #7C4DFF)" : pages > 0 ? `linear-gradient(180deg, ${t.chipActive}40, ${t.chipActive}20)` : t.barTrack,
                  borderRadius: 6, transition: "height 0.5s ease"
                }} />
                <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? "#5B8DEF" : t.textMuted }}>{DAYS_LABEL[i]}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Genre distribution */}
      <Card t={t}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 14 }}>📚 장르 분포</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16 }}>
          {genreData.map((g, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 50, height: 50, borderRadius: "50%",
                background: `conic-gradient(${g.color} ${g.value * 3.6}deg, ${t.barBg} 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px"
              }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: g.color }}>{g.value}%</div>
              </div>
              <div style={{ fontSize: 11, color: g.color, fontWeight: 600 }}>{g.label}</div>
            </div>
          ))}
        </div>
        {genreData.map((g, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: t.textSub, fontWeight: 600 }}>{g.label}</span>
              <span style={{ fontSize: 12, color: g.color, fontWeight: 700 }}>{g.value}%</span>
            </div>
            <div style={{ width: "100%", height: 8, background: t.barBg, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${g.value}%`, height: "100%", background: `linear-gradient(90deg, ${g.color}, ${g.color}BB)`, borderRadius: 4, transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </Card>

      {/* Monthly summary with book list */}
      <Card t={t}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 12 }}>🗓️ 월별 요약</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {months.map(m => (
            <div key={m.id} onClick={() => setSelectedMonth(m.id)} style={{
              flex: 1, padding: 12, borderRadius: 12, textAlign: "center", cursor: "pointer",
              background: selectedMonth === m.id ? t.monthActiveBg : t.surfaceAlt,
              border: selectedMonth === m.id ? `2px solid ${t.monthActiveBorder}` : `1px solid ${t.border}`,
              transition: "all 0.2s"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: selectedMonth === m.id ? "#5B8DEF" : t.textMuted }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: selectedMonth === m.id ? "#5B8DEF" : t.textSub, marginTop: 4 }}>{m.pages}<span style={{ fontSize: 10, fontWeight: 500 }}>p</span></div>
              <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{m.books}권 완독</div>
            </div>
          ))}
        </div>

        {/* Monthly book list */}
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 10 }}>
            📖 {months.find(m => m.id === selectedMonth)?.label} 완독 도서
          </div>
          {monthlyBooks.length > 0 ? (
            monthlyBooks.map(book => (
              <div key={book.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                borderBottom: `1px solid ${t.border}`
              }}>
                <div style={{ fontSize: 26 }}>{book.cover}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{book.title}</div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{book.author} · {book.totalPages}p</div>
                </div>
                <div style={{
                  fontSize: 10, color: "#FFF", padding: "3px 8px", borderRadius: 8,
                  background: GENRES.find(g => g.id === book.genre)?.color
                }}>
                  {GENRES.find(g => g.id === book.genre)?.stat}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: 16, color: t.textMuted, fontSize: 13 }}>
              이 달에 완독한 책이 없어요 📚
            </div>
          )}
        </div>
      </Card>

      {/* Streak */}
      <Card t={t}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 12 }}>🔥 독서 스트릭</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Array.from({ length: 30 }, (_, i) => {
            const isRead = i < 12 || (i > 14 && i < 20) || i === 22 || i === 25 || i === 28;
            const isToday = i === 29;
            return (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: 4,
                background: isToday ? "#5B8DEF" : isRead ? t.streakRead : t.streakEmpty,
                border: isToday ? "2px solid #3D5AFE" : "none"
              }} />
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontSize: 11, color: t.textMuted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: t.streakRead }} /> 읽은 날</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: "#5B8DEF" }} /> 오늘</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: t.streakEmpty }} /> 안 읽은 날</div>
        </div>
      </Card>
    </div>
  );
}

/* ============ MAIN APP ============ */
export default function BookQuestApp() {
  const [activeTab, setActiveTab] = useState("library");
  const [darkMode, setDarkMode] = useState(false);
  const [gold, setGold] = useState(10000);
  const [equipment, setEquipment] = useState({
    helmet: "bronze", armor: "silver", cloak: "iron",
    weapon: "bronze", shield: null, boots: "iron"
  });
  const t = useTheme(darkMode);

  const renderTab = () => {
    switch (activeTab) {
      case "library": return <LibraryTab t={t} />;
      case "character": return <CharacterTab t={t} equipment={equipment} gold={gold} />;
      case "shop": return <ShopTab t={t} equipment={equipment} setEquipment={setEquipment} gold={gold} setGold={setGold} />;
      case "achievements": return <AchievementsTab t={t} />;
      case "stats": return <StatsTab t={t} />;
      default: return null;
    }
  };

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", background: t.bg,
      minHeight: "100vh", color: t.text,
      position: "relative", display: "flex", flexDirection: "column",
      transition: "background 0.3s, color 0.3s"
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: ${t.bg}; margin: 0; transition: background 0.3s; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 2px; }
        @keyframes sparkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.7; transform: scale(1.3); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        input:focus { outline: none; border-color: #5B8DEF !important; }
        button { font-family: inherit; }
        button:hover { filter: brightness(1.05); }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "14px 18px", background: t.headerBg,
        borderBottom: `1px solid ${t.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: t.headerShadow
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🏰</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: t.text, letterSpacing: -0.5 }}>
            Book <span style={{ color: "#5B8DEF" }}>Quest</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#F57F17", background: "#FFD54F30", padding: "4px 10px", borderRadius: 12 }}>💰 {gold.toLocaleString()}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#7C4DFF", background: "#CE93D830", padding: "4px 10px", borderRadius: 12 }}>Lv.12</span>
          {/* Dark mode toggle */}
          <button onClick={() => setDarkMode(!darkMode)} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: darkMode ? "#2A2D3A" : "#F5F5F5",
            border: `1px solid ${t.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, transition: "all 0.3s"
          }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
        {renderTab()}
      </div>

      {/* Tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420, display: "flex",
        background: t.tabBg, borderTop: `1px solid ${t.border}`,
        boxShadow: t.tabShadow, zIndex: 100
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: "8px 4px 6px", border: "none", cursor: "pointer",
            background: "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            position: "relative"
          }}>
            {activeTab === tab.id && (
              <div style={{ position: "absolute", top: -1, left: "25%", right: "25%", height: 3, background: "#5B8DEF", borderRadius: "0 0 3px 3px" }} />
            )}
            <span style={{ fontSize: 20, filter: activeTab === tab.id ? "none" : "grayscale(0.6)", opacity: activeTab === tab.id ? 1 : 0.5, transition: "all 0.2s" }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === tab.id ? "#5B8DEF" : t.textMuted }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
