// 이 파일이 하는 일: 장비 등급에 따라 색상이 바뀌는 도트 픽셀 캐릭터 SVG
// 프로토타입 v3의 CutePixelCharacter를 TypeScript + props 방식으로 재구현
import { TIER_COLOR } from "@/lib/game/stats";
import type { UserEquipment } from "@/types/database";

interface Props {
  equipment: Partial<UserEquipment>;
  size?: number; // 기본 144px (SVG viewBox 32×36 기준)
}

export function PixelCharacter({ equipment, size = 144 }: Props) {
  // 장비가 없으면 기본 색상 사용
  const helmetColor  = equipment.helmet  ? TIER_COLOR[equipment.helmet]  : "#C5CAE9";
  const armorColor   = equipment.armor   ? TIER_COLOR[equipment.armor]   : "#7986CB";
  const cloakColor   = equipment.cloak   ? TIER_COLOR[equipment.cloak]   : null;
  const weaponColor  = equipment.weapon  ? TIER_COLOR[equipment.weapon]  : null;
  const shieldColor  = equipment.shield  ? TIER_COLOR[equipment.shield]  : null;
  const bootsColor   = equipment.boots   ? TIER_COLOR[equipment.boots]   : "#8D6E63";

  const height = Math.round(size * 1.125); // 32:36 비율 유지

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 32 36"
      className="pixel-art"
      aria-label="캐릭터"
    >
      {/* 그림자 */}
      <ellipse cx="16" cy="34" rx="7" ry="2" fill="#00000015" />

      {/* 망토 (cloakColor가 있을 때만) */}
      {cloakColor && (
        <>
          <rect x="5"  y="15" width="3" height="10" fill={cloakColor} />
          <rect x="4"  y="17" width="2" height="7"  fill={cloakColor} opacity="0.7" />
          <rect x="24" y="15" width="3" height="10" fill={cloakColor} />
          <rect x="26" y="17" width="2" height="7"  fill={cloakColor} opacity="0.7" />
          <rect x="4"  y="24" width="3" height="2"  fill={cloakColor} opacity="0.5" />
          <rect x="25" y="24" width="3" height="2"  fill={cloakColor} opacity="0.5" />
        </>
      )}

      {/* 투구 */}
      <rect x="10" y="2"  width="12" height="3" fill={helmetColor} />
      <rect x="9"  y="4"  width="14" height="3" fill={helmetColor} />
      <rect x="8"  y="6"  width="16" height="1" fill={helmetColor} />
      {/* 투구 장식 */}
      <rect x="14" y="3"  width="4" height="2" fill="#FF8A80" />
      <rect x="15" y="3"  width="2" height="1" fill="#FFCDD2" />
      <rect x="8"  y="6"  width="2" height="2" fill="#FFB74D" />
      <rect x="22" y="6"  width="2" height="2" fill="#FFB74D" />

      {/* 얼굴 */}
      <rect x="9"  y="7"  width="14" height="9" fill="#FFCC80" />
      <rect x="8"  y="8"  width="16" height="7" fill="#FFCC80" />
      {/* 눈 */}
      <rect x="11" y="10" width="3" height="3" fill="#37474F" />
      <rect x="18" y="10" width="3" height="3" fill="#37474F" />
      {/* 눈 하이라이트 */}
      <rect x="11" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="18" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="13" y="12" width="1" height="1" fill="#BBDEFB" />
      <rect x="20" y="12" width="1" height="1" fill="#BBDEFB" />
      {/* 볼터치 */}
      <rect x="9"  y="13" width="2" height="1" fill="#FF8A80" opacity="0.5" />
      <rect x="21" y="13" width="2" height="1" fill="#FF8A80" opacity="0.5" />
      {/* 입 */}
      <rect x="14" y="14" width="1" height="1" fill="#E65100" />
      <rect x="17" y="14" width="1" height="1" fill="#E65100" />
      <rect x="15" y="15" width="2" height="1" fill="#E65100" />

      {/* 갑옷 몸통 */}
      <rect x="9"  y="16" width="14" height="9" fill={armorColor} />
      <rect x="8"  y="17" width="16" height="7" fill={armorColor} />
      {/* 갑옷 장식 */}
      <rect x="13" y="17" width="6" height="1" fill="#FFFFFF" opacity="0.25" />
      <rect x="14" y="19" width="4" height="3" fill="#FFFFFF" opacity="0.1" />
      {/* 벨트 */}
      <rect x="9"  y="23" width="14" height="2" fill="#5D4037" />
      <rect x="15" y="23" width="2" height="2" fill="#FFD54F" />

      {/* 팔 */}
      <rect x="6" y="17" width="3" height="7" fill="#FFCC80" />
      <rect x="23" y="17" width="3" height="7" fill="#FFCC80" />

      {/* 무기 (weaponColor가 있을 때) */}
      {weaponColor && (
        <>
          <rect x="3" y="12" width="2" height="14" fill={weaponColor} />
          <rect x="2" y="12" width="4" height="2"  fill={weaponColor} opacity="0.8" />
          <rect x="3" y="11" width="2" height="2"  fill="#FFD54F" />
        </>
      )}

      {/* 방패 (shieldColor가 있을 때) */}
      {shieldColor && (
        <>
          <rect x="27" y="14" width="4" height="6" fill={shieldColor} />
          <rect x="26" y="15" width="5" height="4" fill={shieldColor} opacity="0.9" />
          <rect x="28" y="16" width="2" height="2" fill="#FFFFFF" opacity="0.4" />
        </>
      )}

      {/* 신발 */}
      <rect x="10" y="25" width="5" height="3" fill={bootsColor} />
      <rect x="17" y="25" width="5" height="3" fill={bootsColor} />
      <rect x="9"  y="27" width="6" height="2" fill={bootsColor} />
      <rect x="17" y="27" width="6" height="2" fill={bootsColor} />
    </svg>
  );
}
