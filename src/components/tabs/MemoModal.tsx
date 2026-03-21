// 이 파일이 하는 일: 책별 메모 목록 모달 — 메모 추가/수정/삭제/공유 기능
"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Book, ReadingNote } from "@/types/database";

interface Props {
  book: Book;
  userId: string;
  onClose: () => void;
  onMemoCountChange?: () => void;
}

export function MemoModal({ book, userId, onClose, onMemoCountChange }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [memos, setMemos] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);

  // 입력 상태
  const [content, setContent] = useState("");
  const [page, setPage] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editPage, setEditPage] = useState<string>("");
  const [editIsPublic, setEditIsPublic] = useState(false);

  // 공유 피드백
  const [shareToast, setShareToast] = useState("");

  const fetchMemos = useCallback(async () => {
    const { data } = await supabase
      .from("reading_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("book_id", book.id)
      .order("created_at", { ascending: false });
    setMemos((data as ReadingNote[]) || []);
    setLoading(false);
  }, [supabase, userId, book.id]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  // 토스트 자동 제거
  useEffect(() => {
    if (!shareToast) return;
    const t = setTimeout(() => setShareToast(""), 2500);
    return () => clearTimeout(t);
  }, [shareToast]);

  async function handleAdd() {
    if (!content.trim()) return;
    setSaving(true);

    await supabase.from("reading_notes").insert({
      user_id: userId,
      book_id: book.id,
      content: content.trim(),
      page: page ? parseInt(page) : null,
      is_public: isPublic,
    });

    setContent("");
    setPage("");
    setIsPublic(false);
    setSaving(false);
    await fetchMemos();
    onMemoCountChange?.();
  }

  async function handleDelete(id: string) {
    await supabase.from("reading_notes").delete().eq("id", id);
    await fetchMemos();
    onMemoCountChange?.();
  }

  function startEdit(memo: ReadingNote) {
    setEditingId(memo.id);
    setEditContent(memo.content);
    setEditPage(memo.page?.toString() || "");
    setEditIsPublic(memo.is_public);
  }

  async function handleEditSave() {
    if (!editingId || !editContent.trim()) return;
    await supabase.from("reading_notes").update({
      content: editContent.trim(),
      page: editPage ? parseInt(editPage) : null,
      is_public: editIsPublic,
    }).eq("id", editingId);
    setEditingId(null);
    await fetchMemos();
  }

  function buildShareText(memo: ReadingNote): string {
    const pageStr = memo.page ? ` p.${memo.page}` : "";
    return `📖 「${book.title}」${pageStr}\n\n"${memo.content}"\n\n— Book Quest에서 기록 중 📚`;
  }

  async function handleShare(memo: ReadingNote) {
    const text = buildShareText(memo);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // 사용자가 취소하거나 지원 안 되면 클립보드 폴백
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareToast("📋 클립보드에 복사되었습니다!");
    } catch {
      setShareToast("공유 기능을 사용할 수 없습니다");
    }
  }

  function formatDate(isoStr: string) {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[85vh] bg-white dark:bg-[#242B24] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm">📝 독서 메모</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{book.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg flex-shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* 메모 입력 */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이 책에 대한 생각을 적어보세요..."
            className="w-full text-sm bg-gray-50 dark:bg-[#1A1F1A] rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#5B8C5A] text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {/* 페이지 번호 (선택) */}
              <input
                type="number"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="p."
                min={1}
                max={book.total_pages}
                className="w-16 text-xs bg-gray-50 dark:bg-[#1A1F1A] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5B8C5A] text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              {/* 공개 여부 */}
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors ${
                  isPublic
                    ? "bg-[#5B8C5A]/15 text-[#3D5A3E] dark:bg-[#5B8C5A]/20 dark:text-[#6BA368]"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                }`}
              >
                {isPublic ? "🌍 공개" : "🔒 나만"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-300 dark:text-gray-600">
                {content.length}자
              </span>
              <button
                onClick={handleAdd}
                disabled={!content.trim() || saving}
                className="px-3 py-1.5 bg-[#3D5A3E] hover:bg-[#2D4A2E] disabled:opacity-40 text-white text-xs font-medium rounded-xl transition-colors"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>

        {/* 메모 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-6">불러오는 중...</p>
          ) : memos.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">아직 메모가 없습니다</p>
          ) : (
            <div className="flex flex-col gap-3">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className="bg-gray-50 dark:bg-[#1A1F1A] rounded-xl px-3 py-2.5"
                >
                  {editingId === memo.id ? (
                    /* 수정 모드 */
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-sm bg-white dark:bg-[#242B24] rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#5B8C5A] text-gray-800 dark:text-gray-200"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editPage}
                            onChange={(e) => setEditPage(e.target.value)}
                            placeholder="p."
                            min={1}
                            max={book.total_pages}
                            className="w-16 text-xs bg-white dark:bg-[#242B24] rounded-lg px-2 py-1 focus:outline-none text-gray-600 dark:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setEditIsPublic(!editIsPublic)}
                            className={`text-[10px] px-2 py-1 rounded-full ${
                              editIsPublic
                                ? "bg-[#5B8C5A]/15 text-[#3D5A3E] dark:text-[#6BA368]"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                            }`}
                          >
                            {editIsPublic ? "🌍 공개" : "🔒 나만"}
                          </button>
                          <span className="text-[10px] text-gray-300 dark:text-gray-600">
                            {editContent.length}자
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[10px] px-2 py-1 text-gray-400 hover:text-gray-600"
                          >
                            취소
                          </button>
                          <button
                            onClick={handleEditSave}
                            className="text-[10px] px-2 py-1 bg-[#3D5A3E] text-white rounded-lg"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 읽기 모드 */
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {memo.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                          {memo.page && <span>p.{memo.page}</span>}
                          <span>{formatDate(memo.created_at)}</span>
                          <span>{memo.is_public ? "🌍" : "🔒"}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleShare(memo)}
                            className="text-[10px] px-2 py-0.5 rounded-lg text-[#4A7A8A] hover:bg-[#4A7A8A]/10 transition-colors"
                          >
                            공유
                          </button>
                          <button
                            onClick={() => startEdit(memo)}
                            className="text-[10px] px-2 py-0.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(memo.id)}
                            className="text-[10px] px-2 py-0.5 rounded-lg text-[#B85C4A] hover:bg-[#B85C4A]/10 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 공유 토스트 */}
        {shareToast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs px-4 py-2 rounded-full shadow-lg">
            {shareToast}
          </div>
        )}
      </div>
    </div>
  );
}
