# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 개발 서버 (Turbopack, http://localhost:3000)
npm run build     # 프로덕션 빌드 (TypeScript 체크 포함)
npm run lint      # ESLint
npm run deploy    # Cloudflare Pages 배포 (opennextjs-cloudflare build → wrangler pages deploy)
npm run preview   # Cloudflare Pages 로컬 미리보기
npx tsc --noEmit  # 빌드 없이 타입 체크만
```

빌드는 TypeScript 오류 0개일 때만 완료로 간주한다.

Windows에서 `npm run deploy`는 OpenNext 호환성 이슈로 불안정하다. 배포는 GitHub → Cloudflare Pages 자동 빌드 방식을 권장한다.

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

- `src/lib/supabase/client.ts` — 브라우저 전용 싱글턴(`createBrowserClient`). 클라이언트 컴포넌트에서 사용. **컴포넌트 body에서 직접 호출하면 SSR 시 env var 없이 실행되어 빌드 오류가 난다.** 반드시 이벤트 핸들러나 `useEffect` 안에서 호출할 것.
- `src/lib/supabase/server.ts` — 서버 컴포넌트/Route Handler 전용(`createServerClient`). 쿠키로 세션을 읽는다.

### 게임 로직 (`src/lib/game/`)

| 파일 | 내용 |
|------|------|
| `exp.ts` | 레벨 커브 공식(`30 * level^1.4`), EXP→레벨 변환, 진행도(0~1) |
| `stats.ts` | 장르↔스탯 매핑, 장비 7등급 상수(`EQUIPMENT_TIERS`), 부위 6종(`EQUIPMENT_SLOTS`) |
| `titles.ts` | 21개 칭호 정의 + `check(ctx)` 조건 함수. `buildTitleContext()`로 컨텍스트 생성 후 `getNewlyUnlockedTitles()`로 신규 해금 목록 반환 |
| `achievements.ts` | 28개 업적 정의 + `getProgress(stats)` 함수. `isAchieved(def, stats)`로 달성 여부 확인 |
| `quests.ts` | 날짜 시드 기반 의사난수로 일/주/월 퀘스트 3개씩 생성. 같은 날짜면 항상 같은 퀘스트 |

### 스탯 계산 방식

스탯은 DB에 직접 저장하지 않고 `reading_logs`를 집계해 재계산한다. `AppShell.refreshStats()`에서 `reading_logs`의 장르별 합산 페이지 ÷ 50 = 스탯값으로 덮어쓴다.

### Firestore 대신 Supabase

모든 데이터는 `users/{uid}` 중심의 FK 구조다. RLS 정책으로 `auth.uid() = user_id` 조건이 모든 테이블에 걸려 있다. 테이블 초기 설정은 `supabase-setup.sql`을 SQL Editor에서 실행.

### 다크모드

Tailwind v4 클래스 기반 다크모드. `@variant dark (&:where(.dark, .dark *))` 선언이 `globals.css`에 있어야 `dark:` 유틸리티가 동작한다. `ThemeScript`가 `<head>`에 인라인 스크립트로 삽입되어 FOUC를 방지한다. 테마는 `localStorage` 키 `'bq-theme'`에 저장.

### 배포 (Cloudflare Pages)

- 어댑터: `@opennextjs/cloudflare` (`open-next.config.ts` 참고)
- 설정: `wrangler.jsonc`
- 배포 시 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수 필요
- 새 도메인 추가 시 Supabase → Authentication → URL Configuration에도 콜백 URL 등록 필요
