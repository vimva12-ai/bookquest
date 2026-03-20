// 이 파일이 하는 일: 업적 탭 — 28개 업적 카드, 달성/미달성, 진행도 바
"use client";

import { ACHIEVEMENTS, isAchieved, type AchievementStats } from "@/lib/game/achievements";

interface Props {
  stats: AchievementStats;
}

export function AchievementsTab({ stats }: Props) {
  const total = ACHIEVEMENTS.length;
  const doneCount = ACHIEVEMENTS.filter((a) => isAchieved(a, stats)).length;

  return (
    <div className="flex flex-col gap-4">
      {/* 달성 요약 */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">🏆 업적</h3>
          <span className="text-sm font-bold text-blue-500">
            {doneCount} / {total}
          </span>
        </div>
        {/* 전체 진행 바 */}
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-700"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 업적 카드 목록 */}
      <div className="flex flex-col gap-3">
        {ACHIEVEMENTS.map((achievement) => {
          const done = isAchieved(achievement, stats);
          const progress = achievement.getProgress(stats);
          const total = achievement.total ?? 1;
          const percent = Math.min((progress / total) * 100, 100);

          return (
            <div
              key={achievement.id}
              className={`rounded-2xl p-4 border transition-all ${
                done
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800/30"
                  : "bg-white dark:bg-[#1A1D27] border-gray-100 dark:border-gray-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* 아이콘 */}
                <div
                  className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${
                    done
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-100 dark:bg-gray-800 opacity-60"
                  }`}
                >
                  {achievement.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`font-semibold text-sm ${done ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {achievement.title}
                      {done && <span className="ml-1 text-xs">✓</span>}
                    </h4>
                    {/* 보상 */}
                    <span className="text-xs text-amber-500 font-medium ml-2 flex-shrink-0">
                      {achievement.reward}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                    {achievement.desc}
                  </p>

                  {/* 진행도 바 (미달성 시) */}
                  {!done && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-300 dark:bg-blue-600 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {progress.toLocaleString()} / {total.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
