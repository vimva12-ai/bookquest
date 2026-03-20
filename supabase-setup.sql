-- ============================================================
-- Book Quest — Supabase 초기 설정 SQL
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행하세요
-- ============================================================

-- ── 테이블 생성 ─────────────────────────────────────────────

-- 사용자 프로필
CREATE TABLE IF NOT EXISTS users (
  id               uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nickname         text NOT NULL DEFAULT '모험가',
  level            int  NOT NULL DEFAULT 1,
  exp              int  NOT NULL DEFAULT 0,
  gold             int  NOT NULL DEFAULT 0,
  selected_title_id text NOT NULL DEFAULT 'apprentice',
  streak           int  NOT NULL DEFAULT 0,
  last_read_date   date,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 스탯 (4종)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id   uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  wisdom    int NOT NULL DEFAULT 0,  -- 비문학 장르
  empathy   int NOT NULL DEFAULT 0,  -- 문학 장르
  insight   int NOT NULL DEFAULT 0,  -- 자기계발 장르
  creation  int NOT NULL DEFAULT 0   -- 기타 장르
);

-- 책 목록
CREATE TABLE IF NOT EXISTS books (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  title        text NOT NULL,
  author       text NOT NULL DEFAULT '',
  genre        text NOT NULL CHECK (genre IN ('wisdom','empathy','insight','creation')),
  total_pages  int  NOT NULL DEFAULT 1,
  read_pages   int  NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'reading' CHECK (status IN ('reading','complete','wishlist')),
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 독서 기록 (페이지 기록할 때마다 1행)
CREATE TABLE IF NOT EXISTS reading_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  book_id    uuid NOT NULL REFERENCES books ON DELETE CASCADE,
  date       date NOT NULL,
  pages_read int  NOT NULL,
  from_page  int  NOT NULL,
  to_page    int  NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 장비 (유저당 1행)
CREATE TABLE IF NOT EXISTS user_equipment (
  user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  helmet  text,  -- 'iron' | 'bronze' | ... | null
  armor   text,
  cloak   text,
  weapon  text,
  shield  text,
  boots   text
);

-- 해금된 칭호
CREATE TABLE IF NOT EXISTS user_titles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  title_id    text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, title_id)
);

-- 달성된 업적
CREATE TABLE IF NOT EXISTS user_achievements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  achievement_id text NOT NULL,
  achieved_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- 퀘스트 진행 (Phase 2에서 사용)
CREATE TABLE IF NOT EXISTS user_quests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  quest_type   text NOT NULL CHECK (quest_type IN ('daily','weekly','monthly')),
  quest_id     text NOT NULL,
  progress     int  NOT NULL DEFAULT 0,
  total        int  NOT NULL,
  completed    bool NOT NULL DEFAULT false,
  period_start date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 독서 메모 (Phase 2에서 사용)
CREATE TABLE IF NOT EXISTS reading_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  book_id    uuid NOT NULL REFERENCES books ON DELETE CASCADE,
  content    text NOT NULL,
  page       int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Row Level Security (RLS) 활성화 ─────────────────────────
-- 모든 테이블에 RLS를 켜고, 본인 데이터만 읽기/쓰기 허용

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE books           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_notes   ENABLE ROW LEVEL SECURITY;

-- users 정책
CREATE POLICY "본인 프로필만 접근" ON users
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_stats 정책
CREATE POLICY "본인 스탯만 접근" ON user_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- books 정책
CREATE POLICY "본인 책만 접근" ON books
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reading_logs 정책
CREATE POLICY "본인 기록만 접근" ON reading_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_equipment 정책
CREATE POLICY "본인 장비만 접근" ON user_equipment
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_titles 정책
CREATE POLICY "본인 칭호만 접근" ON user_titles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_achievements 정책
CREATE POLICY "본인 업적만 접근" ON user_achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_quests 정책
CREATE POLICY "본인 퀘스트만 접근" ON user_quests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reading_notes 정책
CREATE POLICY "본인 메모만 접근" ON reading_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 완료 메시지 ─────────────────────────────────────────────
SELECT 'Book Quest DB 설정 완료! 🎉' AS message;
