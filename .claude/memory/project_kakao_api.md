---
name: 카카오 API + 커뮤니티 페이지 DB 연동
description: 카카오 책 검색 API와 커뮤니티 페이지 공유 DB 구현 완료 (2026-03-20)
type: project
---

카카오 책 검색 API 연동 및 커뮤니티 페이지 DB 추가 완료.

**Why:** 새 책 추가 시 수동 입력만 지원하던 걸 카카오 API로 자동 검색/채움 + 다른 사용자 페이지 수 공유로 개선.

**How to apply:** 이 기능은 이미 배포됨. 관련 파일 수정 시 아래 구조 참고.

## 구현 내용
- `src/app/api/books/search/route.ts` — 카카오 API 프록시 (KAKAO_REST_API_KEY 서버사이드 전용)
- `src/app/api/books/page-info/route.ts` — community_book_info GET/POST
- `src/types/database.ts` — Book에 isbn/publisher/cover_url/description 추가, CommunityBookInfo 타입 추가
- `src/components/tabs/LibraryTab.tsx` — AddBookForm 카카오 검색 UI + 커뮤니티 힌트
- `supabase-migration-kakao.sql` — DB 마이그레이션 (Supabase에 이미 적용됨)

## 환경변수
- `KAKAO_REST_API_KEY` — .env.local 및 Cloudflare Pages에 설정 완료

## community_book_info 테이블
- isbn TEXT PRIMARY KEY
- page_entries JSONB: [{pages, count}] 배열 (다수결로 total_pages 결정)
- contributor_count INT: 기여 사용자 수
- RLS: 누구나 읽기, 인증 사용자만 쓰기
