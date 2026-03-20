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
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30"
          : "bg-white dark:bg-[#22252F] border-gray-100 dark:border-gray-800"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{quest.icon}</span>
          <span className={`text-xs font-medium ${done ? "text-green-700 dark:text-green-400 line-through opacity-70" : "text-gray-700 dark:text-gray-300"}`}>
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
            className={`h-full rounded-full transition-all ${done ? "bg-green-400" : "bg-blue-400"}`}
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

  const currentQuests = quests[tab];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-[#2A2518] dark:to-[#252218] rounded-2xl border border-amber-100 dark:border-amber-900/30 overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="font-bold text-amber-800 dark:text-amber-400 text-sm">퀘스트</span>
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
                    ? "bg-amber-400 dark:bg-amber-600 text-white"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/30"
                }`}
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
