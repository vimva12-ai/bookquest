// 이 파일이 하는 일: 픽셀 캐릭터 + 장착 장비 오버레이 렌더링
// 캐릭터 이미지 위에 장비 아이콘을 신체 부위별 위치에 겹쳐 표시
import type { UserEquipment } from "@/types/database";

export type CharacterGender = "male" | "female";

interface Props {
  equipment: Partial<UserEquipment>;
  size?: number; // 기본 144px
  gender?: CharacterGender;
}

// 장비 부위별 위치 (size 기준 비율, x/y = 아이콘 중심 좌표)
//
// 스프라이트 해부학 기준 (캐릭터가 이미지 전체 높이를 거의 채움):
//   머리 상단 y≈5%,  머리 중심 y≈14%,  어깨 y≈26%
//   흉부 중심 y≈42%, 손목/손 y≈53%,    발목/발 y≈84%
//   좌팔(방패) x≈22%, 우팔(무기) x≈78%
//
// iconSize = size × 0.30 이므로 top = size×y − iconSize/2
// → y=0.15 이하면 size=144 기준 컨테이너 위로 약간 넘침 (overflow:visible 허용)
const EQUIPMENT_POSITIONS: Record<string, { x: number; y: number; z: number }> = {
  cloak:  { x: 0.50, y: 0.30, z: 1 }, // 망토: 어깨/등 (캐릭터 뒤에 배치)
  helmet: { x: 0.50, y: 0.14, z: 4 }, // 투구: 머리 중심
  armor:  { x: 0.50, y: 0.44, z: 3 }, // 갑옷: 흉부 중앙
  shield: { x: 0.22, y: 0.53, z: 3 }, // 방패: 왼손 (캐릭터 왼쪽)
  weapon: { x: 0.78, y: 0.53, z: 3 }, // 무기: 오른손 (캐릭터 오른쪽)
  boots:  { x: 0.50, y: 0.84, z: 3 }, // 신발: 발 중심
};

const SLOT_ORDER = ["cloak", "armor", "helmet", "shield", "weapon", "boots"] as const;

export function PixelCharacter({ equipment, size = 144, gender = "male" }: Props) {
  const charSrc = gender === "female"
    ? "/assets/sprites/char_female.png"
    : "/assets/sprites/char_male.png";

  // 장비 아이콘 크기: 컨테이너의 30% (최소 18px)
  const iconSize = Math.max(Math.round(size * 0.30), 18);

  return (
    <div
      style={{ width: size, height: size, position: "relative" }}
      aria-label="캐릭터"
    >
      {/* ── 캐릭터 베이스 이미지 (z=2) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={charSrc}
        alt={gender === "female" ? "여자 캐릭터" : "남자 캐릭터"}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          objectFit: "contain",
          zIndex: 2,
        }}
        draggable={false}
      />

      {/* ── 장비 아이콘 오버레이 ── */}
      {SLOT_ORDER.map((slot) => {
        const tier = equipment[slot as keyof typeof equipment];
        if (!tier) return null;
        const pos = EQUIPMENT_POSITIONS[slot];
        if (!pos) return null;

        const left = Math.round(size * pos.x - iconSize / 2);
        const top  = Math.round(size * pos.y - iconSize / 2);

        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slot}
            src={`/assets/sprites/${slot}_${tier}.png`}
            alt={`${slot} ${tier}`}
            style={{
              position: "absolute",
              left,
              top,
              width: iconSize,
              height: iconSize,
              imageRendering: "pixelated",
              objectFit: "contain",
              zIndex: pos.z,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
            }}
            draggable={false}
          />
        );
      })}
    </div>
  );
}
