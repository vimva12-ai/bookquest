// 이 파일이 하는 일: LPC 레이어드 스프라이트 — 장비 등급에 따라 실제 갑옷/투구/신발 레이어를 겹쳐 표시
import { EQUIPMENT_TIERS } from "@/lib/game/stats";
import type { UserEquipment } from "@/types/database";

interface Props {
  equipment: Partial<UserEquipment>;
  size?: number; // 기본 144px
}

const BASE = "/assets/characters/lpc_entry/png/walkcycle";

// LPC 스프라이트 시트: 576×256, 64×64 프레임, 9열 × 4행
// 행 순서: 0=북(위), 1=서(좌), 2=남(아래←플레이어 방향), 3=동(우)
// 열 0 = Idle/Stand 프레임
const SHEET_W = 576;
const SHEET_H = 256;
const FRAME = 64;
const SOUTH_ROW = 2; // 플레이어를 향하는 방향

function tierIdx(tier: string | null | undefined): number {
  if (!tier) return -1;
  return EQUIPMENT_TIERS.findIndex((t) => t.id === tier);
}

function getCharacterLayers(equipment: Partial<UserEquipment>): string[] {
  const layers: string[] = [];

  // ── 항상 표시 ──
  layers.push(`${BASE}/BODY_male.png`);
  layers.push(`${BASE}/LEGS_pants_greenish.png`);
  layers.push(`${BASE}/TORSO_leather_armor_shirt_white.png`);
  layers.push(`${BASE}/HEAD_hair_blonde.png`);

  // ── 갑옷 (armor) ──
  const armorIdx = tierIdx(equipment.armor);
  if (armorIdx >= 3) {
    // gold+: 플레이트
    layers.push(`${BASE}/TORSO_plate_armor_torso.png`);
    layers.push(`${BASE}/TORSO_plate_armor_arms_shoulders.png`);
    layers.push(`${BASE}/LEGS_plate_armor_pants.png`);
  } else if (armorIdx >= 2) {
    // silver: 체인
    layers.push(`${BASE}/TORSO_chain_armor_torso.png`);
    layers.push(`${BASE}/TORSO_leather_armor_bracers.png`);
  } else if (armorIdx >= 0) {
    // iron/bronze: 레더
    layers.push(`${BASE}/TORSO_leather_armor_torso.png`);
    layers.push(`${BASE}/TORSO_leather_armor_shoulders.png`);
  }

  // ── 망토 → 벨트로 표현 ──
  if (equipment.cloak) {
    const idx = tierIdx(equipment.cloak);
    layers.push(idx >= 2 ? `${BASE}/BELT_rope.png` : `${BASE}/BELT_leather.png`);
  }

  // ── 신발 (boots) ──
  const bootsIdx = tierIdx(equipment.boots);
  if (bootsIdx >= 2) {
    layers.push(`${BASE}/FEET_plate_armor_shoes.png`);
  } else if (bootsIdx >= 0) {
    layers.push(`${BASE}/FEET_shoes_brown.png`);
  }

  // ── 투구 (helmet) ──
  const helmetIdx = tierIdx(equipment.helmet);
  if (helmetIdx >= 4) {
    layers.push(`${BASE}/HEAD_plate_armor_helmet.png`);
  } else if (helmetIdx >= 2) {
    layers.push(`${BASE}/HEAD_chain_armor_helmet.png`);
  } else if (helmetIdx >= 0) {
    layers.push(`${BASE}/HEAD_leather_armor_hat.png`);
  }

  // ── 방패 ──
  if (equipment.shield) {
    layers.push(`${BASE}/WEAPON_shield_cutout_body.png`);
  }

  return layers;
}

// platinum/master/challenger는 filter로 색조 변환
function getTierFilter(equipment: Partial<UserEquipment>): string | undefined {
  // 가장 높은 등급 찾기
  const allTiers = ["helmet", "armor", "cloak", "weapon", "shield", "boots"] as const;
  let max = -1;
  for (const slot of allTiers) {
    const idx = tierIdx(equipment[slot] as string | null | undefined);
    if (idx > max) max = idx;
  }
  // 4=platinum, 5=master, 6=challenger
  if (max === 4) return "hue-rotate(180deg) saturate(1.5)";   // 파란 계열
  if (max === 5) return "hue-rotate(270deg) saturate(1.5)";   // 보라 계열
  if (max === 6) return "hue-rotate(320deg) saturate(2)";     // 붉은 계열
  return undefined;
}

export function PixelCharacter({ equipment, size = 144 }: Props) {
  const layers = getCharacterLayers(equipment);
  const scale = size / FRAME;
  const tierFilter = getTierFilter(equipment);

  // 남쪽 방향 Idle 프레임 위치
  const bgX = 0;
  const bgY = -(SOUTH_ROW * FRAME * scale);

  return (
    <div
      style={{ width: size, height: size, position: "relative", filter: tierFilter }}
      aria-label="캐릭터"
    >
      {layers.map((src, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: `${SHEET_W * scale}px ${SHEET_H * scale}px`,
            backgroundPosition: `${bgX}px ${bgY}px`,
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }}
        />
      ))}
    </div>
  );
}
