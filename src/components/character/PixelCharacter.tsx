// 이 파일이 하는 일: 새 픽셀 캐릭터 스프라이트 렌더링 — 성별에 따라 다른 이미지 사용
import type { UserEquipment } from "@/types/database";

export type CharacterGender = "male" | "female";

interface Props {
  equipment: Partial<UserEquipment>;
  size?: number; // 기본 144px
  gender?: CharacterGender;
}

export function PixelCharacter({ size = 144, gender = "male" }: Props) {
  const src = gender === "female"
    ? "/assets/sprites/char_female.png"
    : "/assets/sprites/char_male.png";

  return (
    <div
      style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
      aria-label="캐릭터"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={gender === "female" ? "여자 캐릭터" : "남자 캐릭터"}
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
