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
      {/* ── 망토 SVG (맨 뒤, z-0) — 어깨에 밀착된 망토 ── */}
      {cloakColor && (
        <svg
          viewBox="0 0 64 64"
          shapeRendering="crispEdges"
          style={{
            position: "absolute",
            inset: 0,
            width: size,
            height: size,
            zIndex: 0,
          }}
        >
          {/* ─ 왼쪽 자락 (y=32 시작, 윗부분 둥글게 테이퍼링) ─ */}
          <rect x="20" y="32" width="2" height="1" fill={cloakColor} />
          <rect x="19" y="33" width="3" height="1" fill={cloakColor} />
          <rect x="18" y="34" width="4" height="1" fill={cloakColor} />
          <rect x="17" y="35" width="5" height="2" fill={cloakColor} opacity={0.95} />
          <rect x="16" y="37" width="5" height="3" fill={cloakColor} opacity={0.9} />
          <rect x="15" y="40" width="6" height="3" fill={cloakColor} opacity={0.85} />
          <rect x="14" y="43" width="7" height="4" fill={cloakColor} opacity={0.85} />
          <rect x="14" y="47" width="7" height="3" fill={cloakColor} opacity={0.8} />
          <rect x="14" y="50" width="7" height="3" fill={cloakColor} opacity={0.8} />
          <rect x="14" y="53" width="7" height="2" fill={cloakColor} opacity={0.75} />
          <rect x="15" y="55" width="6" height="2" fill={cloakColor} opacity={0.7} />
          <rect x="16" y="57" width="5" height="1" fill={cloakColor} opacity={0.6} />
          {/* 왼쪽 주름 하이라이트 */}
          <rect x="20" y="35" width="1" height="10" fill="white" opacity={0.18} />
          <rect x="19" y="45" width="1" height="8" fill="white" opacity={0.12} />
          {/* 왼쪽 주름 그림자 */}
          <rect x="16" y="37" width="1" height="16" fill="black" opacity={0.12} />

          {/* ─ 오른쪽 자락 (y=32 시작, 윗부분 둥글게 테이퍼링) ─ */}
          <rect x="42" y="32" width="2" height="1" fill={cloakColor} />
          <rect x="42" y="33" width="3" height="1" fill={cloakColor} />
          <rect x="42" y="34" width="4" height="1" fill={cloakColor} />
          <rect x="42" y="35" width="5" height="2" fill={cloakColor} opacity={0.95} />
          <rect x="43" y="37" width="5" height="3" fill={cloakColor} opacity={0.9} />
          <rect x="43" y="40" width="6" height="3" fill={cloakColor} opacity={0.85} />
          <rect x="43" y="43" width="7" height="4" fill={cloakColor} opacity={0.85} />
          <rect x="43" y="47" width="7" height="3" fill={cloakColor} opacity={0.8} />
          <rect x="43" y="50" width="7" height="3" fill={cloakColor} opacity={0.8} />
          <rect x="43" y="53" width="7" height="2" fill={cloakColor} opacity={0.75} />
          <rect x="43" y="55" width="6" height="2" fill={cloakColor} opacity={0.7} />
          <rect x="43" y="57" width="5" height="1" fill={cloakColor} opacity={0.6} />
          {/* 오른쪽 주름 그림자 */}
          <rect x="42" y="35" width="1" height="8" fill="black" opacity={0.15} />
          <rect x="44" y="43" width="1" height="14" fill="black" opacity={0.1} />
          {/* 오른쪽 주름 하이라이트 */}
          <rect x="48" y="43" width="1" height="14" fill="white" opacity={0.1} />

          {/* ─ 뒤쪽 밑단 (몸 아래로 보이는 부분, 발끝까지) ─ */}
          <rect x="22" y="52" width="20" height="3" fill={cloakColor} opacity={0.4} />
          <rect x="23" y="55" width="18" height="2" fill={cloakColor} opacity={0.35} />
          <rect x="24" y="57" width="16" height="1" fill={cloakColor} opacity={0.25} />
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

      {/* ── 무기 SVG (맨 앞) — 오른손(x≈21-23, y≈37-40)에 쥔 롱소드, 전체 +6px ── */}
      {weaponColor && (
        <svg
          viewBox="0 0 64 64"
          shapeRendering="crispEdges"
          style={{
            position: "absolute",
            inset: 0,
            width: size,
            height: size,
            zIndex: layers.length + 1,
          }}
        >
          {/* ─ 칼날 끝 (뾰족한 팁) ─ */}
          <rect x="20" y="15" width="1" height="2" fill={weaponColor} />
          <rect x="19" y="17" width="3" height="2" fill={weaponColor} />

          {/* ─ 칼날 몸체 (3px 너비) ─ */}
          <rect x="19" y="19" width="3" height="17" fill={weaponColor} />
          {/* 칼날 왼쪽 날 하이라이트 */}
          <rect x="19" y="19" width="1" height="17" fill="white" opacity={0.3} />
          {/* 칼날 오른쪽 그림자 */}
          <rect x="21" y="19" width="1" height="17" fill="black" opacity={0.15} />
          {/* 혈조 (fullerㅡ중앙 홈) */}
          <rect x="20" y="20" width="1" height="14" fill="white" opacity={0.12} />
          {/* 칼날 하단 넓어지는 부분 */}
          <rect x="18" y="36" width="5" height="2" fill={weaponColor} />
          <rect x="18" y="36" width="1" height="2" fill="white" opacity={0.2} />
          <rect x="22" y="36" width="1" height="2" fill="black" opacity={0.12} />

          {/* ─ 크로스가드 (장식적인 십자 가드) ─ */}
          <rect x="14" y="38" width="13" height="2" fill={weaponColor} opacity={0.95} />
          {/* 가드 윗면 하이라이트 */}
          <rect x="14" y="38" width="13" height="1" fill="white" opacity={0.25} />
          {/* 가드 양끝 장식 */}
          <rect x="13" y="38" width="1" height="2" fill={weaponColor} opacity={0.7} />
          <rect x="27" y="38" width="1" height="2" fill={weaponColor} opacity={0.7} />
          {/* 가드 중앙 보석 */}
          <rect x="20" y="38" width="1" height="2" fill="white" opacity={0.3} />

          {/* ─ 그립 (손 위치에 맞춤, 가죽 감기 패턴) ─ */}
          <rect x="19" y="40" width="3" height="1" fill="#4A2E14" />
          <rect x="19" y="41" width="3" height="1" fill="#6B4423" />
          <rect x="19" y="42" width="3" height="1" fill="#4A2E14" />
          <rect x="19" y="43" width="3" height="1" fill="#6B4423" />
          <rect x="19" y="44" width="3" height="1" fill="#4A2E14" />
          <rect x="19" y="45" width="3" height="1" fill="#6B4423" />
          <rect x="19" y="46" width="3" height="1" fill="#4A2E14" />
          {/* 그립 왼쪽 하이라이트 */}
          <rect x="19" y="40" width="1" height="7" fill="white" opacity={0.08} />

          {/* ─ 폼멜 (손잡이 끝 장식) ─ */}
          <rect x="18" y="47" width="5" height="2" fill={weaponColor} opacity={0.85} />
          <rect x="19" y="49" width="3" height="1" fill={weaponColor} opacity={0.65} />
          {/* 폼멜 하이라이트 */}
          <rect x="18" y="47" width="5" height="1" fill="white" opacity={0.2} />
          <rect x="20" y="47" width="1" height="1" fill="white" opacity={0.15} />
        </svg>
      )}
    </div>
  );
}
