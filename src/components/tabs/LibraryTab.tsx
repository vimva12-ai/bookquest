// 이 파일이 하는 일: 서재 탭 — 책 목록 조회·추가(카카오 검색)·페이지 기록·완독 처리
"use client";

import { useState, useRef, useEffect } from "react";
import type { Book, Genre, CommunityBookInfo } from "@/types/database";
import { GENRE_INFO } from "@/lib/game/stats";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  EXP_PER_PAGE,
  EXP_BONUS_COMPLETE,
  GOLD_PER_PAGE,
  GOLD_BONUS_COMPLETE,
} from "@/lib/game/exp";
import { MemoModal } from "@/components/tabs/MemoModal";

// ─── 카카오 API 응답 타입 ────────────────────────────────
interface KakaoBook {
  title: string;
  authors: string[];
  publisher: string;
  isbn: string;
  thumbnail: string;
  contents: string;
  datetime: string;
}

// ─── 책 추가 폼 데이터 타입 ──────────────────────────────
interface BookFormData {
  title: string;
  author: string;
  total_pages: number;
  prior_pages: number;
  genre: Genre;
  isbn: string | null;
  publisher: string | null;
  cover_url: string | null;
  description: string | null;
}

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
  onMemo,
}: {
  book: Book;
  onRecordPage: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
  onMemo: (book: Book) => void;
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
        {/* 표지 이미지 또는 장르 아이콘 */}
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: info.color + "20" }}
          >
            {info.icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* 제목·저자 */}
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
            {book.title}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
            {book.author}
            {book.publisher && (
              <span className="ml-1 opacity-70">· {book.publisher}</span>
            )}
          </p>

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
              {book.read_pages} / {book.total_pages}p ({Math.round(progress)}%)
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMemo(book)}
              className="text-[10px] text-[#4A7A8A] dark:text-[#6BA3A3] hover:text-[#3A6A7A] transition-colors"
            >
              메모
            </button>
            <button
              onClick={() => onDeleteBook(book)}
              className="text-[10px] text-[#A3AEA3] dark:text-[#556655] hover:text-[#B85C4A] dark:hover:text-[#C97060] transition-colors"
            >
              삭제
            </button>
          </div>
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
              value={toPage || ""}
              onFocus={(e) => e.target.select()}
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

// ─── 커뮤니티 힌트 렌더 ─────────────────────────────────
function renderCommunityHint(info: CommunityBookInfo): string {
  const entries = info.page_entries ?? [];
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const n = info.contributor_count;

  if (sorted.length === 0) return `📚 ${n}명이 이 책을 기록했어요`;

  if (sorted.length === 1 || (sorted[1] && sorted[0].count > sorted[1].count)) {
    return `📚 다른 독서가 ${n}명이 이 책을 ${sorted[0].pages}p로 기록했어요`;
  }

  return `📚 ${sorted
    .slice(0, 3)
    .map((e) => `${e.pages}p (${e.count}명)`)
    .join(" / ")}`;
}

// ─── ISBN13 추출 ─────────────────────────────────────────
function extractIsbn13(isbnStr: string): string {
  // 카카오 API: "8937460440 9788937460449" 형식
  const parts = isbnStr.trim().split(/\s+/);
  return parts.find((p) => p.length === 13) ?? parts[0] ?? "";
}

// ─── 책 추가 폼 (카카오 검색 + 직접 입력) ────────────────
function AddBookForm({ onAdd, externalOpen, onExternalOpened }: {
  onAdd: (book: BookFormData) => Promise<void>;
  externalOpen?: boolean;
  onExternalOpened?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // 외부에서 열기 요청
  useEffect(() => {
    if (externalOpen) {
      setOpen(true);
      onExternalOpened?.();
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [externalOpen, onExternalOpened]);

  // 검색 상태
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 폼 필드
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [priorPages, setPriorPages] = useState(0);
  const [genre, setGenre] = useState<Genre>("wisdom");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [description, setDescription] = useState("");

  // 커뮤니티 정보
  const [communityInfo, setCommunityInfo] = useState<CommunityBookInfo | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  function handleQueryChange(q: string) {
    setQuery(q);
    setSearchFailed(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  }

  async function doSearch(q: string) {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}&size=10`);
      if (!res.ok) throw new Error();
      const data: { documents?: KakaoBook[]; error?: string } = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.documents ?? []);
      setShowDropdown(true);
    } catch {
      setSearchFailed(true);
      setResults([]);
      setShowDropdown(true);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectBook(book: KakaoBook) {
    setTitle(book.title);
    setAuthor(book.authors.join(", "));
    setPublisher(book.publisher ?? "");
    setCoverUrl(book.thumbnail ?? "");
    setDescription(book.contents ?? "");

    const isbn13 = extractIsbn13(book.isbn);
    setIsbn(isbn13);
    setShowDropdown(false);

    // 커뮤니티 페이지 정보 조회
    if (isbn13) {
      setCommunityLoading(true);
      setCommunityInfo(null);
      try {
        const res = await fetch(`/api/books/page-info?isbn=${isbn13}`);
        const { data }: { data: CommunityBookInfo | null } = await res.json();
        setCommunityInfo(data);
        if (data?.total_pages) setTotalPages(data.total_pages);
      } catch {
        setCommunityInfo(null);
      } finally {
        setCommunityLoading(false);
      }
    } else {
      setCommunityInfo(null);
    }
  }

  function handleClearSearch() {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setSearchFailed(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onAdd({
      title: title.trim(),
      author: author.trim(),
      total_pages: Math.max(1, totalPages),
      prior_pages: Math.min(Math.max(0, priorPages), Math.max(1, totalPages) - 1),
      genre,
      isbn: isbn || null,
      publisher: publisher || null,
      cover_url: coverUrl || null,
      description: description || null,
    });
    resetForm();
    setSaving(false);
  }

  function resetForm() {
    setTitle(""); setAuthor(""); setTotalPages(300); setPriorPages(0); setGenre("wisdom");
    setIsbn(""); setPublisher(""); setCoverUrl(""); setDescription("");
    setCommunityInfo(null); setQuery(""); setResults([]);
    setShowDropdown(false); setSearchFailed(false);
    setOpen(false);
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
      ref={formRef as React.Ref<HTMLFormElement>}
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#242B24] rounded-2xl p-4 shadow-sm border border-[#D4E4D4] dark:border-[#3D5A3E]/30"
    >
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">새 책 추가</h3>

      {/* ── 검색 바 ── */}
      <div className="relative mb-1">
        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A3229] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#5B8C5A]">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="책 제목으로 검색..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none"
          />
          {isSearching && (
            <span className="text-xs text-gray-400 whitespace-nowrap">검색 중...</span>
          )}
          {query && !isSearching && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-gray-300 dark:text-gray-600 hover:text-gray-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* 검색 결과 드롭다운 */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#242B24] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {results.length > 0 ? (
              results.map((book, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectBook(book)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-b last:border-b-0 border-gray-100 dark:border-gray-700 transition-colors"
                >
                  {book.thumbnail ? (
                    <img
                      src={book.thumbnail}
                      alt=""
                      className="w-8 h-12 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0 text-sm">
                      📖
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {book.authors.join(", ")} · {book.publisher}
                    </p>
                  </div>
                </button>
              ))
            ) : searchFailed ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                검색에 실패했어요. 직접 입력할 수 있어요
              </div>
            ) : (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                검색 결과가 없어요. 직접 입력해주세요
              </div>
            )}
          </div>
        )}
      </div>

      {/* 직접 입력 안내 */}
      <p className="text-xs text-gray-400 dark:text-gray-600 mb-3">
        검색 후 선택하거나{" "}
        <button
          type="button"
          onClick={handleClearSearch}
          className="text-[#3D5A3E] dark:text-[#6BA368] underline"
        >
          직접 입력하기
        </button>
      </p>

      <div className="space-y-3">
        {/* 선택된 책 표지 미리보기 */}
        {coverUrl && (
          <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <img src={coverUrl} alt={title} className="w-10 h-14 object-cover rounded" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{title}</p>
              {publisher && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{publisher}</p>
              )}
              {isbn && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">ISBN {isbn}</p>
              )}
            </div>
          </div>
        )}

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

        {/* 전체 페이지 + 커뮤니티 힌트 */}
        <div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="전체 페이지"
              min={1}
              value={totalPages || ""}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTotalPages(Number(e.target.value))}
              className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A3229] rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]"
            />
            <span className="text-sm text-gray-400">페이지</span>
          </div>

          {/* 커뮤니티 페이지 힌트 */}
          {communityLoading && (
            <p className="text-xs text-blue-400 dark:text-blue-300 mt-1.5 pl-1">
              커뮤니티 정보 불러오는 중...
            </p>
          )}
          {!communityLoading && communityInfo && (
            <div className="mt-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
              {renderCommunityHint(communityInfo)}
              {communityInfo.page_entries.length > 1 && (
                <div className="mt-1 flex gap-2 flex-wrap">
                  {[...communityInfo.page_entries]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3)
                    .map((e) => (
                      <button
                        key={e.pages}
                        type="button"
                        onClick={() => setTotalPages(e.pages)}
                        className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${
                          totalPages === e.pages
                            ? "bg-blue-600 dark:bg-blue-700 text-white border-blue-600"
                            : "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        }`}
                      >
                        {e.pages}p ({e.count}명)
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
          {!communityLoading && !communityInfo && isbn && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 pl-1">
              페이지 수를 입력해주세요 (책 뒷면에서 확인 가능)
            </p>
          )}
        </div>

        {/* 이미 읽은 페이지 */}
        <div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="이미 읽은 페이지 (선택)"
              min={0}
              max={Math.max(1, totalPages) - 1}
              value={priorPages || ""}
              onChange={(e) => setPriorPages(Number(e.target.value) || 0)}
              className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A3229] rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]"
            />
            <span className="text-sm text-gray-400">페이지</span>
          </div>
          {priorPages > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 pl-1">
              📖 앱 등록 전 읽은 페이지 — EXP·골드·스탯에 반영되지 않아요
            </p>
          )}
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
          onClick={resetForm}
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
  onMemoChange?: () => void;
}

type FilterType = "all" | "reading" | "complete" | "wishlist";

export function LibraryTab({ books, userId, onBooksChange, onStatChange, onMemoChange }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [filter, setFilter] = useState<FilterType>("all");
  const [recordingBook, setRecordingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [toast, setToast] = useState("");
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [memoBook, setMemoBook] = useState<Book | null>(null);

  // 토스트 자동 제거
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // 필터 적용 + 완독 책 맨 아래 정렬
  const filtered = books
    .filter((b) => filter === "all" || b.status === filter)
    .sort((a, b) => {
      if (a.status === "complete" && b.status !== "complete") return 1;
      if (a.status !== "complete" && b.status === "complete") return -1;
      return 0;
    });

  // 책 추가
  async function handleAddBook(data: BookFormData) {
    await supabase.from("books").insert({
      user_id: userId,
      title: data.title,
      author: data.author,
      genre: data.genre,
      total_pages: data.total_pages,
      read_pages: data.prior_pages,
      status: "reading",
      isbn: data.isbn,
      publisher: data.publisher,
      cover_url: data.cover_url,
      description: data.description,
    });

    // 커뮤니티 페이지 DB에 기여 (ISBN이 있을 때만)
    if (data.isbn && data.total_pages) {
      try {
        await fetch("/api/books/page-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isbn: data.isbn,
            title: data.title,
            pages: data.total_pages,
          }),
        });
        setToast("📚 페이지 정보가 공유되었어요! 다른 독서가에게 도움이 됩니다");
      } catch {
        // 커뮤니티 기여 실패는 조용히 무시
      }
    }

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
      {/* 필터 탭 + 추가 버튼 */}
      <div className="flex items-center gap-1.5 pb-1">
        {(["all", "reading", "complete", "wishlist"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 min-w-0 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-[#3D5A3E] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <span className="truncate block text-center leading-tight">
              {FILTER_LABELS[f]}
              <span className="ml-0.5 opacity-60">
                {f === "all"
                  ? books.length
                  : books.filter((b) => b.status === f).length}
              </span>
            </span>
          </button>
        ))}
        <button
          onClick={() => setAddBookOpen(true)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-[#C4933F]/15 text-[#A07A2E] dark:bg-[#C4933F]/20 dark:text-[#D4A94F] border border-[#C4933F]/40 dark:border-[#C4933F]/40 hover:bg-[#C4933F]/25 dark:hover:bg-[#C4933F]/30"
        >
          + 추가
        </button>
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
            <BookCard key={book.id} book={book} onRecordPage={setRecordingBook} onDeleteBook={setDeletingBook} onMemo={setMemoBook} />
          ))
        )}
      </div>

      {/* 책 추가 폼 */}
      <AddBookForm
        onAdd={handleAddBook}
        externalOpen={addBookOpen}
        onExternalOpened={() => setAddBookOpen(false)}
      />

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

      {/* 메모 모달 */}
      {memoBook && (
        <MemoModal
          book={memoBook}
          userId={userId}
          onClose={() => setMemoBook(null)}
          onMemoCountChange={onMemoChange}
        />
      )}

      {/* 커뮤니티 기여 토스트 */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#3D5A3E] text-white text-xs px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
