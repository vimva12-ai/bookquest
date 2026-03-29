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
import { toLocalDateStr } from "@/lib/date";

// ─── 타입 ────────────────────────────────────────────────
interface GenreData  { name: string; value: number; color: string }
interface MonthGroup { month: string; label: string; books: Book[] }
type StackedBar = { label: string; [k: string]: number | string };

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

// ─── 스트릭 캘린더 (GitHub 잔디 스타일) — 요일·날짜 정합성 수정 ─
function getStreakColor(pages: number): string {
  if (pages === 0) return "var(--streak-empty)";
  if (pages <= 50) return "#8DC18C";   // 1~50p
  if (pages <= 100) return "#5B8C5A"; // 51~100p
  return "#2D4A2E";                    // 101p+
}

function StreakCalendar({ pagesByDate }: { pagesByDate: Map<string, number> }) {
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const dayOfWeek = today.getDay(); // 0=일, 6=토

  // 오늘이 속한 주의 일요일에서 14주 전 일요일부터 시작 → 15열(주) × 7행(요일) 그리드
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek - 14 * 7);
  startDate.setHours(0, 0, 0, 0);

  const weeks: Array<Array<{ date: string; pages: number } | null>> = [];
  for (let w = 0; w < 15; w++) {
    const week: Array<{ date: string; pages: number } | null> = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = toLocalDateStr(date);
      week.push(dateStr > todayStr ? null : { date: dateStr, pages: pagesByDate.get(dateStr) ?? 0 });
    }
    weeks.push(week);
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
        {/* 잔디 셀 — 열=주차, 행=요일 */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) =>
              day === null ? (
                <div key={`f-${di}`} className="w-3 h-3 rounded-sm" />
              ) : (
                <div
                  key={day.date}
                  title={day.pages > 0 ? `${day.date} (${day.pages}p)` : day.date}
                  className="w-3 h-3 rounded-sm transition-colors"
                  style={{ backgroundColor: getStreakColor(day.pages) }}
                />
              )
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <p className="text-xs text-gray-400 dark:text-gray-600">최근 15주 독서 기록</p>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#8DC18C" }} />
          <span className="text-[9px] text-gray-400 dark:text-gray-600">~50p</span>
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#5B8C5A" }} />
          <span className="text-[9px] text-gray-400 dark:text-gray-600">~100p</span>
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#2D4A2E" }} />
          <span className="text-[9px] text-gray-400 dark:text-gray-600">101p+</span>
        </div>
      </div>
    </div>
  );
}

// ─── 기간별 통계 타입 ────────────────────────────────────
type Period = "daily" | "weekly" | "monthly" | "yearly";

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
  const [period, setPeriod] = useState<Period>("daily");

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

  // ── 기본 집계 ──────────────────────────────────────────
  const totalPages     = logs.reduce((s, l) => s + l.pages_read, 0);
  const completedBooks = books.filter((b) => b.status === "complete").length;

  // 날짜별 전체 페이지 맵
  const pagesByDate = new Map<string, number>();
  for (const log of logs) {
    pagesByDate.set(log.date, (pagesByDate.get(log.date) || 0) + log.pages_read);
  }
  function getPages(dateStr: string) { return pagesByDate.get(dateStr) || 0; }

  const today      = new Date();
  const todayStr   = toLocalDateStr(today);
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth(); // 0-based

  // ── 이번 주 월요일 계산 (월~일 기준) ────────────────────
  const dow         = today.getDay();              // 0=일, 6=토
  const daysFromMon = dow === 0 ? 6 : dow - 1;    // 월요일까지 거슬러야 할 일수
  const thisMonday  = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMon);
  thisMonday.setHours(0, 0, 0, 0);

  // ── 책별 고유 색상 팔레트 (낮은 채도, 시각적으로 구분 가능) ─
  const BOOK_PALETTE = [
    "#5B8C8A", // 청록
    "#8C6B5B", // 테라코타
    "#6B7A8C", // 슬레이트 블루
    "#7A8C5B", // 올리브 그린
    "#8C5B7A", // 모브
    "#5B6B8C", // 스틸 블루
    "#8C7A5B", // 샌드
    "#5B8C6B", // 세이지
    "#8C5B5B", // 더스티 로즈
    "#6B5B8C", // 라벤더
  ];

  // ── 책 메타데이터 맵 (책별 색상·제목) ────────────────────
  const DELETED_KEY = "__deleted__";
  const bookMeta = new Map<string, { color: string; title: string }>();
  bookMeta.set(DELETED_KEY, { color: "#9E9E9E", title: "(삭제된 책)" });
  // 등장 순서대로 팔레트 색상 할당
  let paletteIdx = 0;
  for (const log of logs) {
    const key = log.book_id ?? DELETED_KEY;
    if (!bookMeta.has(key)) {
      const book = books.find((b) => b.id === key);
      bookMeta.set(key, {
        color: book
          ? BOOK_PALETTE[paletteIdx++ % BOOK_PALETTE.length]
          : "#9E9E9E",
        title: book ? book.title : "(삭제된 책)",
      });
    }
  }

  // ── 스택 차트 빌더 ───────────────────────────────────────
  function buildStacked(
    groups: Array<{ label: string; dates: string[] }>
  ): { data: StackedBar[]; bookIds: string[] } {
    const dateSets = groups.map((g) => new Set(g.dates));

    // 해당 기간에 등장하는 책 ID 수집
    const bookIdsSet = new Set<string>();
    for (const log of logs) {
      const key = log.book_id ?? DELETED_KEY;
      for (const s of dateSets) {
        if (s.has(log.date)) { bookIdsSet.add(key); break; }
      }
    }
    const bookIds = Array.from(bookIdsSet);

    const data = groups.map(({ label }, gi) => {
      const ds = dateSets[gi];
      const row: StackedBar = { label };
      for (const bid of bookIds) {
        row[bid] = logs
          .filter((l) => (l.book_id ?? DELETED_KEY) === bid && ds.has(l.date))
          .reduce((s, l) => s + l.pages_read, 0);
      }
      return row;
    });

    return { data, bookIds };
  }

  // ── 기간별 날짜 그룹 정의 ────────────────────────────────
  const DAY_LABELS_MON_SUN = ["월", "화", "수", "목", "금", "토", "일"];

  // 오늘 기준 최근 7일 (일별)
  const dailyGroups = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    const label = i === 6 ? "오늘" : i === 5 ? "어제" : `${d.getMonth() + 1}/${d.getDate()}`;
    return { label, dates: [toLocalDateStr(d)] };
  });

  // 이번 주 월~일
  const weeklyGroups = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(thisMonday); d.setDate(thisMonday.getDate() + i);
    return { label: DAY_LABELS_MON_SUN[i], dates: [toLocalDateStr(d)] };
  });

  // 이번 달 주차별 (1~4주)
  const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
  const monthlyGroups = Array.from({ length: 4 }, (_, w) => {
    const start = w * 7 + 1;
    const end   = Math.min((w + 1) * 7, daysInMonth);
    const dates: string[] = [];
    for (let d = start; d <= end; d++) {
      dates.push(`${todayYear}-${String(todayMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return { label: `${w + 1}주`, dates };
  });

  // 올해 월별
  const yearlyGroups = Array.from({ length: 12 }, (_, m) => {
    const daysInM = new Date(todayYear, m + 1, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= daysInM; d++) {
      dates.push(`${todayYear}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return { label: `${m + 1}월`, dates };
  });

  const stackedByPeriod = {
    daily:   buildStacked(dailyGroups),
    weekly:  buildStacked(weeklyGroups),
    monthly: buildStacked(monthlyGroups),
    yearly:  buildStacked(yearlyGroups),
  };

  // ── 기간별 합계 (요약 카드용) ────────────────────────────
  const todayPages = getPages(todayStr);
  const yesterdayDate = new Date(today); yesterdayDate.setDate(today.getDate() - 1);
  const yesterdayPages = getPages(toLocalDateStr(yesterdayDate));

  // 주간: 이번 주 월~일 vs 지난 주 월~일
  let weekCurrent = 0, weekPrev = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(thisMonday); d.setDate(thisMonday.getDate() + i);
    if (d <= today) weekCurrent += getPages(toLocalDateStr(d));
  }
  const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7);
  for (let i = 0; i < 7; i++) {
    const d = new Date(lastMonday); d.setDate(lastMonday.getDate() + i);
    weekPrev += getPages(toLocalDateStr(d));
  }

  // 월간
  let monthCurrent = 0, monthPrev = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    monthCurrent += getPages(`${todayYear}-${String(todayMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  const prevMonth      = todayMonth === 0 ? 11 : todayMonth - 1;
  const prevMonthYear  = todayMonth === 0 ? todayYear - 1 : todayYear;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
  for (let d = 1; d <= daysInPrevMonth; d++) {
    monthPrev += getPages(`${prevMonthYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  // 연간
  let yearCurrent = 0, yearPrev = 0;
  for (const log of logs) {
    if (log.date.startsWith(`${todayYear}-`))     yearCurrent += log.pages_read;
    if (log.date.startsWith(`${todayYear - 1}-`)) yearPrev    += log.pages_read;
  }

  // 활성 기간에 따른 요약 카드 데이터
  const periodConfig: Record<Period, {
    current: number; prev: number; currentLabel: string; prevLabel: string;
  }> = {
    daily:   { current: todayPages,   prev: yesterdayPages, currentLabel: "오늘",    prevLabel: "어제" },
    weekly:  { current: weekCurrent,  prev: weekPrev,       currentLabel: "이번 주", prevLabel: "지난 주" },
    monthly: { current: monthCurrent, prev: monthPrev,      currentLabel: "이번 달", prevLabel: "지난 달" },
    yearly:  { current: yearCurrent,  prev: yearPrev,       currentLabel: "올해",    prevLabel: "작년" },
  };
  const active        = periodConfig[period];
  const activeStacked = stackedByPeriod[period];
  const changePct = active.prev > 0
    ? Math.round(((active.current - active.prev) / active.prev) * 100)
    : active.current > 0 ? null : 0;

  // ── 장르 분포 ───────────────────────────────────────────
  const genreData: GenreData[] = Object.entries(GENRE_INFO).map(([key, info]) => {
    const pages = logs
      .filter((l) => l.genre === key)
      .reduce((s, l) => s + l.pages_read, 0);
    return { name: info.stat, value: pages, color: info.color };
  }).filter((d) => d.value > 0);

  // ── 월별 완독 그룹 ───────────────────────────────────────
  const monthGroups: MonthGroup[] = (() => {
    const map = new Map<string, Book[]>();
    books
      .filter((b) => b.status === "complete" && b.completed_at)
      .forEach((b) => {
        const month = b.completed_at!.slice(0, 7);
        if (!map.has(month)) map.set(month, []);
        map.get(month)!.push(b);
      });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, monthBooks]) => ({
        month,
        label: `${month.slice(0, 4)}년 ${parseInt(month.slice(5))}월`,
        books: monthBooks,
      }));
  })();

  return (
    <div className="flex flex-col gap-4">
      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard icon="🔥" label="연속 독서" value={`${streak}일`}
          bg="bg-[#F5EDE0] dark:bg-[#3A2E1A]/20" />
        <SummaryCard icon="🪙" label="보유 골드" value={`${gold.toLocaleString()}G`}
          bg="bg-[#F5EDE0] dark:bg-[#3A2E1A]/20" />
        <SummaryCard icon="📚" label="완독한 책" value={`${completedBooks}권`}
          bg="bg-[#EEF4EE] dark:bg-[#2D4A2E]/20" />
      </div>

      {/* ── 독서량 차트 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        {/* 헤더 + 탭 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">📊 독서량</h3>
          <div className="flex gap-1">
            {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  period === p
                    ? "bg-[#3D5A3E] text-white"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                }`}
              >
                {p === "daily" ? "오늘" : p === "weekly" ? "주간" : p === "monthly" ? "월간" : "연간"}
              </button>
            ))}
          </div>
        </div>

        {/* 기간 요약 — 현재 페이지 + 증감률 */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-[#EEF3EE] dark:bg-[#3D5A3E]/20 rounded-xl px-3 py-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{active.currentLabel}</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {active.current.toLocaleString()}
              <span className="text-xs font-normal ml-0.5">p</span>
            </p>
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

        {/* 스택 막대 차트 (책별 색상 구분) */}
        {activeStacked.bookIds.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">아직 기록이 없습니다</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={activeStacked.data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                  formatter={(v, key) => [
                    `${v}p`,
                    typeof key === "string" ? (bookMeta.get(key)?.title ?? key) : "독서량",
                  ]}
                />
                {activeStacked.bookIds.map((bid, i) => (
                  <Bar
                    key={bid}
                    dataKey={bid}
                    stackId="s"
                    fill={bookMeta.get(bid)?.color ?? "#5B8C5A"}
                    radius={i === activeStacked.bookIds.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {/* 책 범례 (2권 이상일 때만 표시) */}
            {activeStacked.bookIds.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {activeStacked.bookIds.map((bid) => (
                  <div key={bid} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bookMeta.get(bid)?.color }} />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                      {bookMeta.get(bid)?.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 누적 요약 */}
        <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            📄 총 <span className="font-semibold text-gray-600 dark:text-gray-300">{totalPages.toLocaleString()}p</span>
          </span>
        </div>
      </div>

      {/* ── 장르 분포 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-4">🎨 장르 분포</h3>
        {genreData.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">아직 기록이 없습니다</p>
        ) : (
          <div className="flex items-center gap-4">
            <PieChart width={110} height={110}>
              <Pie data={genreData} cx={50} cy={50} innerRadius={28} outerRadius={50}
                dataKey="value" paddingAngle={2}>
                {genreData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
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
      <StreakCalendar pagesByDate={pagesByDate} />

      {/* ── 월별 완독 목록 ── */}
      <div className="bg-white dark:bg-[#242B24] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">📅 월별 완독 목록</h3>
        {monthGroups.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">완독한 책이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {monthGroups.map((group) => (
              <div key={group.month}>
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
