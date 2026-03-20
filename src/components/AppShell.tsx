// 이 파일이 하는 일: 전체 앱 UI 셸 — 헤더, 탭, 상태 관리, 게임 로직 연결
"use client";

import { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/ui/Header";
import { BottomNav, type TabId } from "@/components/ui/BottomNav";
import { LibraryTab } from "@/components/tabs/LibraryTab";
import { CharacterTab } from "@/components/tabs/CharacterTab";
import { ShopTab } from "@/components/tabs/ShopTab";
import { AchievementsTab } from "@/components/tabs/AchievementsTab";
import { QuestPanel } from "@/components/tabs/QuestPanel";
import { StatsTab } from "@/components/tabs/StatsTab";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getLevelFromExp } from "@/lib/game/exp";
import { PAGES_PER_STAT } from "@/lib/game/stats";
import {
  buildTitleContext,
  getNewlyUnlockedTitles,
} from "@/lib/game/titles";
import {
  generateQuests,
  DEFAULT_USER_READING_STATS,
} from "@/lib/game/quests";
import type { AchievementStats } from "@/lib/game/achievements";
import type {
  Book,
  CharacterData,
  EquipmentSlot,
  EquipmentTier,
  UserEquipment,
} from "@/types/database";

// Phase 3에서 구현할 탭 플레이스홀더
function PlaceholderTab({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-gray-400 dark:text-gray-600 gap-2">
      <span className="text-5xl">{icon}</span>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs">Phase 3에서 구현 예정</p>
    </div>
  );
}

interface Props {
  initialCharacter: CharacterData;
  initialBooks: Book[];
  userId: string;
}

export function AppShell({ initialCharacter, initialBooks, userId }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [activeTab, setActiveTab] = useState<TabId>("library");
  const [character, setCharacter] = useState(initialCharacter);
  const [books, setBooks] = useState(initialBooks);

  // 책 목록 새로고침
  const refreshBooks = useCallback(async () => {
    const { data } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setBooks(data as Book[]);
  }, [supabase, userId]);

  // 스탯 재조회 (reading_logs 집계)
  const refreshStats = useCallback(async () => {
    const { data: logs } = await supabase
      .from("reading_logs")
      .select("pages_read, genre")
      .eq("user_id", userId);
    if (!logs) return;

    const genrePages: Record<string, number> = { wisdom: 0, empathy: 0, insight: 0, creation: 0 };
    for (const log of logs) {
      const genre = log.genre as string | null;
      if (genre && genre in genrePages) genrePages[genre] += log.pages_read;
    }
    const newStats = {
      wisdom:   Math.floor(genrePages.wisdom   / PAGES_PER_STAT),
      empathy:  Math.floor(genrePages.empathy  / PAGES_PER_STAT),
      insight:  Math.floor(genrePages.insight  / PAGES_PER_STAT),
      creation: Math.floor(genrePages.creation / PAGES_PER_STAT),
    };
    await supabase.from("user_stats").update(newStats).eq("user_id", userId);
    setCharacter((prev) => ({ ...prev, stats: { ...prev.stats, ...newStats } }));
  }, [supabase, userId]);

  // 칭호 자동 해금 체크
  const checkAndUnlockTitles = useCallback(
    async (updatedCharacter: CharacterData, completedBooks: number, genresRead: number) => {
      const ctx = buildTitleContext(
        updatedCharacter.profile,
        updatedCharacter.stats,
        completedBooks,
        genresRead,
        0 // monthlyPages — 추후 구현
      );
      const alreadyUnlocked = [
        "apprentice",
        ...updatedCharacter.titles.map((t) => t.title_id),
      ];
      const newIds = getNewlyUnlockedTitles(ctx, alreadyUnlocked);

      if (newIds.length > 0) {
        await supabase.from("user_titles").insert(
          newIds.map((id) => ({ user_id: userId, title_id: id }))
        );
        const { data: updatedTitles } = await supabase
          .from("user_titles")
          .select("*")
          .eq("user_id", userId);
        if (updatedTitles) {
          setCharacter((prev) => ({ ...prev, titles: updatedTitles }));
        }
      }
    },
    [supabase, userId]
  );

  // EXP·골드·스트릭 업데이트
  const handleStatChange = useCallback(
    async (expDelta: number, goldDelta: number, streakDelta: number = 0) => {
      const newExp    = character.profile.exp    + expDelta;
      const newGold   = character.profile.gold   + goldDelta;
      const newLevel  = getLevelFromExp(newExp);
      const newStreak = character.profile.streak + streakDelta;
      const today     = new Date().toISOString().slice(0, 10);

      const updatedProfile = { ...character.profile, exp: newExp, gold: newGold, level: newLevel, streak: newStreak };
      setCharacter((prev) => ({ ...prev, profile: updatedProfile }));

      await supabase
        .from("users")
        .update({ exp: newExp, gold: newGold, level: newLevel, streak: newStreak, last_read_date: today })
        .eq("id", userId);

      await refreshStats();

      // 칭호 체크
      const completedBooks = books.filter((b) => b.status === "complete").length;
      const genresRead = new Set(books.map((b) => b.genre)).size;
      await checkAndUnlockTitles(
        { ...character, profile: updatedProfile },
        completedBooks,
        genresRead
      );
    },
    [character, supabase, userId, refreshStats, books, checkAndUnlockTitles]
  );

  // 칭호 선택
  const handleTitleChange = useCallback(
    async (titleId: string) => {
      setCharacter((prev) => ({
        ...prev,
        profile: { ...prev.profile, selected_title_id: titleId },
      }));
      await supabase.from("users").update({ selected_title_id: titleId }).eq("id", userId);
    },
    [supabase, userId]
  );

  // 장비 구매
  const handleEquipmentPurchase = useCallback(
    async (slot: EquipmentSlot, tier: EquipmentTier, price: number) => {
      const newGold = character.profile.gold - price;
      if (newGold < 0) return;

      const newEquipment: UserEquipment = { ...character.equipment, [slot]: tier };
      setCharacter((prev) => ({
        ...prev,
        profile: { ...prev.profile, gold: newGold },
        equipment: newEquipment,
      }));

      await Promise.all([
        supabase.from("users").update({ gold: newGold }).eq("id", userId),
        supabase.from("user_equipment").update({ [slot]: tier }).eq("user_id", userId),
      ]);
    },
    [character, supabase, userId]
  );

  // 업적 통계 계산
  const achievementStats = useMemo((): AchievementStats => {
    const completed = books.filter((b) => b.status === "complete");
    const totalPagesRead = books.reduce((sum, b) => sum + b.read_pages, 0);
    const allSlots = ["helmet", "armor", "cloak", "weapon", "shield", "boots"] as EquipmentSlot[];
    const equippedTiers = allSlots.map((s) => character.equipment[s]).filter(Boolean) as EquipmentTier[];
    const allIron = equippedTiers.length === 6 && equippedTiers.every((t) => t === "iron");
    const sameGradeSet =
      equippedTiers.length === 6 &&
      equippedTiers.every((t) => t === equippedTiers[0]) &&
      equippedTiers[0] !== "iron";

    return {
      totalBooks: books.length,
      completedBooks: completed.length,
      totalPagesRead,
      streak: character.profile.streak,
      loginStreak: character.profile.streak,
      hasReadingLog: totalPagesRead > 0,
      hasFirstComplete: completed.length > 0,
      hasFirstEquip: equippedTiers.length > 0,
      allIron,
      sameGradeSet,
      level: character.profile.level,
      genresRead: new Set(books.map((b) => b.genre)).size,
      maxStatValue: Math.max(
        character.stats.wisdom,
        character.stats.empathy,
        character.stats.insight,
        character.stats.creation
      ),
      memoCount: 0, // Phase 3에서 메모 기능 추가
    };
  }, [books, character]);

  // 칭호 체크 컨텍스트
  const titleCtx = useMemo(
    () =>
      buildTitleContext(
        character.profile,
        character.stats,
        books.filter((b) => b.status === "complete").length,
        new Set(books.map((b) => b.genre)).size,
        0
      ),
    [character, books]
  );

  // 퀘스트 생성 (시드 기반, 날짜 고정)
  const quests = useMemo(
    () => generateQuests(books, DEFAULT_USER_READING_STATS),
    [books]
  );

  return (
    <div className="min-h-screen bg-[#F5F2ED] dark:bg-[#1A1F1A]">
      <Header gold={character.profile.gold} level={character.profile.level} />

      <main className="pt-12 pb-16 px-4 min-h-screen">
        <div className="max-w-lg mx-auto py-4">
          {activeTab === "library" && (
            <div className="flex flex-col gap-4">
              {/* 퀘스트 패널 — 서재 탭 상단 */}
              <QuestPanel quests={quests} />
              <LibraryTab
                books={books}
                userId={userId}
                onBooksChange={refreshBooks}
                onStatChange={handleStatChange}
              />
            </div>
          )}
          {activeTab === "character" && (
            <CharacterTab
              data={character}
              titleCtx={titleCtx}
              onTitleChange={handleTitleChange}
            />
          )}
          {activeTab === "shop" && (
            <ShopTab
              gold={character.profile.gold}
              equipment={character.equipment}
              onPurchase={handleEquipmentPurchase}
            />
          )}
          {activeTab === "achievements" && (
            <AchievementsTab
              stats={achievementStats}
            />
          )}
          {activeTab === "stats" && (
            <StatsTab
              userId={userId}
              gold={character.profile.gold}
              streak={character.profile.streak}
            />
          )}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
