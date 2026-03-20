# Book Quest — 개발 진행 상황

> 마지막 업데이트: 2026-03-19
> 다음 대화에서 이 파일을 보여주면 이어서 진행할 수 있습니다.

---

## 프로젝트 위치

```
C:\Users\vimva\Desktop\claude-code-folder\bookquest-app\
```

---

## 완료된 Phase

### ✅ Phase 1 — 핵심 기능 (MVP)
- Next.js 15 + Tailwind CSS + Supabase 프로젝트 세팅
- Supabase 구글 OAuth 로그인 (콜백 라우트 포함)
- 미들웨어 세션 갱신 + 미인증 리다이렉트
- 서재 탭: 책 추가/조회, 필터(전체/읽는 중/완독/읽을 책), 페이지 기록 모달
  - "여기까지 읽었어요" 방식, 자동 완독 처리, 완독 시 하단 정렬 + 회색 처리
  - 기록 시 EXP/골드 미리보기 표시
- 캐릭터 탭: 픽셀 캐릭터 SVG, 레벨/EXP 바, 4종 스탯 바, 장착 장비 슬롯
- 상단 헤더 (골드·레벨·다크모드 토글), 하단 탭 바 5개
- 다크모드 (FOUC 방지 포함, localStorage 'bq-theme')
- Supabase DB 테이블 + RLS 정책 설정 완료 (`supabase-setup.sql`)
- Cloudflare Pages용 `wrangler.jsonc`, `open-next.config.ts` 설정

### ✅ Phase 2 — RPG 시스템
- 상점 탭: 6부위 탭, 7등급 목록, 순차 구매, 구매 시 캐릭터 색상 즉시 변화
- 칭호 시스템: 21개 칭호 정의, 조건 자동 체크/해금, 캐릭터 탭에서 선택 모달
- 업적 탭: 28개 업적 카드, 진행도 바, 달성/미달성 표시
- 퀘스트 패널: 서재 탭 상단, 날짜 시드 기반 일일/주간/월간 퀘스트 자동 생성

### ✅ Phase 3 — 통계 & 폴리시
- 통계 탭:
  - 요약 카드 4개 (총 페이지, 완독 수, 연속 독서일, 골드)
  - 주간 독서량 바 차트 (Recharts)
  - 장르 분포 도넛 차트 + 바 (Recharts)
  - 스트릭 캘린더 (15주 GitHub 잔디 스타일, 순수 SVG)
  - 월별 완독 목록 (클릭 토글)
- 스트릭 자동 갱신: 페이지 기록 시 오늘 첫 기록이면 streak +1
- Cloudflare Pages 배포 준비 완료 (open-next.config.ts)
- 다크모드: Phase 1에서 완료

---

## 미완료 Phase

### ⏳ Phase 3 배포 (남은 작업)
Cloudflare Pages 배포는 **GitHub 연동 방식** 권장 (Windows 로컬 빌드 불안정)

1. bookquest-app을 GitHub에 push
2. Cloudflare Pages → Workers & Pages → Create → Pages → Connect to Git
3. Build 설정:
   - Build command: `npx opennextjs-cloudflare build`
   - Output directory: `.open-next/assets`
4. 환경변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL=https://tpfficaafxeerefavphc.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...` (`.env.local` 참고)
5. Supabase → Authentication → URL Configuration에 Cloudflare 도메인 추가

### ⏳ Phase 4 — 확장 (향후)
- 3차 전직 (Lv.40+)
- 소셜 기능 (독서 길드, 친구)
- 카카오 로그인 추가
- 독서 메모 기능 (현재 memoCount = 0 하드코딩)
- 퀘스트 진행도 DB 연동 (현재 progress = 0 고정)
- 업적 달성 시 골드/장비 실제 지급 로직
- 스트릭 리셋 로직 (어제 기록 없으면 0으로 초기화)

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 15.5 (App Router) |
| 스타일 | Tailwind CSS v4 |
| DB / 인증 | Supabase (PostgreSQL + Auth) |
| 차트 | Recharts |
| 배포 | Cloudflare Pages (OpenNext 어댑터) |
| 패키지 매니저 | npm |

---

## 주요 파일 구조

```
bookquest-app/
├── .env.local                  ← Supabase 환경변수 (gitignore됨)
├── supabase-setup.sql          ← DB 초기 설정 SQL
├── open-next.config.ts         ← Cloudflare 배포 설정
├── wrangler.jsonc              ← Cloudflare Pages 설정
└── src/
    ├── middleware.ts            ← 세션 갱신 + 인증 가드
    ├── types/database.ts        ← 전체 DB 타입
    ├── lib/
    │   ├── supabase/client.ts   ← 브라우저 Supabase
    │   ├── supabase/server.ts   ← 서버 Supabase
    │   ├── game/exp.ts          ← EXP·레벨 계산
    │   ├── game/stats.ts        ← 스탯·장비·장르 상수
    │   ├── game/titles.ts       ← 21개 칭호 정의 + 조건 체크
    │   ├── game/achievements.ts ← 28개 업적 정의
    │   └── game/quests.ts       ← 퀘스트 시드 생성
    ├── app/
    │   ├── layout.tsx           ← 루트 레이아웃
    │   ├── page.tsx             ← 메인 (서버 렌더링, 데이터 로드)
    │   ├── login/page.tsx       ← 구글 로그인
    │   └── auth/callback/       ← OAuth 콜백
    └── components/
        ├── AppShell.tsx         ← 앱 셸 (탭 전환, 상태 관리)
        ├── character/
        │   └── PixelCharacter.tsx
        ├── tabs/
        │   ├── LibraryTab.tsx   ← 서재
        │   ├── CharacterTab.tsx ← 캐릭터 + 칭호 선택
        │   ├── ShopTab.tsx      ← 상점
        │   ├── AchievementsTab.tsx ← 업적
        │   ├── StatsTab.tsx     ← 통계 (Recharts)
        │   └── QuestPanel.tsx   ← 퀘스트 패널
        └── ui/
            ├── Header.tsx
            ├── BottomNav.tsx
            └── ThemeScript.tsx  ← 다크모드 FOUC 방지
```

---

## 알려진 이슈 / 개선 사항

| 항목 | 설명 |
|------|------|
| 퀘스트 진행도 | 현재 항상 0 표시. DB `user_quests` 테이블 연동 필요 |
| 업적 보상 지급 | 달성 시 골드/장비 자동 지급 로직 미구현 |
| 스트릭 리셋 | 어제 독서 안 했을 때 0으로 초기화 로직 없음 |
| 독서 메모 | UI/DB 미구현 (업적 `memoCount` = 0 고정) |
| 월간 퀘스트 pageStats | 이번 달 페이지 집계 함수 미구현 |

---

## 개발 서버 실행

```bash
cd "C:\Users\vimva\Desktop\claude-code-folder\bookquest-app"
npm run dev
# http://localhost:3000 접속
```
