# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 개발 서버 (Turbopack, http://localhost:3000)
npm run build     # 프로덕션 빌드 (next build; 타입 오류가 있어도 빌드는 통과할 수 있으므로 tsc 별도 실행 필요)
npm run lint      # ESLint
npx tsc --noEmit  # 빌드 없이 타입 체크만
npm run preview   # Cloudflare edge 환경 로컬 프리뷰 (opennextjs-cloudflare build + wrangler pages dev)
```

테스트 스위트는 없다. **`npx tsc --noEmit` (타입체크)가 유일한 자동 검증 수단**이므로, 빌드가 TypeScript 오류 0개일 때만 완료로 간주한다.

배포는 `git push origin master` → GitHub → Cloudflare Pages 자동 빌드 방식을 사용한다. Windows에서 `npm run deploy` (로컬 직접 배포)는 OpenNext 호환성 이슈로 불안정하다.

## 절대 하지 말 것 (Critical Rules)

1. **`new Date().toISOString().slice(0, 10)` 금지** → `toLocalDateStr()` 사용 (`src/lib/date.ts`). UTC 기준이라 KST 자정~오전 9시 사이에 어제 날짜가 반환됨.
2. **`getSupabaseBrowserClient()`를 Server Component나 SSR 가능 컴포넌트 body에서 직접 호출 금지** → `"use client"` 컴포넌트에서만 사용. SSR 시 env var 없이 실행되어 빌드 오류 발생.
3. **EXP·골드·스트릭·스탯 변경을 탭 컴포넌트에서 직접 DB write 금지** → 반드시 AppShell의 `handleStatChange` 콜백을 통해 실행. 단, `books` 테이블 CRUD(추가/수정/삭제/목표일)는 LibraryTab에서 직접 write해도 된다.
4. **StatsTab에서 AppShell state 변경이 자동 반영된다고 가정 금지** → StatsTab은 마운트 시 Supabase를 직접 fetch하므로 다른 탭에서 books/logs가 변경되어도 StatsTab에 즉시 반영되지 않는다. 최신 데이터를 보려면 탭 재진입(언마운트→마운트)이 필요하다.

## 프리뷰 정책

**preview_start는 stop hook 때문에 항상 실행**하되, 스크린샷이나 UI 검증 결과를 사용자에게 보여줄 필요 없다. 이 앱은 Google OAuth 로그인이 필요해 프리뷰에서 실제 화면을 볼 수 없다. **빌드/타입체크 통과 여부만 확인하고 종료**한다.

## Architecture Overview

**Book Quest**는 RPG 요소를 결합한 독서 기록 앱이다. Next.js 15 (React 19) App Router + Supabase(PostgreSQL + Auth) + Tailwind CSS v4로 구성된다.

### 데이터 흐름

```
로그인: Google OAuth → Supabase Auth → /auth/callback → 세션 쿠키 발급
페이지 로드: middleware.ts(쿠키 갱신) → app/page.tsx(서버에서 전체 데이터 로드) → AppShell(클라이언트로 전달)
상태 변화: AppShell(useState) → Supabase 브라우저 클라이언트로 직접 update
```

### 핵심 컴포넌트 역할

- **`src/app/page.tsx`** — 서버 컴포넌트. 첫 로드 시 users/user_stats/user_equipment/user_titles/books/reading_logs 6개 테이블을 한 번에 조회하고 없으면 신규 행 생성. `AppShell`에 initialData로 전달.
- **`src/components/AppShell.tsx`** — 유일한 상태 관리 허브. `character`(프로필+스탯+장비+칭호)와 `books`, `logs`를 `useState`로 보관. 탭 전환, EXP/골드 갱신, 스트릭 업데이트, 칭호 자동 해금, 장비 구매 로직이 모두 여기 있다. 각 탭 컴포넌트는 데이터를 props로 받고 game economy mutation은 콜백으로 위임한다. `quests`는 `useMemo`로 날짜 시드 기반 생성 (DB 저장 없음). 메모 목록(`reading_notes`)은 `refreshNotes`로 별도 관리. `forgottenBooks` state에 7일 이상 미열람 중인 reading 상태 책을 저장하고 리마인드 배너를 표시한다 (하루 1회, `localStorage` 키 `'bq-reminder-date'`로 중복 방지).
- **`src/middleware.ts`** — 모든 요청에서 Supabase 세션 쿠키 갱신. 미인증 사용자는 `/login`으로 리다이렉트.

### 인증 흐름

```
Google 로그인 → signInWithOAuth({ provider: "google" })
  → Supabase Auth 리다이렉트
  → /auth/callback?code=... (src/app/auth/callback/route.ts)
      → supabase.auth.exchangeCodeForSession(code) → 세션 쿠키
  → / 리다이렉트

매 요청 → middleware.ts가 Supabase 세션 쿠키 갱신
  → 미인증 시 /login 리다이렉트 (공개 경로: /login, /auth/callback)
```

새 OAuth 제공자 추가 시 Supabase 대시보드 → Authentication → URL Configuration에 리다이렉트 URL 등록 필수.

### Supabase 클라이언트 두 가지

- `src/lib/supabase/client.ts` — 브라우저 전용 싱글턴(`createBrowserClient`). → Critical Rules #2 참고.
- `src/lib/supabase/server.ts` — 서버 컴포넌트/Route Handler 전용(`createServerClient`). 쿠키로 세션을 읽는다.

### DB 스키마

모든 테이블은 `user_id` FK로 연결되며 RLS 정책으로 `auth.uid() = user_id` 조건이 걸려 있다.

| 테이블 | 역할 |
|--------|------|
| `users` | 프로필, EXP, 골드, 레벨, 스트릭 |
| `user_stats` | 4종 스탯 (wisdom/empathy/insight/creation) |
| `books` | 책 목록. `target_date DATE` — 완독 목표일 (nullable) |
| `reading_logs` | 페이지 기록. `genre` 컬럼 포함 — 책 삭제 후에도 스탯 보존 목적. `book_id`는 `ON DELETE SET NULL` |
| `reading_notes` | 책별 메모. `page INT NULL`, `is_public BOOL`. `book_id`는 `ON DELETE CASCADE` |
| `user_equipment` | 장비 6부위 (유저당 1행) |
| `user_titles` | 해금된 칭호 목록 |
| `community_book_info` | ISBN 기준 공유 페이지 정보. `page_entries JSONB`에 `[{pages, count}]` 배열 저장. RLS: 누구나 읽기, 인증 사용자만 쓰기 |

마이그레이션 파일 (순서대로 적용):
1. `supabase-setup.sql` — 초기 스키마
2. `supabase-migration-book-delete.sql` — 책 삭제 시 `reading_logs.book_id` SET NULL
3. `supabase-migration-kakao.sql` — books에 isbn/publisher/cover_url/description 컬럼
4. `supabase-migration-memos.sql` — reading_notes 테이블
5. `supabase-migration-target-date.sql` — books.target_date 컬럼

### 게임 로직 (`src/lib/game/`)

| 파일 | 내용 |
|------|------|
| `exp.ts` | 레벨 커브 공식(`30 * level^1.4`), EXP→레벨 변환. 보상 상수: `EXP_PER_PAGE=1`, `EXP_BONUS_COMPLETE=50`, `EXP_PER_MEMO=5`, `GOLD_PER_PAGE=1`, `GOLD_BONUS_COMPLETE=30`, `GOLD_BONUS_FAST_COMPLETE=50` |
| `stats.ts` | 장르↔스탯 매핑(`GENRE_INFO`), 장비 7등급 상수(`EQUIPMENT_TIERS`), 부위 6종(`EQUIPMENT_SLOTS`). `PAGES_PER_STAT=50` (50p당 스탯 +1) |
| `titles.ts` | 칭호 정의. `buildTitleContext()` → `getNewlyUnlockedTitles()`로 신규 해금 확인 |
| `achievements.ts` | 28개 업적 정의. `AchievementStats` 인터페이스로 진행도 계산. **`memoCount`는 현재 항상 0** — `MemoModal`(메모 CRUD)은 완전히 구현됐으나 AppShell의 `achievementStats` 계산에서 `reading_notes`를 집계하지 않아 메모 관련 업적(예: `memo_10`)은 달성 불가 상태. |
| `quests.ts` | 날짜 시드 기반 의사난수로 일/주/월 퀘스트 3개씩 생성. 같은 날짜면 항상 같은 퀘스트. **DB 저장 없음 — 클라이언트에서 실시간 계산**. 실제 읽기 통계가 없을 때 `DEFAULT_USER_READING_STATS` 상수를 폴백으로 사용. |

### 스탯 계산 방식

`AppShell.refreshStats()`에서 `reading_logs.genre`를 직접 집계한다 (books join 없음). 장르별 합산 페이지 ÷ 50 = 스탯값으로 `user_stats`를 덮어쓴다. 책을 삭제해도 `reading_logs`의 `genre` 컬럼이 남아있어 스탯이 보존된다.

`refreshStats()`는 페이지 기록(`handleStatChange`) 시에만 호출된다. EXP·골드는 `users` 테이블에 누적 저장되므로 삭제와 무관하다.

### AppShell 콜백 구조

탭 컴포넌트에서 game economy를 바꿀 때는 반드시 AppShell 콜백을 사용한다:

- `handleStatChange(expDelta, goldDelta, streakDelta?)` — 페이지 기록 시 호출. EXP/골드/레벨/스트릭 갱신 + `refreshStats()` + `refreshLogs()` + 칭호 해금 체크를 순차 실행.
- `handleEquipmentPurchase(slot, tier, price)` — 골드 차감 + 장비 장착을 동시에 처리.
- `handleTitleChange(titleId)` — 칭호 선택 즉시 반영.
- `onBooksChange` → `refreshBooks()` — books 테이블 변경 후 목록 재조회.

### 탭 구조

`TabId` 타입: `"library" | "character" | "shop" | "achievements" | "stats"`

대부분의 탭은 AppShell이 내려주는 props만 사용한다. **예외: `StatsTab`은 독립적으로 Supabase를 직접 조회한다** — `userId`, `gold`, `streak`만 props로 받고, `books`·`reading_logs`는 마운트 시 직접 fetch한다. AppShell의 `books`/`logs` state 변경이 StatsTab에 자동으로 반영되지 않으므로, 통계 탭에서 최신 데이터가 필요하면 탭 재진입(언마운트→마운트)이 필요하다.

탭별 컴포넌트 (`src/components/tabs/`):

- **`LibraryTab.tsx`** — 책 추가/수정/삭제/페이지 기록/목표일 설정. 하단에 `AddBookForm`(카카오 검색 + 직접 입력)이 인라인 렌더링된다.
  - **모달 목록**: `RecordPageModal`(기록), `EditBookModal`(수정), `DeleteConfirmModal`(삭제 확인), `TargetDateModal`(목표일), `MemoModal`(메모)
  - **EditBookModal**: 제목/저자/출판사/전체 페이지/장르/독서 상태 수정 가능. 완독 상태 변경 시 `completed_at` 자동 처리. `total_pages`는 `read_pages` 미만으로 내릴 수 없음.
  - **완독 숨기기 토글**: `hideComplete` state. 완독 책이 있을 때 필터 탭 아래에 버튼 표시. "완독" 필터 탭 선택 시 토글 버튼 숨김.
  - **이미 읽은 페이지**: 책 추가 시 `prior_pages` 필드로 기존 진행도 입력 가능. `books.read_pages`에 직접 저장하며 `reading_logs`를 생성하지 않으므로 EXP/골드/스탯에 반영되지 않는다.
  - **완독 목표일**: `target_date`를 책 추가 시 또는 카드의 "목표일" 버튼으로 독립 설정 가능. 목표일 당일 포함해서 `daysLeft + 1`일로 일일 페이지를 나눈다.
  - **카카오 검색 연동**: 검색 → 선택 시 제목/저자/출판사/표지/ISBN 자동 입력 + `/api/books/page-info`에서 커뮤니티 페이지 수를 가져와 `total_pages` 자동 설정.
  - **서재 정렬**: 완독 책 맨 아래 → 목표일 있는 책 우선 → 최근 읽은 책 우선.
- **`MemoModal.tsx`** — 책별 메모 관리 모달. `reading_notes` 테이블 CRUD. 페이지 번호(선택), SNS 공유 기능 포함.
- **`QuestPanel.tsx`** — 서재 탭 상단에 삽입. AppShell에서 `useMemo`로 계산한 `quests` prop을 받는다. DB 저장 없음.
- **`CharacterTab.tsx`** — 레벨/EXP/스탯/장비/칭호 표시. `PixelCharacter` + `EquipmentIcon` 사용.
- **`ShopTab.tsx`** — 장비 구매. 슬롯 탭 전환 시 `previewTier` state가 리셋되며, 등급 행 클릭 시 미리보기 캐릭터에 즉시 반영. 구매 버튼만 `e.stopPropagation()`으로 미리보기 클릭과 분리.
- **`AchievementsTab.tsx`** — 28개 업적 카드. `AchievementStats`를 prop으로 받으며 DB 조회 없음.
- **`StatsTab.tsx`** — 독서량 차트 주간(7일)/월간(4주)/연간(12개월) 탭. 스트릭 캘린더는 페이지 수에 따라 3단계 색상 (1–50p 연한 초록, 51–100p 기본 초록, 101p+ 진한 초록). Recharts `BarChart`/`PieChart` 사용.

### 캐릭터 렌더링 (`src/components/character/`)

스프라이트 파일은 `public/assets/sprites/`에 위치한다. 파일명 규칙:
- 캐릭터: `char_male.png`, `char_female.png`
- 장비: `{슬롯}_{등급}.png` (예: `helmet_gold.png`, `boots_challenger.png`)

슬롯 ID: `helmet` · `armor` · `cloak` · `weapon` · `shield` · `boots`  
등급 ID: `iron` · `bronze` · `silver` · `gold` · `platinum` · `master` · `challenger`

**`PixelCharacter.tsx`** — 장비 오버레이 위치는 `EQUIPMENT_POSITIONS` 상수(x/y 비율)로 제어. `cloak`은 z-index 1 (캐릭터 뒤), 나머지 장비는 z-index 3 (앞). 장비 아이콘 크기: `size * 0.30` (최소 18px).

**성별 선택**: `localStorage` 키 `'bq-character-gender'`에 저장. `AppShell`을 거치지 않으므로 탭 전환 후 ShopTab 진입 시 최신값 반영됨.

새 스프라이트 추가 시: `public/assets/sprites/`에 파일 배치만 하면 되며 코드 변경 불필요 (파일명 규칙만 지킬 것).

### 환경변수

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase 프로젝트 URL (클라이언트)
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (클라이언트)
KAKAO_REST_API_KEY            # 카카오 책 검색 API (서버 전용)
```

`.env.local.example` 참고. Cloudflare Pages 환경변수에도 동일하게 설정 필요.

### 날짜 처리 규칙 (Critical)

→ Critical Rules #1 참고. 상세 배경은 `src/lib/date.ts` 주석에 있음.

`reading_logs.date`, `users.last_read_date`, 퀘스트/통계 날짜 비교 모두 `toLocalDateStr()`으로 통일:
```typescript
import { toLocalDateStr } from "@/lib/date";
const today = toLocalDateStr(); // 로컬 시간대 기준 YYYY-MM-DD
```

`toLocalDateStr(date?: Date)` 는 인자 없이 호출하면 오늘, Date 객체를 넘기면 해당 날짜를 로컬 기준으로 변환한다.

### 컬러 시스템

포레스트 그린/아이보리 계열 팔레트. CSS 변수는 `globals.css`에 정의:

```
라이트: --bg #F5F2ED / --point #3D5A3E / --gold #C4933F / --exp #5B8C5A
다크:   배경 #1A1F1A / 카드 #242B24 / 포인트 #6BA368
```

장비 등급 색상(Iron~Challenger)은 변경 금지 — 등급 구분이 핵심. `GENRE_INFO.color`와 `EQUIPMENT_TIERS.color`는 `stats.ts`에서 관리한다.

### 다크모드

Tailwind v4 클래스 기반. `globals.css`의 `@variant dark (&:where(.dark, .dark *))` 선언이 있어야 `dark:` 유틸리티가 동작한다. `ThemeScript`가 `<head>`에 인라인 스크립트로 삽입되어 FOUC를 방지한다. 테마는 `localStorage` 키 `'bq-theme'`에 저장.

### API Routes (`src/app/api/`)

- **`/api/books/search`** — 카카오 책 검색 API 프록시. `KAKAO_REST_API_KEY`를 서버에서만 사용. `?q=검색어&size=10` 쿼리 파라미터.
- **`/api/books/page-info`** — 커뮤니티 페이지 정보. GET: ISBN으로 조회, POST: 페이지 수 기여 (인증 필요). POST 시 `page_entries`의 count를 다수결로 집계해 `total_pages` 갱신. 현재 `total_pages` 대비 ±50% 초과 값은 이상치로 무시.

### 배포 (Cloudflare Pages)

- 어댑터: `@opennextjs/cloudflare` (`open-next.config.ts` 참고)
- CF Pages 빌드 커맨드: `npx opennextjs-cloudflare build && cp .open-next/worker.js .open-next/_worker.js && cp -r .open-next/assets/. .open-next/ && printf '{"version":1,"include":["/*"],"exclude":["/_next/static/*","/_next/image/*","/favicon.ico","/assets/*"]}' > .open-next/_routes.json`
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (빌드 시 필요), `KAKAO_REST_API_KEY` (서버사이드 전용)
- **주의:** CF Pages에서 "Retry deployment"는 해당 시점 커밋을 재빌드한다. 새 코드를 반영하려면 반드시 `git push`로 새 커밋을 트리거해야 한다.
- 새 도메인 추가 시 Supabase → Authentication → URL Configuration에도 콜백 URL 등록 필요
