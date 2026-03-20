// 이 파일이 하는 일: 장비 슬롯별 SVG 아이콘 — tier 색상 반영
import { TIER_COLOR } from "@/lib/game/stats";
import type { EquipmentTier } from "@/types/database";

interface Props {
  slotId: string;
  tier?: EquipmentTier | null;
  size?: number;
}

const EMPTY_COLOR = "#C8D0C8";

type IconFn = (color: string) => React.ReactElement;

const SLOT_ICONS: Record<string, IconFn> = {
  helmet: (c) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 투구 돔 */}
      <path d="M12 2C7.6 2 4 5.6 4 9.5V12H20V9.5C20 5.6 16.4 2 12 2Z" fill={c} />
      {/* 볼가리개 */}
      <path d="M4 12H20V15C20 16.1 19.1 17 18 17H6C4.9 17 4 16.1 4 15V12Z" fill={c} style={{ opacity: 0.85 }} />
      {/* 바이저 슬릿 */}
      <rect x="8" y="13.5" width="8" height="2" rx="1" fill="rgba(0,0,0,0.22)" />
      {/* 정수리 리벳 */}
      <circle cx="12" cy="6" r="1" fill="rgba(255,255,255,0.25)" />
    </svg>
  ),

  armor: (c) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 어깨 */}
      <path d="M3 8C3 8 5 5 8 5H16C19 5 21 8 21 8L19 10H5L3 8Z" fill={c} />
      {/* 흉갑 */}
      <path d="M5 10H19V17C19 19 17 21 14 21H10C7 21 5 19 5 17V10Z" fill={c} style={{ opacity: 0.9 }} />
      {/* 중앙 홈 */}
      <line x1="12" y1="10" x2="12" y2="21" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
      {/* 가슴 디테일 */}
      <path d="M8 13H11V16H8V13Z" fill="rgba(255,255,255,0.12)" />
      <path d="M13 13H16V16H13V13Z" fill="rgba(255,255,255,0.12)" />
    </svg>
  ),

  cloak: (c) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 칼라 */}
      <path d="M9 3H15L16 6H8L9 3Z" fill={c} />
      {/* 망토 본체 — 왼쪽 */}
      <path d="M8 6L3 10V20L8 18V6Z" fill={c} style={{ opacity: 0.75 }} />
      {/* 망토 본체 — 오른쪽 */}
      <path d="M16 6L21 10V20L16 18V6Z" fill={c} style={{ opacity: 0.75 }} />
      {/* 망토 중앙 */}
      <path d="M8 6H16V18L12 21L8 18V6Z" fill={c} />
      {/* 안감 힌트 */}
      <path d="M9 8H15V17L12 19L9 17V8Z" fill="rgba(0,0,0,0.12)" />
    </svg>
  ),

  weapon: (c) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 칼날 */}
      <path d="M12 2L10 16H14L12 2Z" fill={c} />
      {/* 날 엣지 하이라이트 */}
      <path d="M12 2L11 12H12V2Z" fill="rgba(255,255,255,0.3)" />
      {/* 가드 */}
      <rect x="7" y="16" width="10" height="2.5" rx="1.25" fill={c} style={{ opacity: 0.85 }} />
      {/* 그립 */}
      <rect x="11" y="18.5" width="2" height="3.5" rx="1" fill={c} style={{ opacity: 0.75 }} />
      {/* 포멜 */}
      <circle cx="12" cy="22.5" r="1.5" fill={c} style={{ opacity: 0.8 }} />
    </svg>
  ),

  shield: (c) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 방패 외형 (kite shield) */}
      <path d="M12 2L3 6.5V13C3 17.5 6.5 21 12 22.5C17.5 21 21 17.5 21 13V6.5L12 2Z" fill={c} />
      {/* 내부 엠블럼 테두리 */}
      <path d="M12 5.5L6 8.5V13C6 16 8.5 18.5 12 19.5C15.5 18.5 18 16 18 13V8.5L12 5.5Z" fill="rgba(255,255,255,0.15)" />
      {/* 십자 문양 */}
      <rect x="11" y="9" width="2" height="7" rx="0.5" fill="rgba(255,255,255,0.3)" />
      <rect x="8.5" y="11.5" width="7" height="2" rx="0.5" fill="rgba(255,255,255,0.3)" />
    </svg>
  ),

  boots: (c) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 부츠 상단 통 */}
      <rect x="8" y="2" width="6" height="9" rx="1.5" fill={c} />
      {/* 발목 연결 */}
      <rect x="8" y="11" width="6" height="3" fill={c} />
      {/* 발등 (앞으로 튀어나옴) */}
      <path d="M8 14H17C17 14 17 16 16 17H8V14Z" fill={c} style={{ opacity: 0.9 }} />
      {/* 밑창 */}
      <rect x="7" y="17" width="11" height="2.5" rx="1" fill={c} style={{ opacity: 0.7 }} />
      {/* 부츠 버클 */}
      <rect x="9" y="6" width="4" height="1.5" rx="0.5" fill="rgba(255,255,255,0.25)" />
    </svg>
  ),
};

export function EquipmentIcon({ slotId, tier, size = 24 }: Props) {
  const color = tier ? TIER_COLOR[tier] : EMPTY_COLOR;
  const iconFn = SLOT_ICONS[slotId];

  if (!iconFn) {
    return <span style={{ fontSize: size, lineHeight: 1 }}>⚙️</span>;
  }

  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      {iconFn(color)}
    </div>
  );
}
