// 이 파일이 하는 일: 칭호(직업) 정의 + 조건 체크 함수 (PRD 4-5 기반)

import type { UserProfile, UserStats } from "@/types/database";

// 칭호 체크에 필요한 통합 스탯 타입
export interface TitleCheckContext {
  level: number;
  wisdom: number;
  empathy: number;
  insight: number;
  creation: number;
  streak: number;
  totalBooksCompleted: number;
  genresRead: number;       // 읽은 장르 종류 수
  monthlyPages: number;     // 이번 달 읽은 페이지
}

export interface TitleDef {
  id: string;
  name: string;
  icon: string;
  tier: number;
  color: string;
  condition: string; // 사용자에게 보여줄 조건 설명
  check: (ctx: TitleCheckContext) => boolean;
}

export const ALL_TITLES: TitleDef[] = [
  // Tier 0 — 시작
  {
    id: "apprentice", name: "견습 모험가", icon: "🌱", tier: 0, color: "#9E9E9E",
    condition: "시작 시 자동 획득",
    check: () => true,
  },

  // Tier 1 — 초급
  {
    id: "bookworm", name: "책벌레", icon: "📖", tier: 1, color: "#8D6E63",
    condition: "Lv.5 달성",
    check: (c) => c.level >= 5,
  },
  {
    id: "curious", name: "호기심 탐험가", icon: "🔍", tier: 1, color: "#78909C",
    condition: "2가지 장르 읽기",
    check: (c) => c.genresRead >= 2,
  },

  // Tier 2 — 1차 전직
  {
    id: "sage", name: "현자", icon: "🧙", tier: 2, color: "#5B8DEF",
    condition: "Lv.10 + 지혜 1위 (15 이상)",
    check: (c) => c.level >= 10 && c.wisdom >= 15 && c.wisdom >= c.empathy && c.wisdom >= c.insight && c.wisdom >= c.creation,
  },
  {
    id: "bard", name: "음유시인", icon: "🎵", tier: 2, color: "#66BB6A",
    condition: "Lv.10 + 공감 1위 (15 이상)",
    check: (c) => c.level >= 10 && c.empathy >= 15 && c.empathy >= c.wisdom && c.empathy >= c.insight && c.empathy >= c.creation,
  },
  {
    id: "knight", name: "전략기사", icon: "⚔️", tier: 2, color: "#FFA726",
    condition: "Lv.10 + 통찰 1위 (15 이상)",
    check: (c) => c.level >= 10 && c.insight >= 15 && c.insight >= c.wisdom && c.insight >= c.empathy && c.insight >= c.creation,
  },
  {
    id: "mage", name: "마법사", icon: "🔮", tier: 2, color: "#EF5350",
    condition: "Lv.10 + 창조 1위 (15 이상)",
    check: (c) => c.level >= 10 && c.creation >= 15 && c.creation >= c.wisdom && c.creation >= c.empathy && c.creation >= c.insight,
  },
  {
    id: "iron_will", name: "강철 의지", icon: "💎", tier: 2, color: "#607D8B",
    condition: "30일 연속 독서",
    check: (c) => c.streak >= 30,
  },
  {
    id: "speed_reader", name: "속독의 달인", icon: "⚡", tier: 2, color: "#FF7043",
    condition: "한 달에 1,500p 이상 읽기",
    check: (c) => c.monthlyPages >= 1500,
  },

  // Tier 3 — 2차 전직 순수형
  {
    id: "arch_scholar", name: "대현자", icon: "📖", tier: 3, color: "#1565C0",
    condition: "Lv.20 + 지혜 40 이상",
    check: (c) => c.level >= 20 && c.wisdom >= 40,
  },
  {
    id: "legendary_bard", name: "전설의 이야기꾼", icon: "🎭", tier: 3, color: "#2E7D32",
    condition: "Lv.20 + 공감 40 이상",
    check: (c) => c.level >= 20 && c.empathy >= 40,
  },
  {
    id: "paladin", name: "성기사", icon: "🛡️", tier: 3, color: "#E65100",
    condition: "Lv.20 + 통찰 40 이상",
    check: (c) => c.level >= 20 && c.insight >= 40,
  },
  {
    id: "grand_sorcerer", name: "대마법사", icon: "⚡", tier: 3, color: "#C62828",
    condition: "Lv.20 + 창조 40 이상",
    check: (c) => c.level >= 20 && c.creation >= 40,
  },

  // Tier 3 — 2차 전직 하이브리드형
  {
    id: "rune_translator", name: "룬 해독사", icon: "📜", tier: 3, color: "#00838F",
    condition: "Lv.20 + 지혜·공감 모두 30 이상",
    check: (c) => c.level >= 20 && c.wisdom >= 30 && c.empathy >= 30,
  },
  {
    id: "royal_advisor", name: "왕실 고문관", icon: "🏛️", tier: 3, color: "#4527A0",
    condition: "Lv.20 + 지혜·통찰 모두 30 이상",
    check: (c) => c.level >= 20 && c.wisdom >= 30 && c.insight >= 30,
  },
  {
    id: "dimension_weaver", name: "차원술사", icon: "🌌", tier: 3, color: "#6A1B9A",
    condition: "Lv.20 + 지혜·창조 모두 30 이상",
    check: (c) => c.level >= 20 && c.wisdom >= 30 && c.creation >= 30,
  },
  {
    id: "soul_healer", name: "영혼치유사", icon: "💫", tier: 3, color: "#AB47BC",
    condition: "Lv.20 + 공감·통찰 모두 30 이상",
    check: (c) => c.level >= 20 && c.empathy >= 30 && c.insight >= 30,
  },
  {
    id: "beast_summoner", name: "환수소환사", icon: "🐉", tier: 3, color: "#D84315",
    condition: "Lv.20 + 공감·창조 모두 30 이상",
    check: (c) => c.level >= 20 && c.empathy >= 30 && c.creation >= 30,
  },
  {
    id: "arcane_engineer", name: "마법공학사", icon: "⚗️", tier: 3, color: "#00695C",
    condition: "Lv.20 + 통찰·창조 모두 30 이상",
    check: (c) => c.level >= 20 && c.insight >= 30 && c.creation >= 30,
  },

  // Tier 3 — 특수
  {
    id: "completionist", name: "완독의 제왕", icon: "👑", tier: 3, color: "#FFB300",
    condition: "20권 이상 완독",
    check: (c) => c.totalBooksCompleted >= 20,
  },
  {
    id: "genre_master", name: "만물박사", icon: "🌈", tier: 3, color: "#00BCD4",
    condition: "모든 스탯 20 이상",
    check: (c) => c.wisdom >= 20 && c.empathy >= 20 && c.insight >= 20 && c.creation >= 20,
  },
];

// 프로필 + 스탯으로 TitleCheckContext 생성
export function buildTitleContext(
  profile: UserProfile,
  stats: UserStats,
  totalBooksCompleted: number,
  genresRead: number,
  monthlyPages: number
): TitleCheckContext {
  return {
    level: profile.level,
    wisdom: stats.wisdom,
    empathy: stats.empathy,
    insight: stats.insight,
    creation: stats.creation,
    streak: profile.streak,
    totalBooksCompleted,
    genresRead,
    monthlyPages,
  };
}

// 새로 해금된 칭호 ID 목록 반환 (기존 해금 목록 제외)
export function getNewlyUnlockedTitles(
  ctx: TitleCheckContext,
  alreadyUnlocked: string[]
): string[] {
  return ALL_TITLES
    .filter((t) => !alreadyUnlocked.includes(t.id) && t.check(ctx))
    .map((t) => t.id);
}
