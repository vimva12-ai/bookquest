-- 독서 메모 테이블에 공개 여부 컬럼 추가
-- reading_notes 테이블이 이미 존재하면 컬럼만 추가
ALTER TABLE reading_notes ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- RLS 정책: 본인 메모 전체 접근 + 공개 메모 읽기
-- 기존 정책이 있다면 먼저 삭제
DROP POLICY IF EXISTS "Users can CRUD own notes" ON reading_notes;
DROP POLICY IF EXISTS "Public notes are readable" ON reading_notes;

CREATE POLICY "Users can CRUD own notes" ON reading_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public notes are readable" ON reading_notes
  FOR SELECT USING (is_public = true);
