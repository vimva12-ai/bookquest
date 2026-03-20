// 이 파일이 하는 일: 스탯·장비·칭호 관련 상수와 계산 함수 (PRD 4-3~4-5 기반)

import type { Genre, EquipmentTier, EquipmentSlot } from "@/types/database";

// ─── 장르 → 스탯 매핑 ──────────────────────────────────

export const GENRE_INFO: Record<
  Genre,
  { label: string; sublabel: string; stat: string; statKey: string; color: string; icon: string }
> = {
  wisdom: {
    label: "비문학",
    sublabel: "과학/철학/역사/인문",
    stat: "지혜",
    statKey: "wisdom",
    color: "#4A7A8A",
    icon: "📘",
  },
  empathy: {
    label: "문학",
    sublabel: "소설/에세이/시/전기",
    stat: "공감",
    statKey: "empathy",
    color: "#5B8C5A",
    icon: "📗",
  },
  insight: {
    label: "자기계발",
    sublabel: "심리/경영/경제/처세",
    stat: "통찰",
    statKey: "insight",
    color: "#C4933F",
    icon: "📙",
  },
  creation: {
    label: "기타",
    sublabel: "예술/판타지/SF/만화",
    stat: "창조",
    statKey: "creation",
    color: "#9B6B5A",
    icon: "📕",
  },
};

// 해당 장르 50페이지 읽을 때마다 스탯 +1
export const PAGES_PER_STAT = 50;

// ─── 장비 등급 ──────────────────────────────────────────

export const EQUIPMENT_TIERS: Array<{
  id: EquipmentTier;
  label: string;
  color: string;
  price: number;
  desc: string;
}> = [
  { id: "iron",       label: "Iron",       color: "#9E9E9E", price: 100,   desc: "~3일치 독서" },
  { id: "bronze",     label: "Bronze",     color: "#BC8F5A", price: 350,   desc: "~1주치 독서" },
  { id: "silver",     label: "Silver",     color: "#90A4AE", price: 800,   desc: "~2주치 독서" },
  { id: "gold",       label: "Gold",       color: "#FFB300", price: 2000,  desc: "~1개월치 독서" },
  { id: "platinum",   label: "Platinum",   color: "#29B6F6", price: 5000,  desc: "~2.5개월치 독서" },
  { id: "master",     label: "Master",     color: "#AB47BC", price: 12000, desc: "~6개월치 독서" },
  { id: "challenger", label: "Challenger", color: "#EF5350", price: 30000, desc: "~1년 이상" },
];

export const TIER_COLOR: Record<EquipmentTier, string> = Object.fromEntries(
  EQUIPMENT_TIERS.map((t) => [t.id, t.color])
) as Record<EquipmentTier, string>;

// ─── 장비 부위 ──────────────────────────────────────────

export const EQUIPMENT_SLOTS: Array<{ id: EquipmentSlot; label: string; icon: string }> = [
  { id: "helmet", label: "투구",  icon: "⛑️" },
  { id: "armor",  label: "갑옷",  icon: "🛡️" },
  { id: "cloak",  label: "망토",  icon: "🧣" },
  { id: "weapon", label: "무기",  icon: "⚔️" },
  { id: "shield", label: "방패",  icon: "🔰" },
  { id: "boots",  label: "신발",  icon: "👢" },
];

// 다음 구매 가능 등급 — 순차 구매만 허용
export function getNextTier(current: EquipmentTier | null): EquipmentTier {
  if (!current) return "iron";
  const idx = EQUIPMENT_TIERS.findIndex((t) => t.id === current);
  return EQUIPMENT_TIERS[Math.min(idx + 1, EQUIPMENT_TIERS.length - 1)].id;
}
