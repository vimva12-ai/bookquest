// 이 파일이 하는 일: 캐릭터 탭 — 레벨/EXP, 스탯, 장착 장비, 칭호 선택, 도트 픽셀 캐릭터
"use client";

import { useState } from "react";
import { PixelCharacter } from "@/components/character/PixelCharacter";
import { EquipmentIcon } from "@/components/character/EquipmentIcon";
import { GENRE_INFO, EQUIPMENT_SLOTS, TIER_COLOR, EQUIPMENT_TIERS } from "@/lib/game/stats";
import { getExpToNextLevel, getExpProgress } from "@/lib/game/exp";
import { ALL_TITLES, type TitleCheckContext } from "@/lib/game/titles";
import type { CharacterData, EquipmentTier } from "@/types/database";

// ─── 스탯 바 ────────────────────────────────────────────
function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const maxDisplay = Math.max(50, value);
  const percent = Math.min((value / maxDisplay) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-6 text-center">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
          <span className="font-bold" style={{ color }}>{value}</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

// ─── 칭호 선택 모달 ─────────────────────────────────────
function TitleModal({
  unlockedIds,
  selectedId,
  onSelect,
  onClose,
}: {
  unlockedIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const unlocked = ALL_TITLES.filter((t) => unlockedIds.includes(t.id));
  const locked = ALL_TITLES.filter((t) => !unlockedIds.includes(t.id));

  // 잠긴 칭호 중 진행도 가장 높은 4개 (힌트)
  const hints = locked.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#242B24] rounded-2xl p-5 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">칭호 선택</h2>

        {/* 해금된 칭호 */}
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">획득한 칭호</p>
        <div className="flex flex-col gap-2 mb-5">
          {unlocked.map((t) => (
            <button
              key={t.id}
              onClick={() => { onSelect(t.id); onClose(); }}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedId === t.id
                  ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                  : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: t.color }}>{t.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Tier {t.tier} · {t.condition}</p>
              </div>
              {selectedId === t.id && <span className="ml-auto text-amber-500 text-sm">✓ 착용 중</span>}
            </button>
          ))}
        </div>

        {/* 힌트 — 다음 칭호들 */}
        {hints.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 mb-2">다음 목표</p>
            <div className="flex flex-col gap-2">
              {hints.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 opacity-50">
                  <span className="text-xl grayscale">{t.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-400">🔒 {t.name}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600">{t.condition}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 캐릭터 탭 메인 ─────────────────────────────────────
interface Props {
  data: CharacterData;
  titleCtx: TitleCheckContext;
  onTitleChange: (titleId: string) => void;
}

export function CharacterTab({ data, titleCtx, onTitleChange }: Props) {
  const { profile, stats, equipment, titles } = data;
  const { level, exp, gold, selected_title_id } = profile;
  const [showTitleModal, setShowTitleModal] = useState(false);

  const expToNext = getExpToNextLevel(level);
  const expProgress = getExpProgress(exp, level);
  const expInLevel = Math.round(expProgress * expToNext);

  const unlockedIds = ["apprentice", ...titles.map((t) => t.title_id)];
  const selectedTitle = ALL_TITLES.find((t) => t.id === selected_title_id) ?? ALL_TITLES[0];

  return (
    <div className="flex flex-col gap-4">
      {/* ── 캐릭터 카드 ── */}
      <div className="bg-gradient-to-b from-[#EEF3EE] to-white dark:from-[#1F2A1F] dark:to-[#242B24] rounded-2xl p-5 border border-[#D4E4D4] dark:border-[#3D5A3E]/30 shadow-sm flex flex-col items-center gap-3">
        {/* 칭호 — 클릭 시 선택 모달 */}
        <button
          onClick={() => setShowTitleModal(true)}
          className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-full px-4 py-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
            {selectedTitle.icon} {selectedTitle.name} ✎
          </span>
        </button>

        {/* 픽셀 캐릭터 */}
        <PixelCharacter equipment={equipment} size={128} />

        {/* 레벨 */}
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">Lv. {level}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">총 {exp.toLocaleString()} EXP</p>
        </div>

        {/* EXP 바 */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
            <span>EXP</span>
            <span>{expInLevel} / {expToNext}</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${expProgress * 100}%`, background: "linear-gradient(90deg, #5B8C5A, #3D5A3E)" }}
            />
          </div>
        </div>

        {/* 골드 */}
        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-xl">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">{gold.toLocaleString()} Gold</span>
        </div>
      </div>

      {/* ── 스탯 카드 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm">📊 스탯</h3>
        <div className="flex flex-col gap-3">
          {(Object.entries(GENRE_INFO) as [keyof typeof GENRE_INFO, typeof GENRE_INFO[keyof typeof GENRE_INFO]][]).map(([key, info]) => (
            <StatBar key={key} label={info.stat} value={stats[key as keyof typeof stats] as number} color={info.color} icon={info.icon} />
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 text-center">
          해당 장르 50페이지 읽을 때마다 스탯 +1
        </p>
      </div>

      {/* ── 장착 장비 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm">⚔️ 장비</h3>
        <div className="grid grid-cols-3 gap-2">
          {EQUIPMENT_SLOTS.map((slot) => {
            const tier = equipment[slot.id as keyof typeof equipment] as EquipmentTier | null;
            const tierInfo = EQUIPMENT_TIERS.find((t) => t.id === tier);
            return (
              <div key={slot.id} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <EquipmentIcon slotId={slot.id} size={24} />
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{slot.label}</span>
                {tierInfo ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: TIER_COLOR[tierInfo.id] }}>
                    {tierInfo.label}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">없음</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 해금 칭호 목록 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-sm">
          🎖️ 획득한 칭호 <span className="text-gray-400 font-normal">({unlockedIds.length}개)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {unlockedIds.map((id) => {
            const t = ALL_TITLES.find((x) => x.id === id);
            if (!t) return null;
            return (
              <button
                key={id}
                onClick={() => { onTitleChange(id); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  selected_title_id === id
                    ? "text-white border-transparent"
                    : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                }`}
                style={selected_title_id === id ? { backgroundColor: t.color } : {}}
              >
                {t.icon} {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 성장 가이드 ── */}
      <div className="bg-[#F5EDE0] dark:bg-[#3A2E1A]/20 rounded-2xl p-4 border border-[#E8D4B8] dark:border-[#3A2E1A]/30">
        <h3 className="font-bold text-[#8B6F47] dark:text-[#A68B5B] mb-2 text-sm">💡 성장 가이드</h3>
        <ul className="text-xs text-[#8B6F47]/90 dark:text-[#A68B5B]/80 space-y-1 list-disc list-inside">
          <li>하루 40p 읽으면 약 1개월 안에 Lv.10 달성</li>
          <li>비문학 읽으면 지혜(WIS) +1 / 50p마다</li>
          <li>완독 시 EXP +50, 골드 +30 보너스!</li>
          <li>상점에서 장비를 사면 캐릭터 외견이 바뀌어요</li>
        </ul>
      </div>

      {/* 칭호 선택 모달 */}
      {showTitleModal && (
        <TitleModal
          unlockedIds={unlockedIds}
          selectedId={selected_title_id}
          onSelect={onTitleChange}
          onClose={() => setShowTitleModal(false)}
        />
      )}
    </div>
  );
}
