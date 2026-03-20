// 이 파일이 하는 일: 상점 탭 — 장비 부위 탭, 등급별 목록, 구매 시 캐릭터 색상 변화
"use client";

import { useState } from "react";
import { EQUIPMENT_SLOTS, EQUIPMENT_TIERS, TIER_COLOR } from "@/lib/game/stats";
import { EquipmentIcon } from "@/components/character/EquipmentIcon";
import type { UserEquipment, EquipmentSlot, EquipmentTier } from "@/types/database";

interface Props {
  gold: number;
  equipment: UserEquipment;
  onPurchase: (slot: EquipmentSlot, tier: EquipmentTier, price: number) => Promise<void>;
}

export function ShopTab({ gold, equipment, onPurchase }: Props) {
  const [activeSlot, setActiveSlot] = useState<EquipmentSlot>("helmet");
  const [buying, setBuying] = useState(false);

  const currentTier = equipment[activeSlot];

  // 현재 등급의 인덱스 (null이면 -1)
  const currentTierIdx = currentTier
    ? EQUIPMENT_TIERS.findIndex((t) => t.id === currentTier)
    : -1;

  // 구매 가능한 다음 등급 인덱스 (순차 구매만 허용)
  const nextTierIdx = currentTierIdx + 1;

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

      {/* 선택한 부위 안내 */}
      <div className="flex items-center justify-center gap-2">
        <EquipmentIcon slotId={activeSlot} size={20} tier={currentTier} />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {EQUIPMENT_SLOTS.find((s) => s.id === activeSlot)?.label} 장비
        </span>
      </div>

      {/* 등급 목록 */}
      <div className="flex flex-col gap-3">
        {EQUIPMENT_TIERS.map((tier, idx) => {
          const isOwned = currentTierIdx >= idx;
          const isNext = idx === nextTierIdx;
          const canBuy = isNext && gold >= tier.price;

          return (
            <div
              key={tier.id}
              className={`bg-white dark:bg-[#242B24] rounded-2xl p-4 border transition-all ${
                isOwned
                  ? "border-gray-100 dark:border-gray-800 opacity-50"
                  : isNext
                  ? "border-[#9ABA9A] dark:border-[#3D5A3E]/50 shadow-sm"
                  : "border-gray-100 dark:border-gray-800 opacity-40"  // 잠긴 등급
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
                      onClick={() => handleBuy(tier.id, tier.price)}
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
