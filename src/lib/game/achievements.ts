// 이 파일이 하는 일: 업적 28개 정의 + 진행도 계산 함수 (PRD 4-7 기반)

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  reward: string;
  icon: string;
  // 진행도가 있는 업적은 total 지정
  total?: number;
  // 진행도 계산 함수
  getProgress: (stats: AchievementStats) => number;
}

// 업적 체크에 필요한 통합 통계
export interface AchievementStats {
  totalBooks: number;           // 등록한 책 수
  completedBooks: number;       // 완독한 책 수
  totalPagesRead: number;       // 누적 읽은 페이지
  streak: number;               // 현재 연속 독서 일수
  loginStreak: number;          // 연속 접속 일수
  hasReadingLog: boolean;       // 독서 기록 있음
  hasFirstComplete: boolean;    // 첫 완독 여부
  hasFirstEquip: boolean;       // 첫 장비 구매 여부
  allIron: boolean;             // 전 부위 Iron 장착
  sameGradeSet: boolean;        // 전 부위 같은 등급 (Bronze+)
  level: number;
  genresRead: number;           // 읽은 장르 종류 수
  maxStatValue: number;         // 스탯 중 최대값
  memoCount: number;            // 독서 메모 수
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── 시작 & 기본 ──────────────────────────────────────
  {
    id: "first_book", title: "첫 발걸음", desc: "첫 번째 책 등록", reward: "+50 Gold",
    icon: "🌱", total: 1,
    getProgress: (s) => Math.min(s.totalBooks, 1),
  },
  {
    id: "first_record", title: "기록의 시작", desc: "첫 독서 기록 남기기", reward: "칭호: 신입 모험가",
    icon: "✏️", total: 1,
    getProgress: (s) => s.hasReadingLog ? 1 : 0,
  },
  {
    id: "first_complete", title: "완독의 기쁨", desc: "첫 번째 책 완독", reward: "Iron 무기",
    icon: "📕", total: 1,
    getProgress: (s) => s.hasFirstComplete ? 1 : 0,
  },
  {
    id: "login_3", title: "습관 만들기", desc: "3일 연속 앱 접속", reward: "+30 Gold",
    icon: "📱", total: 3,
    getProgress: (s) => Math.min(s.loginStreak, 3),
  },

  // ── 연속 독서 ────────────────────────────────────────
  {
    id: "streak_7", title: "꾸준함의 시작", desc: "7일 연속 독서", reward: "+100 Gold",
    icon: "🔥", total: 7,
    getProgress: (s) => Math.min(s.streak, 7),
  },
  {
    id: "streak_14", title: "2주의 열정", desc: "14일 연속 독서", reward: "+200 Gold",
    icon: "🔥", total: 14,
    getProgress: (s) => Math.min(s.streak, 14),
  },
  {
    id: "streak_30", title: "강철 의지", desc: "30일 연속 독서", reward: "칭호: 강철 의지",
    icon: "💎", total: 30,
    getProgress: (s) => Math.min(s.streak, 30),
  },
  {
    id: "streak_100", title: "전설의 독서가", desc: "100일 연속 독서", reward: "칭호 + 500G",
    icon: "🏆", total: 100,
    getProgress: (s) => Math.min(s.streak, 100),
  },

  // ── 완독 수 ──────────────────────────────────────────
  {
    id: "books_3", title: "세 권의 이야기", desc: "3권 완독", reward: "+100 Gold",
    icon: "📚", total: 3,
    getProgress: (s) => Math.min(s.completedBooks, 3),
  },
  {
    id: "books_5", title: "다섯 고개 넘기", desc: "5권 완독", reward: "Bronze 방패",
    icon: "📚", total: 5,
    getProgress: (s) => Math.min(s.completedBooks, 5),
  },
  {
    id: "books_10", title: "다독가", desc: "10권 완독", reward: "Silver 망토",
    icon: "📚", total: 10,
    getProgress: (s) => Math.min(s.completedBooks, 10),
  },
  {
    id: "books_20", title: "서재의 주인", desc: "20권 완독", reward: "칭호: 완독의 제왕",
    icon: "📚", total: 20,
    getProgress: (s) => Math.min(s.completedBooks, 20),
  },
  {
    id: "books_50", title: "살아있는 도서관", desc: "50권 완독", reward: "Gold 갑옷 + 1000G",
    icon: "📚", total: 50,
    getProgress: (s) => Math.min(s.completedBooks, 50),
  },

  // ── 페이지 누적 ──────────────────────────────────────
  {
    id: "pages_500", title: "첫 번째 이정표", desc: "누적 500p 읽기", reward: "+50 Gold",
    icon: "📄", total: 500,
    getProgress: (s) => Math.min(s.totalPagesRead, 500),
  },
  {
    id: "pages_1000", title: "천 페이지의 벽", desc: "누적 1,000p 읽기", reward: "캐릭터 외양 변화",
    icon: "⭐", total: 1000,
    getProgress: (s) => Math.min(s.totalPagesRead, 1000),
  },
  {
    id: "pages_5000", title: "만 페이지 돌파", desc: "누적 5,000p 읽기", reward: "칭호: 만권의 지혜",
    icon: "⭐", total: 5000,
    getProgress: (s) => Math.min(s.totalPagesRead, 5000),
  },
  {
    id: "pages_10000", title: "독서 마라톤", desc: "누적 10,000p 읽기", reward: "Platinum 투구 + 2000G",
    icon: "👑", total: 10000,
    getProgress: (s) => Math.min(s.totalPagesRead, 10000),
  },

  // ── 장르 탐험 ────────────────────────────────────────
  {
    id: "genre_2", title: "두 세계의 여행자", desc: "2가지 장르 읽기", reward: "+50 Gold",
    icon: "🌍", total: 2,
    getProgress: (s) => Math.min(s.genresRead, 2),
  },
  {
    id: "genre_all", title: "장르 탐험가", desc: "4개 장르 모두 읽기", reward: "칭호: 만물박사",
    icon: "🌈", total: 4,
    getProgress: (s) => Math.min(s.genresRead, 4),
  },
  {
    id: "genre_deep", title: "장르의 달인", desc: "한 장르에서 스탯 30 달성", reward: "Master 무기",
    icon: "🎯", total: 30,
    getProgress: (s) => Math.min(s.maxStatValue, 30),
  },

  // ── 특별 ─────────────────────────────────────────────
  {
    id: "first_equip", title: "무장 완료", desc: "첫 장비 구매", reward: "+30 Gold",
    icon: "🛡️", total: 1,
    getProgress: (s) => s.hasFirstEquip ? 1 : 0,
  },
  {
    id: "full_iron", title: "철의 기사", desc: "전 부위 Iron 장비 장착", reward: "+100 Gold",
    icon: "⚔️", total: 1,
    getProgress: (s) => s.allIron ? 1 : 0,
  },
  {
    id: "full_set", title: "풀셋 달성", desc: "전 부위 같은 등급 장착 (Bronze 이상)", reward: "+300 Gold",
    icon: "✨", total: 1,
    getProgress: (s) => s.sameGradeSet ? 1 : 0,
  },
  {
    id: "level_5", title: "모험의 시작", desc: "Lv.5 달성", reward: "칭호: 책벌레",
    icon: "⬆️", total: 5,
    getProgress: (s) => Math.min(s.level, 5),
  },
  {
    id: "level_10", title: "견습 졸업", desc: "Lv.10 달성", reward: "1차 직업 칭호 해금",
    icon: "⬆️", total: 10,
    getProgress: (s) => Math.min(s.level, 10),
  },
  {
    id: "level_20", title: "베테랑 독서가", desc: "Lv.20 달성", reward: "2차 직업 칭호 해금",
    icon: "⬆️", total: 20,
    getProgress: (s) => Math.min(s.level, 20),
  },
  {
    id: "memo_10", title: "기록광", desc: "독서 메모 10개 작성", reward: "+150 Gold",
    icon: "📝", total: 10,
    getProgress: (s) => Math.min(s.memoCount, 10),
  },
];

// 달성 여부 확인 (total 기준)
export function isAchieved(def: AchievementDef, stats: AchievementStats): boolean {
  const total = def.total ?? 1;
  return def.getProgress(stats) >= total;
}
