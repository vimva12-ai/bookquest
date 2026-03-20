-- ============================================================
-- Book Quest — 책 삭제 기능 마이그레이션
-- Supabase 대시보드 → SQL Editor에서 실행하세요
-- ============================================================

-- 1. reading_logs에 genre 컬럼 추가 (책 삭제 후에도 장르 정보 유지)
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS genre text CHECK (genre IN ('wisdom','empathy','insight','creation'));

-- 2. 기존 reading_logs의 genre를 books 테이블에서 채움
UPDATE reading_logs
SET genre = books.genre
FROM books
WHERE reading_logs.book_id = books.id;

-- 3. book_id FK를 CASCADE → SET NULL으로 변경 (책 삭제 시 로그는 유지)
ALTER TABLE reading_logs DROP CONSTRAINT reading_logs_book_id_fkey;

ALTER TABLE reading_logs
  ALTER COLUMN book_id DROP NOT NULL;

ALTER TABLE reading_logs
  ADD CONSTRAINT reading_logs_book_id_fkey
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL;

SELECT '마이그레이션 완료! 이제 책을 삭제해도 독서 기록이 유지됩니다 ✅' AS message;
