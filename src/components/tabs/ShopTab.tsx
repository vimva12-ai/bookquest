// 이 파일이 하는 일: 상점 탭 — 장비 부위 탭, 등급별 목록, 구매 시 캐릭터 색상 변화, 미리보기
"use client";

import { useState, useEffect } from "react";
import { EQUIPMENT_SLOTS, EQUIPMENT_TIERS, TIER_COLOR } from "@/lib/game/stats";
import { EquipmentIcon } from "@/components/character/EquipmentIcon";
import { PixelCharacter } from "@/components/character/PixelCharacter";
import type { UserEquipment, EquipmentSlot, EquipmentTier } from "@/types/database";

interface Props {
  gold: number;
  equipment: UserEquipment;
  onPurchase: (slot: EquipmentSlot, tier: EquipmentTier, price: number) => Promise<void>;
}

export function ShopTab({ gold, equipment, onPurchase }: Props) {
  const [activeSlot, setActiveSlot] = useState<EquipmentSlot>("helmet");
  const [buying, setBuying] = useState(false);
  const [previewTier, setPreviewTier] = useState<EquipmentTier | null>(equipment[activeSlot]);

  // 슬롯 변경 시 미리보기를 현재 장착 등급으로 리셋
  useEffect(() => {
    setPreviewTier(equipment[activeSlot]);
  }, [activeSlot, equipment]);

  const currentTier = equipment[activeSlot];
  const currentTierIdx = currentTier
    ? EQUIPMENT_TIERS.findIndex((t) => t.id === currentTier)
    : -1;
  const nextTierIdx = currentTierIdx + 1;

  // 미리보기용 장비: 현재 장비에서 선택 부위만 previewTier로 교체
  const previewEquipment: Partial<UserEquipment> = { ...equipment, [activeSlot]: previewTier };

  const previewTierInfo = previewTier ? EQUIPMENT_TIERS.find((t) => t.id === previewTier) : null;
  const activeSlotLabel = EQUIPMENT_SLOTS.find((s) => s.id === activeSlot)?.label ?? "";

  async function handleBuy(tier: EquipmentTier, price: number) {
    if (gold < price || buying) return;
    setBuying(true);
    await onPurchase(activeSlot, tier, price);
    setBuying(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 보유 골드 */}
      <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 rounded-2xl px-4 py-3 border border-amber-100 dark:border-amber-800/30">
        <span className="text-sm font-medium text-amber-800 dark:text-amber-400">보유 골드</span>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🪙</span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {gold.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 장비 부위 탭 */}
      <div className="grid grid-cols-3 gap-2">
        {EQUIPMENT_SLOTS.map((slot) => {
          const equippedTier = equipment[slot.id as EquipmentSlot];
          const tierInfo = equippedTier ? EQUIPMENT_TIERS.find((t) => t.id === equippedTier) : null;
          const isActive = activeSlot === slot.id;

          return (
            <button
              key={slot.id}
              onClick={() => setActiveSlot(slot.id as EquipmentSlot)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                isActive
                  ? "border-[#5B8C5A] bg-[#EEF4EE] dark:bg-[#3D5A3E]/20"
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#242B24]"
              }`}
            >
              <EquipmentIcon slotId={slot.id} size={28} tier={equippedTier} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{slot.label}</span>
              {tierInfo ? (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: TIER_COLOR[tierInfo.id] }}
                >
                  {tierInfo.label}
                </span>
              ) : (
                <span className="text-[10px] text-gray-300 dark:text-gray-600">없음</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 캐릭터 미리보기 카드 */}
      <div className="bg-gradient-to-r from-[#EEF3EE] to-[#F5F5F0] dark:from-[#1F2A1F] dark:to-[#242B24] rounded-2xl p-3 border border-[#D4E4D4] dark:border-[#3D5A3E]/30 flex items-center gap-4">
        {/* 픽셀 캐릭터 */}
        <div className="shrink-0 flex items-center justify-center w-[72px] h-[72px]">
          <PixelCharacter equipment={previewEquipment} size={72} />
        </div>

        {/* 미리보기 정보 */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-1">
            👁 {activeSlotLabel} 미리보기
          </p>
          {previewTierInfo ? (
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: previewTierInfo.color }}
              >
                {previewTierInfo.label}
              </span>
              {previewTier === currentTier && (
                <span className="text-[10px] text-green-500 font-medium">✓ 장착 중</span>
              )}
              {previewTier !== currentTier && (
                <span className="text-[10px] text-amber-500 font-medium">미리보기</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">장비 없음</p>
          )}
          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5">
            아래 등급을 탭하면 미리볼 수 있어요
          </p>
        </div>
      </div>

      {/* 등급 목록 */}
      <div className="flex flex-col gap-3">
        {EQUIPMENT_TIERS.map((tier, idx) => {
          const isOwned = currentTierIdx >= idx;
          const isNext = idx === nextTierIdx;
          const canBuy = isNext && gold >= tier.price;
          const isPreviewing = previewTier === tier.id;

          return (
            <div
              key={tier.id}
              onClick={() => setPreviewTier(tier.id)}
              className={`bg-white dark:bg-[#242B24] rounded-2xl p-4 border transition-all cursor-pointer ${
                isPreviewing
                  ? "border-amber-300 dark:border-amber-600/50 shadow-sm ring-1 ring-amber-200 dark:ring-amber-700/30"
                  : isOwned
                  ? "border-gray-100 dark:border-gray-800 opacity-50"
                  : isNext
                  ? "border-[#9ABA9A] dark:border-[#3D5A3E]/50 shadow-sm"
                  : "border-gray-100 dark:border-gray-800 opacity-40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 등급 색상 뱃지 */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: tier.color }}
                  >
                    {tier.label[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: tier.color }}>
                      {tier.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{tier.desc}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-bold text-amber-500">
                    🪙 {tier.price.toLocaleString()}G
                  </span>

                  {isOwned ? (
                    <span className="text-xs text-green-500 font-medium">✓ 보유</span>
                  ) : isNext ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBuy(tier.id, tier.price); }}
                      disabled={!canBuy || buying}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all ${
                        canBuy
                          ? "bg-[#3D5A3E] hover:bg-[#2D4A2E] active:scale-95"
                          : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                      }`}
                    >
                      {buying ? "구매 중..." : canBuy ? "구매" : "골드 부족"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300 dark:text-gray-600">🔒 잠김</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 안내 */}
      <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
        장비는 순서대로만 구매 가능합니다 · 구매 즉시 장착
      </p>
    </div>
  );
}
