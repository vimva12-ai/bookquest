# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 개발 서버 (Turbopack, http://localhost:3000)
npm run build     # 프로덕션 빌드 (TypeScript 체크 포함)
npm run lint      # ESLint
npx tsc --noEmit  # 빌드 없이 타입 체크만
```

빌드는 TypeScript 오류 0개일 때만 완료로 간주한다.

배포는 `git push origin master` → GitHub → Cloudflare Pages 자동 빌드 방식을 사용한다. Windows에서 `npm run deploy` (로컬 직접 배포)는 OpenNext 호환성 이슈로 불안정하다.

## Architecture Overview

**Book Quest**는 RPG 요소를 결합한 독서 기록 앱이다. Next.js 15 App Router + Supabase(PostgreSQL + Auth) + Tailwind CSS v4로 구성된다.

### 데이터 흐름

```
로그인: Google OAuth → Supabase Auth → /auth/callback → 세션 쿠키 발급
페이지 로드: middleware.ts(쿠키 갱신) → app/page.tsx(서버에서 전체 데이터 로드) → AppShell(클라이언트로 전달)
상태 변화: AppShell(useState) → Supabase 브라우저 클라이언트로 직접 update
```

### 핵심 컴포넌트 역할

- **`src/app/page.tsx`** — 서버 컴포넌트. 첫 로드 시 users/user_stats/user_equipment/user_titles/books 5개 테이블을 한 번에 조회하고 없으면 신규 행 생성. `AppShell`에 initialData로 전달.
- **`src/components/AppShell.tsx`** — 유일한 상태 관리 허브. `character`(프로필+스탯+장비+칭호)와 `books`를 `useState`로 보관. 탭 전환, EXP/골드 갱신, 스트릭 업데이트, 칭호 자동 해금, 장비 구매 로직이 모두 여기 있다. 각 탭 컴포넌트는 데이터를 props로 받고 mutation은 콜백으로 위임한다. `quests`는 `useMemo`로 날짜 시드 기반 생성 (DB 저장 없음). 메모 목록(`reading_notes`)은 `refreshNotes`로 별도 관리.
- **`src/middleware.ts`** — 모든 요청에서 Supabase 세션 쿠키 갱신. 미인증 사용자는 `/login`으로 리다이렉트.

### Supabase 클라이언트 두 가지

- `src/lib/supabase/client.ts` — 브라우저 전용 싱글턴(`createBrowserClient`). **컴포넌트 body에서 직접 호출하면 SSR 시 env var 없이 실행되어 빌드 오류가 난다.** 반드시 이벤트 핸들러나 `useEffect` 안에서 호출할 것.
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
| `exp.ts` | 레벨 커브 공식(`30 * level^1.4`), EXP→레벨 변환. 보상 상수: `EXP_PER_PAGE=1`, `EXP_BONUS_COMPLETE=50`, `GOLD_PER_PAGE=1`, `GOLD_BONUS_COMPLETE=30` |
| `stats.ts` | 장르↔스탯 매핑(`GENRE_INFO`), 장비 7등급 상수(`EQUIPMENT_TIERS`), 부위 6종(`EQUIPMENT_SLOTS`) |
| `titles.ts` | 21개 칭호 정의. `buildTitleContext()` → `getNewlyUnlockedTitles()`로 신규 해금 확인 |
| `achievements.ts` | 28개 업적 정의. `isAchieved(def, stats)`로 달성 여부 확인 |
| `quests.ts` | 날짜 시드 기반 의사난수로 일/주/월 퀘스트 3개씩 생성. 같은 날짜면 항상 같은 퀘스트. **DB 저장 없음 — 클라이언트에서 실시간 계산** |

### 스탯 계산 방식

`AppShell.refreshStats()`에서 `reading_logs.genre`를 직접 집계한다 (books join 없음). 장르별 합산 페이지 ÷ 50 = 스탯값으로 `user_stats`를 덮어쓴다. 책을 삭제해도 `reading_logs`의 `genre` 컬럼이 남아있어 스탯이 보존된다.

`refreshStats()`는 페이지 기록(`handleStatChange`) 시에만 호출된다. EXP·골드는 `users` 테이블에 누적 저장되므로 삭제와 무관하다.

### AppShell 콜백 구조

탭 컴포넌트는 순수 UI — 모든 DB write는 AppShell 콜백을 통해 실행된다:

- `handleStatChange(expDelta, goldDelta, streakDelta?)` — 페이지 기록 시 호출. EXP/골드/레벨/스트릭 갱신 + `refreshStats()` + 칭호 해금 체크를 순차 실행.
- `handleEquipmentPurchase(slot, tier, price)` — 골드 차감 + 장비 장착을 동시에 처리.
- `handleTitleChange(titleId)` — 칭호 선택 즉시 반영.

### 캐릭터 렌더링 (`src/components/character/`)

**`PixelCharacter.tsx`** — LPC 스프라이트 + SVG 오버레이로 캐릭터를 렌더링한다.

- **스프라이트 시트**: `public/assets/characters/lpc_entry/png/walkcycle/` — 576×256px, 64×64 프레임, 9열×4행 (행 순서: 북/서/남/동). 행 2(남쪽)의 열 0이 Idle 프레임. CSS `backgroundImage` + `backgroundPosition`으로 레이어를 겹친다.
- **장비별 렌더링 방식**:
  - 갑옷/신발/투구/방패: PNG 스프라이트 레이어 + 슬롯별 `getSlotTierFilter()` CSS 필터로 7등급 색상 표현 (iron=grayscale, bronze=sepia, silver/gold/platinum/master/challenger=hue-rotate 조합).
  - **망토**: SVG 오버레이 (z-index 0, 스프라이트 뒤). 어깨 아래(y=32)에서 시작, 윗부분을 2px→3px→4px→5px로 둥글게 테이퍼링. 발끝(y=57)까지 연장. `TIER_COLOR[tier]`를 `fill`로 주입.
  - **무기**: SVG 오버레이 (z-index 최상단). 롱소드 — 칼날(혈조+하이라이트), 크로스가드(중앙 보석), 가죽 그립(교차 색상), 폼멜. 오른손 위치(x≈19-21, y≈38-46)에 맞춰 배치. `TIER_COLOR[tier]`로 금속 부분 채색.
- **SVG 수정 시 주의**: `shapeRendering="crispEdges"` 필수 (픽셀아트 선명도). 좌표는 64×64 viewBox 기준이며, `size` prop으로 스케일링.

**`EquipmentIcon.tsx`** — 외부 이미지 없이 **인라인 SVG**로 슬롯별 아이콘을 그린다. `fill={TIER_COLOR[tier]}`로 등급 색상을 주입하며 미장착 시 `#C8D0C8`.

- License: LPC 에셋은 CC-BY-SA 3.0. 에셋 수정 시 크레딧(`CreditsModal.tsx`) 업데이트 필요.

### 탭 컴포넌트 구조 (`src/components/tabs/`)

- **`LibraryTab.tsx`** — 책 추가/삭제/페이지 기록/목표일 설정. 기록 시 `handleStatChange` 콜백 호출. 하단에 `AddBookForm`(새 책 추가 폼)이 인라인 렌더링된다.
  - **이미 읽은 페이지**: 책 추가 시 `prior_pages` 필드로 기존 진행도 입력 가능. `books.read_pages`를 초기화하지만 `reading_logs`는 생성하지 않으므로 EXP/골드/스탯에 반영되지 않는다. 이후 `RecordPageModal`로 기록한 페이지만 보상 대상.
  - **완독 목표일**: `target_date`를 책 추가 시 또는 카드의 "목표일" 버튼(`TargetDateModal`)으로 독립 설정 가능. 목표일이 있으면 카드에 "🎯 N일 남음 · 하루 Xp" 표시 (초과=빨강, 3일 이하=주황).
  - **카카오 검색 연동**: 검색 → 선택 시 제목/저자/출판사/표지/ISBN 자동 입력 + `/api/books/page-info`에서 커뮤니티 페이지 수를 가져와 `total_pages` 자동 설정.
- **`MemoModal.tsx`** — 책별 메모 관리 모달. `reading_notes` 테이블 CRUD. 페이지 번호(선택), SNS 공유 기능 포함. `LibraryTab`의 "메모" 버튼으로 열린다.
- **`QuestPanel.tsx`** — 서재 탭 상단에 삽입되는 퀘스트 패널. 일/주/월 탭 전환. AppShell에서 `useMemo`로 계산한 `quests` prop을 받는다. DB 저장 없음.
- **`CharacterTab.tsx`** — 레벨/EXP/스탯/장비/칭호 표시. `PixelCharacter` + `EquipmentIcon` 사용.
- **`ShopTab.tsx`** — 장비 구매. 슬롯 탭 전환 시 `previewTier` state가 리셋되며, 등급 행 클릭 시 미리보기 캐릭터에 즉시 반영. 구매 버튼만 `e.stopPropagation()`으로 미리보기 클릭과 분리.
- **`AchievementsTab.tsx`** — 28개 업적 카드 목록. `isAchieved(def, stats)`로 달성 여부 계산. `AchievementStats`를 prop으로 받으며 DB 조회 없음.
- **`StatsTab.tsx`** — 통계. 독서량 차트는 주간(7일 막대)/월간(4주 막대)/연간(12개월 막대) 탭으로 전환. 각 탭에서 이전 기간 대비 증감률(%) 표시. 스트릭 캘린더는 페이지 수에 따라 3단계 색상 (1–50p 연한 초록, 51–100p 기본 초록, 101p+ 진한 초록).

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

- 어댑터: `@opennextjs/cloudflare` v1.17.1 (`open-next.config.ts` 참고)
- CF Pages 빌드 커맨드: `npx opennextjs-cloudflare build && cp .open-next/worker.js .open-next/_worker.js && cp -r .open-next/assets/. .open-next/ && printf '{"version":1,"include":["/*"],"exclude":["/_next/static/*","/_next/image/*","/favicon.ico","/assets/*"]}' > .open-next/_routes.json`
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (빌드 시 필요), `KAKAO_REST_API_KEY` (서버사이드 전용)
- **주의:** CF Pages에서 "Retry deployment"는 해당 시점 커밋을 재빌드한다. 새 코드를 반영하려면 반드시 `git push`로 새 커밋을 트리거해야 한다.
- 새 도메인 추가 시 Supabase → Authentication → URL Configuration에도 콜백 URL 등록 필요
