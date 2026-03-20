// 이 파일이 하는 일: 장비 부위별 픽셀아트 아이콘 (30 Free Icons 스프라이트시트 크롭)
// Armor.png / Weapons.png: 128×32px, 각 32×32 아이콘 4개

interface Props {
  slotId: string;
  size?: number;
}

// 30 Free Icons 스프라이트시트 매핑
// Armor.png (128×32): 투구(0) / 갑옷(32) / 망토(64) / 신발(96)
// Weapons.png (128×32): 무기(0) / 방패(32)
const SLOT_MAP: Record<string, { sheet: string; offsetX: number }> = {
  helmet: { sheet: "/assets/equipment/30FreeIcons/Armor.png",   offsetX: 0  },
  armor:  { sheet: "/assets/equipment/30FreeIcons/Armor.png",   offsetX: 32 },
  cloak:  { sheet: "/assets/equipment/30FreeIcons/Armor.png",   offsetX: 64 },
  boots:  { sheet: "/assets/equipment/30FreeIcons/Armor.png",   offsetX: 96 },
  weapon: { sheet: "/assets/equipment/30FreeIcons/Weapons.png", offsetX: 0  },
  shield: { sheet: "/assets/equipment/30FreeIcons/Weapons.png", offsetX: 32 },
};

// 폴백 이모지 (이미지 로드 실패 시)
const FALLBACK: Record<string, string> = {
  helmet: "⛑️", armor: "🛡️", cloak: "🧣", weapon: "⚔️", shield: "🔰", boots: "👢",
};

export function EquipmentIcon({ slotId, size = 24 }: Props) {
  const info = SLOT_MAP[slotId];
  if (!info) return <span style={{ fontSize: size }}>{FALLBACK[slotId] ?? "⚙️"}</span>;

  const scale = size / 32;

  return (
    <div
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={info.sheet}
        alt={slotId}
        style={{
          imageRendering: "pixelated",
          width: 128 * scale,
          height: 32 * scale,
          position: "absolute",
          top: 0,
          left: -(info.offsetX * scale),
        }}
      />
    </div>
  );
}
