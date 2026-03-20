// 이 파일이 하는 일: LPC 레이어드 스프라이트 — 슬롯당 고정 형태 + 등급별 색상 필터, 망토·무기는 SVG
import { TIER_COLOR } from "@/lib/game/stats";
import type { UserEquipment, EquipmentTier } from "@/types/database";

interface Props {
  equipment: Partial<UserEquipment>;
  size?: number; // 기본 144px
}

const BASE = "/assets/characters/lpc_entry/png/walkcycle";

// LPC 스프라이트 시트: 576×256, 64×64 프레임, 9열 × 4행
const SHEET_W = 576;
const SHEET_H = 256;
const FRAME = 64;
const SOUTH_ROW = 2;

// 등급별 CSS 필터 — 각 장비 레이어에 개별 적용하여 등급 색상 표현
function getSlotTierFilter(tier: string): string {
  switch (tier) {
    case "iron":       return "grayscale(1) brightness(0.85)";
    case "bronze":     return "sepia(0.5) saturate(1.3) brightness(0.9)";
    case "silver":     return "saturate(0.3) brightness(1.15) hue-rotate(180deg)";
    case "gold":       return "sepia(0.8) saturate(3) hue-rotate(5deg) brightness(1.15)";
    case "platinum":   return "sepia(1) saturate(3) hue-rotate(170deg) brightness(1.3)";
    case "master":     return "sepia(1) saturate(3) hue-rotate(240deg) brightness(1.05)";
    case "challenger": return "sepia(1) saturate(4) hue-rotate(330deg) brightness(1.15)";
    default:           return "";
  }
}

interface SpriteLayer {
  src: string;
  filter?: string;
}

function getCharacterLayers(equipment: Partial<UserEquipment>): SpriteLayer[] {
  const layers: SpriteLayer[] = [];

  // ── 기본 몸체 (항상 표시) ──
  layers.push({ src: `${BASE}/BODY_male.png` });
  layers.push({ src: `${BASE}/LEGS_pants_greenish.png` });
  layers.push({ src: `${BASE}/TORSO_leather_armor_shirt_white.png` });
  layers.push({ src: `${BASE}/HEAD_hair_blonde.png` });

  // ── 갑옷: 플레이트 세트 고정, 등급색 필터 ──
  if (equipment.armor) {
    const f = getSlotTierFilter(equipment.armor);
    layers.push({ src: `${BASE}/TORSO_plate_armor_torso.png`, filter: f });
    layers.push({ src: `${BASE}/TORSO_plate_armor_arms_shoulders.png`, filter: f });
    layers.push({ src: `${BASE}/LEGS_plate_armor_pants.png`, filter: f });
  }

  // ── 신발: 플레이트 슈즈 고정, 등급색 필터 ──
  if (equipment.boots) {
    const f = getSlotTierFilter(equipment.boots);
    layers.push({ src: `${BASE}/FEET_plate_armor_shoes.png`, filter: f });
  }

  // ── 투구: 플레이트 헬멧 고정, 등급색 필터 ──
  if (equipment.helmet) {
    const f = getSlotTierFilter(equipment.helmet);
    layers.push({ src: `${BASE}/HEAD_plate_armor_helmet.png`, filter: f });
  }

  // ── 방패: 고정 방패, 등급색 필터 ──
  if (equipment.shield) {
    const f = getSlotTierFilter(equipment.shield);
    layers.push({ src: `${BASE}/WEAPON_shield_cutout_body.png`, filter: f });
  }

  // 망토·무기는 SVG로 별도 렌더링
  return layers;
}

export function PixelCharacter({ equipment, size = 144 }: Props) {
  const layers = getCharacterLayers(equipment);
  const scale = size / FRAME;

  const bgX = 0;
  const bgY = -(SOUTH_ROW * FRAME * scale);

  const cloakTier = equipment.cloak as EquipmentTier | null | undefined;
  const weaponTier = equipment.weapon as EquipmentTier | null | undefined;
  const cloakColor = cloakTier ? TIER_COLOR[cloakTier] : null;
  const weaponColor = weaponTier ? TIER_COLOR[weaponTier] : null;

  return (
    <div
      style={{ width: size, height: size, position: "relative" }}
      aria-label="캐릭터"
    >
      {/* ── 망토 SVG (맨 뒤, z-0) ── */}
      {cloakColor && (
        <svg
          viewBox="0 0 64 64"
          style={{
            position: "absolute",
            inset: 0,
            width: size,
            height: size,
            zIndex: 0,
          }}
        >
          {/* 왼쪽 자락 */}
          <path
            d="M 21 24 L 12 52 L 24 47 Z"
            fill={cloakColor}
            opacity={0.85}
          />
          {/* 오른쪽 자락 */}
          <path
            d="M 43 24 L 52 52 L 40 47 Z"
            fill={cloakColor}
            opacity={0.85}
          />
          {/* 뒤쪽 (몸 사이로 살짝 보임) */}
          <rect
            x="23" y="30" width="18" height="20" rx="2"
            fill={cloakColor}
            opacity={0.25}
          />
          {/* 어깨 걸이 */}
          <rect
            x="20" y="22" width="24" height="4" rx="2"
            fill={cloakColor}
            opacity={0.6}
          />
        </svg>
      )}

      {/* ── 스프라이트 레이어 ── */}
      {layers.map((layer, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${layer.src})`,
            backgroundSize: `${SHEET_W * scale}px ${SHEET_H * scale}px`,
            backgroundPosition: `${bgX}px ${bgY}px`,
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
            filter: layer.filter,
            zIndex: i + 1,
          }}
        />
      ))}

      {/* ── 무기 SVG (맨 앞) ── */}
      {weaponColor && (
        <svg
          viewBox="0 0 64 64"
          style={{
            position: "absolute",
            inset: 0,
            width: size,
            height: size,
            zIndex: layers.length + 1,
          }}
        >
          <g transform="rotate(-20, 17, 36)">
            {/* 칼날 */}
            <rect
              x="15" y="14" width="4" height="24" rx="1"
              fill={weaponColor}
            />
            {/* 칼날 하이라이트 */}
            <rect
              x="18" y="16" width="1" height="20"
              fill="white" opacity={0.35}
            />
            {/* 칼날 끝 (삼각형) */}
            <polygon
              points="15,14 19,14 17,10"
              fill={weaponColor}
            />
            {/* 가드 */}
            <rect
              x="11" y="38" width="12" height="3" rx="1"
              fill={weaponColor} opacity={0.85}
            />
            {/* 그립 */}
            <rect
              x="15" y="41" width="4" height="8" rx="1"
              fill="#6B4423"
            />
            {/* 폼멜 */}
            <circle
              cx="17" cy="50" r="2.5"
              fill={weaponColor} opacity={0.7}
            />
          </g>
        </svg>
      )}
    </div>
  );
}
