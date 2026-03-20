// 이 파일이 하는 일: 서재 탭 상단 퀘스트 패널 — 일일/주간/월간 탭 전환
"use client";

import { useState } from "react";
import type { Quest, QuestSet } from "@/lib/game/quests";

type QuestTab = "daily" | "weekly" | "monthly";

function QuestCard({ quest }: { quest: Quest }) {
  const percent = quest.total > 0 ? Math.min((quest.progress / quest.total) * 100, 100) : 0;
  const done = quest.completed || percent >= 100;

  return (
    <div
      className={`rounded-xl p-3 border transition-all ${
        done
          ? "bg-[#EEF4EE] dark:bg-[#3D5A3E]/20 border-[#9ABA9A] dark:border-[#3D5A3E]/30"
          : "bg-white dark:bg-[#2A3229] border-gray-100 dark:border-gray-800"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{quest.icon}</span>
          <span className={`text-xs font-medium ${done ? "text-[#3D5A3E] dark:text-[#6BA368] line-through opacity-70" : "text-gray-700 dark:text-gray-300"}`}>
            {quest.title}
          </span>
        </div>
        <span className="text-xs font-bold text-amber-500 flex-shrink-0 ml-2">
          +{quest.reward}G
        </span>
      </div>

      {/* 진행도 바 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${done ? "bg-[#5B8C5A]" : "bg-[#4A7A8A]"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {done ? "✓ 완료" : `${quest.progress}/${quest.total}`}
        </span>
      </div>
    </div>
  );
}

interface Props {
  quests: QuestSet;
}

export function QuestPanel({ quests }: Props) {
  const [tab, setTab] = useState<QuestTab>("daily");
  const [open, setOpen] = useState(true);

  const TAB_LABELS: Record<QuestTab, string> = {
    daily: "일일",
    weekly: "주간",
    monthly: "월간",
  };

  const TAB_COLORS: Record<QuestTab, string> = {
    daily: "#5B8C5A",
    weekly: "#4A7A8A",
    monthly: "#8B6F47",
  };

  const currentQuests = quests[tab];

  return (
    <div className="bg-gradient-to-br from-[#EEF3EE] to-[#E8EDE8] dark:from-[#1F2A1F] dark:to-[#1A231A] rounded-2xl border border-[#D4E4D4] dark:border-[#3D5A3E]/30 overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="font-bold text-[#2D3A2E] dark:text-[#6BA368] text-sm">퀘스트</span>
        </div>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* 탭 */}
          <div className="flex gap-1.5 mb-3">
            {(["daily", "weekly", "monthly"] as QuestTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                  tab === t
                    ? "text-white"
                    : "bg-[#E8EDE8] dark:bg-[#2A342A] text-[#3D5A3E] dark:text-[#6BA368] hover:bg-[#D8E8D8] dark:hover:bg-[#2A3A2A]"
                }`}
                style={tab === t ? { backgroundColor: TAB_COLORS[t] } : {}}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* 퀘스트 목록 */}
          <div className="flex flex-col gap-2">
            {currentQuests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">퀘스트 없음</p>
            ) : (
              currentQuests.map((q) => <QuestCard key={q.id} quest={q} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
