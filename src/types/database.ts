// 이 파일이 하는 일: Supabase DB 테이블과 1:1 대응하는 TypeScript 타입 정의

// 장르 ID — 4가지 스탯과 연결됨
export type Genre = "wisdom" | "empathy" | "insight" | "creation";

// 책 상태
export type BookStatus = "reading" | "complete" | "wishlist";

// 장비 부위 ID
export type EquipmentSlot = "helmet" | "armor" | "cloak" | "weapon" | "shield" | "boots";

// 장비 등급 ID
export type EquipmentTier =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "master"
  | "challenger";

// ─── 테이블 타입 ───────────────────────────────────────

export interface UserProfile {
  id: string;
  nickname: string;
  level: number;
  exp: number;
  gold: number;
  selected_title_id: string;
  streak: number;
  last_read_date: string | null;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  wisdom: number;
  empathy: number;
  insight: number;
  creation: number;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  genre: Genre;
  total_pages: number;
  read_pages: number;
  status: BookStatus;
  completed_at: string | null;
  created_at: string;
}

export interface ReadingLog {
  id: string;
  user_id: string;
  book_id: string;
  date: string;
  pages_read: number;
  from_page: number;
  to_page: number;
  created_at: string;
}

export interface UserEquipment {
  user_id: string;
  helmet: EquipmentTier | null;
  armor: EquipmentTier | null;
  cloak: EquipmentTier | null;
  weapon: EquipmentTier | null;
  shield: EquipmentTier | null;
  boots: EquipmentTier | null;
}

export interface UserTitle {
  id: string;
  user_id: string;
  title_id: string;
  unlocked_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achieved_at: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_type: "daily" | "weekly" | "monthly";
  quest_id: string;
  progress: number;
  total: number;
  completed: boolean;
  period_start: string;
  created_at: string;
}

export interface ReadingNote {
  id: string;
  user_id: string;
  book_id: string;
  content: string;
  page: number | null;
  created_at: string;
}

// ─── 앱 내부에서 쓰는 복합 타입 ─────────────────────────

// 캐릭터 탭 전체 데이터
export interface CharacterData {
  profile: UserProfile;
  stats: UserStats;
  equipment: UserEquipment;
  titles: UserTitle[];
}
