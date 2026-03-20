// 이 파일이 하는 일: 통계 탭 — 요약 카드, 주간 차트, 장르 분포, 월별 완독, 스트릭 캘린더
"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { GENRE_INFO } from "@/lib/game/stats";
import type { Book, ReadingLog } from "@/types/database";

// ─── 타입 ────────────────────────────────────────────────
interface WeeklyData { day: string; pages: number }
interface GenreData  { name: string; value: number; color: string }
interface MonthGroup { month: string; label: string; books: Book[] }

// ─── 요약 카드 ───────────────────────────────────────────
function SummaryCard({ icon, label, value, bg }: { icon: string; label: string; value: string; bg: string }) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-1 ${bg}`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
}

// ─── 스트릭 캘린더 (GitHub 잔디 스타일) ─────────────────
function StreakCalendar({ readDates }: { readDates: Set<string> }) {
  // 오늘 기준 최근 105일 (15주 × 7일)
  const today = new Date();
  const days: Array<{ date: string; hasRead: boolean }> = [];
  for (let i = 104; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, hasRead: readDates.has(dateStr) });
  }

  // 7행(요일) × 15열(주) 그리드
  const weeks: typeof days[] = [];
  for (let w = 0; w < 15; w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7));
  }

  const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">🌿 독서 스트릭</h3>
      <div className="flex gap-1">
        {/* 요일 레이블 */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="w-3 h-3 flex items-center justify-center text-[8px] text-gray-300 dark:text-gray-600">
              {d}
            </div>
          ))}
        </div>
        {/* 잔디 셀 */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={day.date}
                className="w-3 h-3 rounded-sm transition-colors"
                style={{
                  backgroundColor: day.hasRead
                    ? "#5B8C5A"
                    : "var(--streak-empty)",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">최근 15주 독서 기록</p>
    </div>
  );
}

// ─── 통계 탭 메인 ────────────────────────────────────────
interface Props {
  userId: string;
  gold: number;
  streak: number;
}

export function StatsTab({ userId, gold, streak }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: booksData }, { data: logsData }] = await Promise.all([
        supabase.from("books").select("*").eq("user_id", userId),
        supabase.from("reading_logs").select("*").eq("user_id", userId),
      ]);
      setBooks((booksData as Book[]) || []);
      setLogs((logsData as ReadingLog[]) || []);
      setLoading(false);
    }
    load();
  // supabase 인스턴스는 싱글턴이라 deps에서 제외해도 안전
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <p className="text-sm">통계 불러오는 중...</p>
      </div>
    );
  }

  // ── 집계 계산 ──────────────────────────────────────────
  const totalPages    = logs.reduce((s, l) => s + l.pages_read, 0);
  const completedBooks = books.filter((b) => b.status === "complete").length;

  // 주간 차트 — 최근 7일
  const weeklyData: WeeklyData[] = (() => {
    const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
    const result: WeeklyData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const pages = logs
        .filter((l) => l.date === dateStr)
        .reduce((s, l) => s + l.pages_read, 0);
      result.push({ day: DAY_LABELS[d.getDay()], pages });
    }
    return result;
  })();

  // 장르 분포 — log.genre 직접 사용 (책 삭제 후에도 집계 유지)
  const genreData: GenreData[] = Object.entries(GENRE_INFO).map(([key, info]) => {
    const pages = logs
      .filter((l) => l.genre === key)
      .reduce((s, l) => s + l.pages_read, 0);
    return { name: info.stat, value: pages, color: info.color };
  }).filter((d) => d.value > 0);

  // 월별 완독 그룹
  const monthGroups: MonthGroup[] = (() => {
    const map = new Map<string, Book[]>();
    books
      .filter((b) => b.status === "complete" && b.completed_at)
      .forEach((b) => {
        const month = b.completed_at!.slice(0, 7); // "YYYY-MM"
        if (!map.has(month)) map.set(month, []);
        map.get(month)!.push(b);
      });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // 최신순
      .map(([month, monthBooks]) => ({
        month,
        label: `${month.slice(0, 4)}년 ${parseInt(month.slice(5))}월`,
        books: monthBooks,
      }));
  })();

  // 스트릭 캘린더용 읽은 날짜 Set
  const readDates = new Set(logs.map((l) => l.date));

  return (
    <div className="flex flex-col gap-4">
      {/* ── 요약 카드 4개 ── */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard icon="📄" label="총 읽은 페이지" value={`${totalPages.toLocaleString()}p`}
          bg="bg-[#EEF3EE] dark:bg-[#3D5A3E]/20" />
        <SummaryCard icon="📚" label="완독한 책" value={`${completedBooks}권`}
          bg="bg-[#EEF4EE] dark:bg-[#2D4A2E]/20" />
        <SummaryCard icon="🔥" label="연속 독서" value={`${streak}일`}
          bg="bg-[#F5EDE0] dark:bg-[#3A2E1A]/20" />
        <SummaryCard icon="🪙" label="보유 골드" value={`${gold.toLocaleString()}G`}
          bg="bg-[#F5EDE0] dark:bg-[#3A2E1A]/20" />
      </div>

      {/* ── 주간 독서량 바 차트 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-4">📊 최근 7일 독서량</h3>
        {weeklyData.every((d) => d.pages === 0) ? (
          <p className="text-xs text-gray-400 text-center py-6">아직 기록이 없습니다</p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                formatter={(v) => [`${v}p`, "독서량"]}
              />
              <Bar dataKey="pages" fill="#5B8C5A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 장르 분포 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-4">🎨 장르 분포</h3>
        {genreData.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">아직 기록이 없습니다</p>
        ) : (
          <div className="flex items-center gap-4">
            {/* 도넛 차트 */}
            <PieChart width={110} height={110}>
              <Pie data={genreData} cx={50} cy={50} innerRadius={28} outerRadius={50}
                dataKey="value" paddingAngle={2}>
                {genreData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            {/* 범례 + 바 */}
            <div className="flex-1 flex flex-col gap-2">
              {genreData.map((d) => {
                const total = genreData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                      <span className="font-medium" style={{ color: d.color }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 스트릭 캘린더 ── */}
      <StreakCalendar readDates={readDates} />

      {/* ── 월별 완독 목록 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">📅 월별 완독 목록</h3>
        {monthGroups.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">완독한 책이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {monthGroups.map((group) => (
              <div key={group.month}>
                {/* 월 헤더 (클릭하면 토글) */}
                <button
                  onClick={() => setSelectedMonth(selectedMonth === group.month ? null : group.month)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                    selectedMonth === group.month
                      ? "bg-[#EEF3EE] dark:bg-[#3D5A3E]/20 border border-[#9ABA9A] dark:border-[#3D5A3E]/30"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                  }`}
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{group.books.length}권</span>
                    <span className="text-gray-400">{selectedMonth === group.month ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* 해당 월 완독 도서 목록 */}
                {selectedMonth === group.month && (
                  <div className="mt-2 flex flex-col gap-2 pl-2">
                    {group.books.map((book) => {
                      const info = GENRE_INFO[book.genre];
                      return (
                        <div key={book.id} className="flex items-center gap-2 py-1">
                          <span className="text-base">{info.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{book.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{book.author} · {book.total_pages}p</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: info.color }}>
                            {info.stat}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
