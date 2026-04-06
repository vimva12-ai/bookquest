// 이 파일이 하는 일: 장비 슬롯별 픽셀아트 아이콘 — 스프라이트 PNG 사용, 미장착 시 SVG 플레이스홀더
import type { EquipmentTier } from "@/types/database";

interface Props {
  slotId: string;
  tier?: EquipmentTier | null;
  size?: number;
}

// 미장착 슬롯용 SVG 플레이스홀더 (회색)
const EMPTY_COLOR = "#C8D0C8";

type PlaceholderFn = () => React.ReactElement;

const SLOT_PLACEHOLDERS: Record<string, PlaceholderFn> = {
  helmet: () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C7.6 2 4 5.6 4 9.5V12H20V9.5C20 5.6 16.4 2 12 2Z" fill={EMPTY_COLOR} />
      <path d="M4 12H20V15C20 16.1 19.1 17 18 17H6C4.9 17 4 16.1 4 15V12Z" fill={EMPTY_COLOR} opacity={0.85} />
      <rect x="8" y="13.5" width="8" height="2" rx="1" fill="rgba(0,0,0,0.15)" />
    </svg>
  ),
  armor: () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8C3 8 5 5 8 5H16C19 5 21 8 21 8L19 10H5L3 8Z" fill={EMPTY_COLOR} />
      <path d="M5 10H19V17C19 19 17 21 14 21H10C7 21 5 19 5 17V10Z" fill={EMPTY_COLOR} opacity={0.9} />
      <line x1="12" y1="10" x2="12" y2="21" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
    </svg>
  ),
  cloak: () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 3H15L16 6H8L9 3Z" fill={EMPTY_COLOR} />
      <path d="M8 6L3 10V20L8 18V6Z" fill={EMPTY_COLOR} opacity={0.75} />
      <path d="M16 6L21 10V20L16 18V6Z" fill={EMPTY_COLOR} opacity={0.75} />
      <path d="M8 6H16V18L12 21L8 18V6Z" fill={EMPTY_COLOR} />
    </svg>
  ),
  weapon: () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L10 16H14L12 2Z" fill={EMPTY_COLOR} />
      <rect x="7" y="16" width="10" height="2.5" rx="1.25" fill={EMPTY_COLOR} opacity={0.85} />
      <rect x="11" y="18.5" width="2" height="3.5" rx="1" fill={EMPTY_COLOR} opacity={0.75} />
    </svg>
  ),
  shield: () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 6.5V13C3 17.5 6.5 21 12 22.5C17.5 21 21 17.5 21 13V6.5L12 2Z" fill={EMPTY_COLOR} />
      <rect x="11" y="9" width="2" height="7" rx="0.5" fill="rgba(0,0,0,0.12)" />
      <rect x="8.5" y="11.5" width="7" height="2" rx="0.5" fill="rgba(0,0,0,0.12)" />
    </svg>
  ),
  boots: () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="2" width="6" height="9" rx="1.5" fill={EMPTY_COLOR} />
      <rect x="8" y="11" width="6" height="3" fill={EMPTY_COLOR} />
      <path d="M8 14H17C17 14 17 16 16 17H8V14Z" fill={EMPTY_COLOR} opacity={0.9} />
      <rect x="7" y="17" width="11" height="2.5" rx="1" fill={EMPTY_COLOR} opacity={0.7} />
    </svg>
  ),
};

export function EquipmentIcon({ slotId, tier, size = 24 }: Props) {
  if (tier) {
    // 장착 중: 스프라이트 PNG 사용
    const src = `/assets/sprites/${slotId}_${tier}.png`;
    return (
      <div style={{ width: size, height: size, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${slotId} ${tier}`}
          style={{
            maxWidth: size,
            maxHeight: size,
            imageRendering: "pixelated",
            objectFit: "contain",
          }}
          draggable={false}
        />
      </div>
    );
  }

  // 미장착: SVG 플레이스홀더
  const placeholder = SLOT_PLACEHOLDERS[slotId];
  if (!placeholder) {
    return <span style={{ fontSize: size, lineHeight: 1 }}>⚙️</span>;
  }

  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      {placeholder()}
    </div>
  );
}
