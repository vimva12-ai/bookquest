-- Book Quest — 카카오 API + 커뮤니티 페이지 DB 마이그레이션
-- Supabase SQL Editor에서 실행하세요.

-- 1. books 테이블에 컬럼 추가
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. community_book_info 테이블 생성 (ISBN 기준 공유 페이지 정보)
CREATE TABLE IF NOT EXISTS community_book_info (
  isbn TEXT PRIMARY KEY,
  title TEXT,
  total_pages INT,
  page_entries JSONB DEFAULT '[]',      -- [{pages: 280, count: 5}, ...]
  contributor_count INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS 설정
ALTER TABLE community_book_info ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (중복 방지)
DROP POLICY IF EXISTS "Anyone can read community_book_info" ON community_book_info;
DROP POLICY IF EXISTS "Authenticated users can insert community_book_info" ON community_book_info;
DROP POLICY IF EXISTS "Authenticated users can update community_book_info" ON community_book_info;

-- 누구나 읽기 가능 (페이지 수 추천을 위해)
CREATE POLICY "Anyone can read community_book_info"
  ON community_book_info FOR SELECT
  USING (true);

-- 인증된 사용자만 삽입 가능
CREATE POLICY "Authenticated users can insert community_book_info"
  ON community_book_info FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자만 수정 가능
CREATE POLICY "Authenticated users can update community_book_info"
  ON community_book_info FOR UPDATE
  USING (auth.role() = 'authenticated');
