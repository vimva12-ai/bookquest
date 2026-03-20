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
- **`src/components/AppShell.tsx`** — 유일한 상태 관리 허브. `character`(프로필+스탯+장비+칭호)와 `books`를 `useState`로 보관. 탭 전환, EXP/골드 갱신, 스트릭 업데이트, 칭호 자동 해금, 장비 구매 로직이 모두 여기 있다. 각 탭 컴포넌트는 데이터를 props로 받고 mutation은 콜백으로 위임한다.
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
| `books` | 책 목록 |
| `reading_logs` | 페이지 기록. `genre` 컬럼 포함 — 책 삭제 후에도 스탯 보존 목적. `book_id`는 `ON DELETE SET NULL` |
| `user_equipment` | 장비 6부위 (유저당 1행) |
| `user_titles` | 해금된 칭호 목록 |
| `community_book_info` | ISBN 기준 공유 페이지 정보. `page_entries JSONB`에 `[{pages, count}]` 배열 저장. RLS: 누구나 읽기, 인증 사용자만 쓰기 |

초기 설정: `supabase-setup.sql` / 책 삭제 마이그레이션: `supabase-migration-book-delete.sql` / 카카오 API 마이그레이션: `supabase-migration-kakao.sql`

### 게임 로직 (`src/lib/game/`)

| 파일 | 내용 |
|------|------|
| `exp.ts` | 레벨 커브 공식(`30 * level^1.4`), EXP→레벨 변환. 보상 상수: `EXP_PER_PAGE=1`, `EXP_BONUS_COMPLETE=50`, `GOLD_PER_PAGE=1`, `GOLD_BONUS_COMPLETE=30` |
| `stats.ts` | 장르↔스탯 매핑(`GENRE_INFO`), 장비 7등급 상수(`EQUIPMENT_TIERS`), 부위 6종(`EQUIPMENT_SLOTS`) |
| `titles.ts` | 21개 칭호 정의. `buildTitleContext()` → `getNewlyUnlockedTitles()`로 신규 해금 확인 |
| `achievements.ts` | 28개 업적 정의. `isAchieved(def, stats)`로 달성 여부 확인 |
| `quests.ts` | 날짜 시드 기반 의사난수로 일/주/월 퀘스트 3개씩 생성. 같은 날짜면 항상 같은 퀘스트 |

### 스탯 계산 방식

`AppShell.refreshStats()`에서 `reading_logs.genre`를 직접 집계한다 (books join 없음). 장르별 합산 페이지 ÷ 50 = 스탯값으로 `user_stats`를 덮어쓴다. 책을 삭제해도 `reading_logs`의 `genre` 컬럼이 남아있어 스탯이 보존된다.

`refreshStats()`는 페이지 기록(`handleStatChange`) 시에만 호출된다. EXP·골드는 `users` 테이블에 누적 저장되므로 삭제와 무관하다.

### AppShell 콜백 구조

탭 컴포넌트는 순수 UI — 모든 DB write는 AppShell 콜백을 통해 실행된다:

- `handleStatChange(expDelta, goldDelta, streakDelta?)` — 페이지 기록 시 호출. EXP/골드/레벨/스트릭 갱신 + `refreshStats()` + 칭호 해금 체크를 순차 실행.
- `handleEquipmentPurchase(slot, tier, price)` — 골드 차감 + 장비 장착을 동시에 처리.
- `handleTitleChange(titleId)` — 칭호 선택 즉시 반영.

### 픽셀아트 에셋 (`public/assets/`)

- **`characters/lpc_entry/png/walkcycle/`** — LPC Medieval Fantasy 스프라이트. 576×256px, 64×64 프레임, 9열×4행 (행 순서: 북/서/남/동). 행 2(남쪽)의 열 0이 플레이어를 향한 Idle 프레임. `PixelCharacter.tsx`가 CSS `backgroundImage` + `backgroundPosition`으로 레이어를 겹쳐 표시. 장비 등급별로 다른 레이어 파일을 추가하며, platinum 이상은 CSS `filter`로 색조 변환.
- **`equipment/30FreeIcons/`** — 현재 미사용(참고용 보관). `EquipmentIcon.tsx`는 외부 이미지 없이 **인라인 SVG**로 슬롯별 아이콘을 그린다. `fill={TIER_COLOR[tier]}`로 등급 색상을 주입하며 미장착 시 `#C8D0C8`.
- License: LPC 에셋은 CC-BY-SA 3.0. 에셋 수정 시 크레딧(`CreditsModal.tsx`) 업데이트 필요.

### 탭 컴포넌트 구조 (`src/components/tabs/`)

- **`LibraryTab.tsx`** — 책 추가/삭제, 페이지 기록. 기록 시 `handleStatChange` 콜백 호출.
- **`CharacterTab.tsx`** — 레벨/EXP/스탯/장비/칭호 표시. `PixelCharacter` + `EquipmentIcon` 사용.
- **`ShopTab.tsx`** — 장비 구매. 슬롯 탭 전환 시 `previewTier` state가 리셋되며, 등급 행 클릭 시 미리보기 캐릭터에 즉시 반영. 구매 버튼만 `e.stopPropagation()`으로 미리보기 클릭과 분리.
- **`StatsTab.tsx`** — 통계. 독서량 차트는 주간(7일 막대)/월간(4주 막대)/연간(12개월 막대) 탭으로 전환. 각 탭에서 이전 기간 대비 증감률(%) 표시. `reading_logs`를 날짜 Map으로 변환 후 집계.

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
