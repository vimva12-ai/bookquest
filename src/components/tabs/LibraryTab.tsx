// 이 파일이 하는 일: 서재 탭 — 책 목록 조회·추가·페이지 기록·완독 처리
"use client";

import { useState } from "react";
import type { Book, Genre } from "@/types/database";
import { GENRE_INFO } from "@/lib/game/stats";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  EXP_PER_PAGE,
  EXP_BONUS_COMPLETE,
  GOLD_PER_PAGE,
  GOLD_BONUS_COMPLETE,
} from "@/lib/game/exp";

// ─── 장르 선택 버튼 ─────────────────────────────────────
function GenreChip({
  genre,
  selected,
  onClick,
}: {
  genre: Genre;
  selected: boolean;
  onClick: () => void;
}) {
  const info = GENRE_INFO[genre];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        selected
          ? "border-transparent text-white"
          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800"
      }`}
      style={selected ? { backgroundColor: info.color } : {}}
    >
      <span>{info.icon}</span>
      <span>{info.label}</span>
      <span className="opacity-70">({info.stat})</span>
    </button>
  );
}

// ─── 책 삭제 확인 모달 ──────────────────────────────────
function DeleteConfirmModal({
  book,
  onClose,
  onConfirm,
}: {
  book: Book;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/30 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#242B24] rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1">📚 책 삭제</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
          &ldquo;{book.title}&rdquo;을(를) 서재에서 삭제할까요?
        </p>
        <p className="text-xs text-[#5B8C5A] dark:text-[#6BA368] mb-5">
          읽은 페이지 기록과 EXP·골드·스탯은 그대로 유지됩니다.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 bg-[#B85C4A] hover:bg-[#A04030] disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 책 카드 ────────────────────────────────────────────
function BookCard({
  book,
  onRecordPage,
  onDeleteBook,
}: {
  book: Book;
  onRecordPage: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
}) {
  const info = GENRE_INFO[book.genre];
  const progress = book.total_pages > 0 ? (book.read_pages / book.total_pages) * 100 : 0;
  const isComplete = book.status === "complete";

  return (
    <div
      className={`bg-white dark:bg-[#242B24] rounded-2xl p-4 shadow-sm border transition-all ${
        isComplete
          ? "border-gray-100 dark:border-gray-800 opacity-55"
          : "border-gray-100 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 장르 아이콘 */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: info.color + "20" }}
        >
          {info.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* 제목·저자 */}
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
            {book.title}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{book.author}</p>

          {/* 장르 태그 */}
          <span
            className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium text-white mb-2"
            style={{ backgroundColor: info.color }}
          >
            {info.label} · {info.stat}
          </span>

          {/* 진행 바 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: isComplete ? "#9E9E9E" : info.color,
                }}
              />
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {book.read_pages} / {book.total_pages}p
            </span>
          </div>
        </div>

        {/* 오른쪽 액션 영역 */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {!isComplete && book.status === "reading" && (
            <button
              onClick={() => onRecordPage(book)}
              className="px-3 py-1.5 bg-[#3D5A3E] hover:bg-[#2D4A2E] text-white text-xs font-medium rounded-xl transition-colors"
            >
              기록
            </button>
          )}
          {isComplete && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              완독 ✓
            </span>
          )}
          <button
            onClick={() => onDeleteBook(book)}
            className="text-[10px] text-[#A3AEA3] dark:text-[#556655] hover:text-[#B85C4A] dark:hover:text-[#C97060] transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 페이지 기록 모달 ───────────────────────────────────
function RecordPageModal({
  book,
  onClose,
  onSave,
}: {
  book: Book;
  onClose: () => void;
  onSave: (toPage: number) => Promise<void>;
}) {
  const [toPage, setToPage] = useState(book.read_pages + 1);
  const [saving, setSaving] = useState(false);

  const newPages = Math.max(0, toPage - book.read_pages);
  const willComplete = toPage >= book.total_pages;
  const expGain = newPages * EXP_PER_PAGE + (willComplete ? EXP_BONUS_COMPLETE : 0);
  const goldGain = newPages * GOLD_PER_PAGE + (willComplete ? GOLD_BONUS_COMPLETE : 0);

  async function handleSave() {
    if (newPages <= 0) return;
    setSaving(true);
    await onSave(Math.min(toPage, book.total_pages));
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/30 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#242B24] rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1">페이지 기록</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 truncate">
          📖 {book.title}
        </p>

        {/* 현재 위치 표시 */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          현재 <span className="font-bold text-[#3D5A3E] dark:text-[#6BA368]">{book.read_pages}p</span>{" "}
          · 전체 {book.total_pages}p
        </p>

        {/* 여기까지 읽었어요 */}
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
            여기까지 읽었어요
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={book.read_pages + 1}
              max={book.total_pages}
              value={toPage}
              onChange={(e) => setToPage(Number(e.target.value))}
              className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A3229] rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]"
            />
            <span className="text-sm text-gray-400">페이지</span>
          </div>
        </label>

        {/* 미리보기 */}
        {newPages > 0 && (
          <div className="bg-gradient-to-r from-[#EEF3EE] to-[#EEF0E8] dark:from-[#3D5A3E]/20 dark:to-[#3A2E1A]/20 rounded-xl p-3 mb-5 border border-[#D4E4D4] dark:border-[#3D5A3E]/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
              📊 {newPages}페이지 읽었습니다!
            </p>
            <div className="flex gap-3">
              <span className="text-xs text-[#3D5A3E] dark:text-[#6BA368] font-bold">
                +{expGain} EXP
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                +{goldGain} Gold
              </span>
              {willComplete && (
                <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                  🎉 완독!
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={newPages <= 0 || saving}
            className="flex-1 py-2.5 bg-[#3D5A3E] hover:bg-[#2D4A2E] disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {saving ? "저장 중..." : "기록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 책 추가 폼 ──────────────────────────────────────────
function AddBookForm({ onAdd }: { onAdd: (book: Omit<Book, "id" | "user_id" | "read_pages" | "status" | "completed_at" | "created_at">) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState(300);
  const [genre, setGenre] = useState<Genre>("wisdom");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onAdd({ title: title.trim(), author: author.trim(), total_pages: totalPages, genre });
    setTitle("");
    setAuthor("");
    setTotalPages(300);
    setOpen(false);
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-400 dark:text-gray-500 hover:border-[#5B8C5A] hover:text-[#3D5A3E] transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-lg">+</span>
        새 책 추가하기
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#242B24] rounded-2xl p-4 shadow-sm border border-[#D4E4D4] dark:border-[#3D5A3E]/30"
    >
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">새 책 추가</h3>

      <div className="space-y-3">
        {/* 제목 */}
        <input
          type="text"
          placeholder="책 제목 *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A3229] rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]"
        />

        {/* 저자 */}
        <input
          type="text"
          placeholder="저자"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A3229] rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]"
        />

        {/* 전체 페이지 */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="전체 페이지"
            min={1}
            value={totalPages}
            onChange={(e) => setTotalPages(Number(e.target.value))}
            className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A3229] rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]"
          />
          <span className="text-sm text-gray-400">페이지</span>
        </div>

        {/* 장르 선택 */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">장르 선택</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(GENRE_INFO) as Genre[]).map((g) => (
              <GenreChip
                key={g}
                genre={g}
                selected={genre === g}
                onClick={() => setGenre(g)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 bg-[#3D5A3E] hover:bg-[#2D4A2E] disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
        >
          {saving ? "추가 중..." : "추가하기"}
        </button>
      </div>
    </form>
  );
}

// ─── 서재 탭 메인 ────────────────────────────────────────
interface Props {
  books: Book[];
  userId: string;
  onBooksChange: () => void;
  onStatChange: (expDelta: number, goldDelta: number, streakDelta: number) => void;
}

type FilterType = "all" | "reading" | "complete" | "wishlist";

export function LibraryTab({ books, userId, onBooksChange, onStatChange }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [filter, setFilter] = useState<FilterType>("all");
  const [recordingBook, setRecordingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // 필터 적용 + 완독 책 맨 아래 정렬
  const filtered = books
    .filter((b) => filter === "all" || b.status === filter)
    .sort((a, b) => {
      if (a.status === "complete" && b.status !== "complete") return 1;
      if (a.status !== "complete" && b.status === "complete") return -1;
      return 0;
    });

  // 책 추가
  async function handleAddBook(data: Omit<Book, "id" | "user_id" | "read_pages" | "status" | "completed_at" | "created_at">) {
    await supabase.from("books").insert({
      user_id: userId,
      title: data.title,
      author: data.author,
      genre: data.genre,
      total_pages: data.total_pages,
      read_pages: 0,
      status: "reading",
    });
    onBooksChange();
  }

  // 책 삭제
  async function handleDeleteBook() {
    if (!deletingBook) return;
    await supabase.from("books").delete().eq("id", deletingBook.id);
    setDeletingBook(null);
    onBooksChange();
  }

  // 페이지 기록
  async function handleRecordPage(toPage: number) {
    if (!recordingBook) return;
    const newPages = toPage - recordingBook.read_pages;
    const willComplete = toPage >= recordingBook.total_pages;
    const expDelta = newPages * EXP_PER_PAGE + (willComplete ? EXP_BONUS_COMPLETE : 0);
    const goldDelta = newPages * GOLD_PER_PAGE + (willComplete ? GOLD_BONUS_COMPLETE : 0);

    // 1. 독서 로그 저장 (genre 포함 — 책 삭제 후에도 스탯 유지 목적)
    await supabase.from("reading_logs").insert({
      user_id: userId,
      book_id: recordingBook.id,
      genre: recordingBook.genre,
      date: new Date().toISOString().slice(0, 10),
      pages_read: newPages,
      from_page: recordingBook.read_pages + 1,
      to_page: toPage,
    });

    // 2. 책 업데이트
    await supabase.from("books").update({
      read_pages: toPage,
      status: willComplete ? "complete" : "reading",
      completed_at: willComplete ? new Date().toISOString() : null,
    }).eq("id", recordingBook.id);

    // 3. 스트릭 업데이트 — 오늘 처음 기록이면 +1, 이미 기록했으면 0
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: todayLogs } = await supabase
      .from("reading_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("date", todayStr);
    // 방금 insert한 것 포함해서 1개면 오늘 첫 기록
    const isFirstTodayLog = (todayLogs?.length ?? 0) <= 1;

    // 4. 스탯 업데이트 (EXP·골드·스트릭)
    onStatChange(expDelta, goldDelta, isFirstTodayLog ? 1 : 0);

    setRecordingBook(null);
    onBooksChange();
  }

  const FILTER_LABELS: Record<FilterType, string> = {
    all: "전체",
    reading: "읽는 중",
    complete: "완독",
    wishlist: "읽을 책",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {(["all", "reading", "complete", "wishlist"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-[#3D5A3E] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {FILTER_LABELS[f]}
            <span className="ml-1 opacity-60">
              {f === "all"
                ? books.length
                : books.filter((b) => b.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* 책 목록 */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600">
            <p className="text-3xl mb-2">📚</p>
            <p className="text-sm">아직 책이 없습니다</p>
          </div>
        ) : (
          filtered.map((book) => (
            <BookCard key={book.id} book={book} onRecordPage={setRecordingBook} onDeleteBook={setDeletingBook} />
          ))
        )}
      </div>

      {/* 책 추가 폼 */}
      <AddBookForm onAdd={handleAddBook} />

      {/* 페이지 기록 모달 */}
      {recordingBook && (
        <RecordPageModal
          book={recordingBook}
          onClose={() => setRecordingBook(null)}
          onSave={handleRecordPage}
        />
      )}

      {/* 책 삭제 확인 모달 */}
      {deletingBook && (
        <DeleteConfirmModal
          book={deletingBook}
          onClose={() => setDeletingBook(null)}
          onConfirm={handleDeleteBook}
        />
      )}
    </div>
  );
}
