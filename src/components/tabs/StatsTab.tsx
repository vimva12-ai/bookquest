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

// ─── 기간별 통계 타입 ────────────────────────────────────
type Period = "weekly" | "monthly" | "yearly";
interface PeriodStat { label: string; pages: number }

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
  const [period, setPeriod] = useState<Period>("weekly");

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

  // 날짜별 페이지 맵 (빠른 조회)
  const pagesByDate = new Map<string, number>();
  for (const log of logs) {
    pagesByDate.set(log.date, (pagesByDate.get(log.date) || 0) + log.pages_read);
  }

  function getPages(dateStr: string) { return pagesByDate.get(dateStr) || 0; }

  const today = new Date();

  // 오늘 읽은 페이지
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayPages = getPages(todayStr);
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth(); // 0-based

  // ── 기간별 차트 데이터 & 증감 계산 ────────────────────

  // 주간 — 최근 7일 vs 직전 7일
  const weeklyChart: PeriodStat[] = [];
  const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
  let weekCurrent = 0, weekPrev = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const p = getPages(ds);
    weekCurrent += p;
    weeklyChart.push({ label: DAY_LABELS[d.getDay()], pages: p });
  }
  for (let i = 13; i >= 7; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    weekPrev += getPages(d.toISOString().slice(0, 10));
  }

  // 월간 — 이번 달 주차별 vs 지난 달
  const monthlyChart: PeriodStat[] = [];
  let monthCurrent = 0, monthPrev = 0;
  const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
  for (let w = 0; w < 4; w++) {
    const start = w * 7 + 1;
    const end = Math.min((w + 1) * 7, daysInMonth);
    let weekPages = 0;
    for (let d = start; d <= end; d++) {
      const ds = `${todayYear}-${String(todayMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      weekPages += getPages(ds);
    }
    monthCurrent += weekPages;
    monthlyChart.push({ label: `${w + 1}주`, pages: weekPages });
  }
  const prevMonth     = todayMonth === 0 ? 11 : todayMonth - 1;
  const prevMonthYear = todayMonth === 0 ? todayYear - 1 : todayYear;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
  for (let d = 1; d <= daysInPrevMonth; d++) {
    const ds = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    monthPrev += getPages(ds);
  }

  // 연간 — 올해 월별 vs 작년
  const yearlyChart: PeriodStat[] = [];
  let yearCurrent = 0, yearPrev = 0;
  for (let m = 0; m < 12; m++) {
    const daysInM = new Date(todayYear, m + 1, 0).getDate();
    let mp = 0;
    for (let d = 1; d <= daysInM; d++) {
      const ds = `${todayYear}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      mp += getPages(ds);
    }
    yearCurrent += mp;
    yearlyChart.push({ label: `${m + 1}월`, pages: mp });
  }
  for (const log of logs) {
    if (log.date.startsWith(`${todayYear - 1}-`)) yearPrev += log.pages_read;
  }

  // 활성 기간에 따른 차트 데이터 선택
  const periodConfig: Record<Period, {
    chart: PeriodStat[]; current: number; prev: number;
    currentLabel: string; prevLabel: string;
  }> = {
    weekly:  { chart: weeklyChart,  current: weekCurrent,  prev: weekPrev,  currentLabel: "이번 주",  prevLabel: "지난 주" },
    monthly: { chart: monthlyChart, current: monthCurrent, prev: monthPrev, currentLabel: "이번 달",  prevLabel: "지난 달" },
    yearly:  { chart: yearlyChart,  current: yearCurrent,  prev: yearPrev,  currentLabel: "올해",     prevLabel: "작년" },
  };
  const active = periodConfig[period];
  const changePct = active.prev > 0
    ? Math.round(((active.current - active.prev) / active.prev) * 100)
    : active.current > 0 ? null : 0; // null = 이전 데이터 없음


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
      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard icon="📖" label="오늘 읽은 페이지" value={`${todayPages.toLocaleString()}p`}
          bg="bg-[#E8F0E8] dark:bg-[#2D4A2E]/30" />
        <SummaryCard icon="📄" label="총 읽은 페이지" value={`${totalPages.toLocaleString()}p`}
          bg="bg-[#EEF3EE] dark:bg-[#3D5A3E]/20" />
        <SummaryCard icon="📚" label="완독한 책" value={`${completedBooks}권`}
          bg="bg-[#EEF4EE] dark:bg-[#2D4A2E]/20" />
        <SummaryCard icon="🔥" label="연속 독서" value={`${streak}일`}
          bg="bg-[#F5EDE0] dark:bg-[#3A2E1A]/20" />
        <SummaryCard icon="🪙" label="보유 골드" value={`${gold.toLocaleString()}G`}
          bg="bg-[#F5EDE0] dark:bg-[#3A2E1A]/20" />
      </div>

      {/* ── 독서량 (주간/월간/연간 탭) ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        {/* 헤더 + 탭 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">📊 독서량</h3>
          <div className="flex gap-1">
            {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  period === p
                    ? "bg-[#3D5A3E] text-white"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                }`}
              >
                {p === "weekly" ? "주간" : p === "monthly" ? "월간" : "연간"}
              </button>
            ))}
          </div>
        </div>

        {/* 기간 요약 — 현재 페이지 + 증감률 */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-[#EEF3EE] dark:bg-[#3D5A3E]/20 rounded-xl px-3 py-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{active.currentLabel}</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{active.current.toLocaleString()}<span className="text-xs font-normal ml-0.5">p</span></p>
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{active.prevLabel} 대비</p>
            {changePct === null ? (
              <p className="text-lg font-bold text-gray-400">-</p>
            ) : changePct > 0 ? (
              <p className="text-lg font-bold text-green-500">↑ {changePct}%</p>
            ) : changePct < 0 ? (
              <p className="text-lg font-bold text-red-400">↓ {Math.abs(changePct)}%</p>
            ) : (
              <p className="text-lg font-bold text-gray-400">→ 0%</p>
            )}
            <p className="text-[10px] text-gray-400 dark:text-gray-600">{active.prev.toLocaleString()}p</p>
          </div>
        </div>

        {/* 차트 */}
        {active.chart.every((d) => d.pages === 0) ? (
          <p className="text-xs text-gray-400 text-center py-6">아직 기록이 없습니다</p>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={active.chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
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
