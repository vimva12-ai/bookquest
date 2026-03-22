-- 완독 목표 날짜 컬럼 추가
-- books 테이블에 target_date (DATE) 컬럼 추가

ALTER TABLE books ADD COLUMN IF NOT EXISTS target_date DATE;
