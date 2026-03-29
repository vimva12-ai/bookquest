# Book Quest — 도서 검색 API 연동 + 커뮤니티 페이지 DB 추가 요청

## 요청 사항

현재 Book Quest 앱의 "새 책 추가" 기능에 두 가지를 추가해줘.

1. **카카오 책 검색 API** 연동 — 제목 검색 시 자동완성
2. **커뮤니티 페이지 DB** — 사용자들이 입력한 페이지 수를 공유 DB에 누적

---

## 1. 카카오 책 검색 API

### API 정보
- 엔드포인트: `GET https://dapi.kakao.com/v3/search/book`
- 인증: 헤더에 `Authorization: KakaoAK {REST_API_KEY}`
- 응답: JSON
- 주요 파라미터:
  - `query`: 검색어 (필수)
  - `size`: 결과 수 (1-50, 기본 10)
  - `page`: 페이지 번호 (1-100)
  - `target`: 검색 필드 제한 (title / isbn / publisher / person)
- 응답 필드:
  - `title`: 책 제목
  - `authors[]`: 저자 배열
  - `publisher`: 출판사
  - `isbn`: ISBN (10자리 13자리 공백 구분)
  - `thumbnail`: 표지 이미지 URL
  - `contents`: 책 소개
  - `datetime`: 출판일
- 문서: https://developers.kakao.com/docs/latest/ko/daum-search/dev-guide#search-book
- 키 발급: https://developers.kakao.com → 앱 생성 → REST API 키 (즉시 발급)

### 주의사항
- **페이지 수(pageCount)는 카카오 API에서 제공하지 않음** → 커뮤니티 DB로 해결
- API 키는 반드시 서버사이드(Next.js API Route)에서만 사용, 프론트엔드에 노출 금지

### 환경 변수
```
KAKAO_REST_API_KEY=발급받은_카카오_키
```

### 서버 API Route
```
/api/books/search?q=검색어&size=10  → 카카오 API 호출 후 결과 반환
```

---

## 2. 커뮤니티 페이지 DB (Supabase)

사용자가 입력한 페이지 수를 ISBN 기준으로 공유 DB에 저장.
같은 ISBN의 책을 다른 사용자가 등록할 때 자동으로 페이지 수를 추천해주는 구조.

### 새 테이블 추가
```sql
-- 커뮤니티 페이지 정보 (ISBN 기준 공유)
community_book_info (
  isbn TEXT PRIMARY KEY,           -- ISBN13 (공백 제거한 13자리)
  title TEXT,                      -- 책 제목 (참고용)
  total_pages INT,                 -- 가장 많이 입력된 페이지 수
  page_entries JSONB DEFAULT '[]', -- 사용자들이 입력한 값 배열 [{pages: 280, count: 5}, ...]
  contributor_count INT DEFAULT 1, -- 기여한 사용자 수
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### 기존 books 테이블에 컬럼 추가
```sql
ALTER TABLE books ADD COLUMN isbn TEXT;
ALTER TABLE books ADD COLUMN publisher TEXT;
ALTER TABLE books ADD COLUMN cover_url TEXT;
ALTER TABLE books ADD COLUMN description TEXT;
```

### 커뮤니티 DB 로직

**페이지 수 저장 (책 등록 시):**
1. 사용자가 책을 등록하면서 페이지 수를 입력
2. 해당 ISBN으로 community_book_info 조회
3. 이미 있으면 → page_entries에 해당 페이지 수의 count +1, contributor_count +1
4. 없으면 → 새 레코드 생성
5. total_pages는 가장 많은 count를 가진 페이지 수로 갱신 (다수결 원칙)

**페이지 수 추천 (책 등록 시):**
1. 카카오 API에서 ISBN 가져옴
2. 해당 ISBN으로 community_book_info 조회
3. 데이터가 있으면 → "다른 독서가 N명이 이 책을 280p로 기록했어요" 표시 + 자동 채움
4. 데이터가 없으면 → 페이지 수 입력란 비워두고 직접 입력 요청

### 서버 API Route
```
/api/books/page-info?isbn=9788937460449  → community_book_info에서 조회
```

---

## 3. UI 흐름

```
[새 책 추가] 버튼 클릭
    ↓
검색 입력창 표시 (디바운스 300ms)
    ↓
사용자가 "데미안" 입력
    ↓
카카오 API 검색 → 결과 드롭다운 표시
  각 항목: [표지 썸네일] 제목 / 저자 / 출판사
    ↓
사용자가 결과 하나 클릭
    ↓
자동 채움:
  ✅ 제목 (카카오)
  ✅ 저자 (카카오)
  ✅ 출판사 (카카오)
  ✅ 표지 이미지 (카카오)
  ✅ ISBN (카카오)

  📄 페이지 수:
    → 커뮤니티 DB에 데이터 있으면:
      "📚 다른 독서가 12명이 280p로 기록했어요" + 자동 채움
      (수정 가능)
    → 없으면:
      빈 입력란 + "페이지 수를 입력해주세요 (책 뒷면에서 확인 가능)"
    
  🎮 장르: 사용자 직접 선택 (스탯 연동)
    ↓
[추가하기] 버튼
    ↓
서재에 등록 + 커뮤니티 DB에 페이지 수 기여
```

---

## 4. 예외 처리

- **API 호출 실패:** "검색에 실패했어요. 직접 입력할 수 있어요" + 수동 입력 폼 표시
- **검색 결과 없음:** "검색 결과가 없어요. 직접 입력해주세요"
- **커뮤니티 DB에 페이지 수 없음:** 입력란 비움 + 안내 문구
- **커뮤니티 DB에 서로 다른 페이지 수가 여럿:** 가장 많이 입력된 값을 기본값으로 채우되, "280p (12명) / 284p (3명)" 처럼 선택지 표시
- **네트워크 오류:** 기존 수동 입력 방식으로 폴백
- **기존 수동 입력 방식은 반드시 유지** ("직접 입력하기" 링크)

---

## 5. 디자인

- 검색 바: 기존 "새 책 추가" 폼 상단에 배치
- 검색 결과 드롭다운: 카드 스타일, 표지 썸네일 + 제목 + 저자
- 커뮤니티 페이지 추천: 페이지 수 입력란 아래에 파란색 힌트 박스
- "직접 입력하기" 링크: 검색 바 아래에 작게 표시
- 로딩 중: 스켈레톤 UI 또는 스피너
- 페이지 수 기여 시: 토스트 "📚 페이지 정보가 공유되었어요! 다른 독서가에게 도움이 됩니다"

---

## 6. 보안 및 주의사항

- 카카오 API 키는 서버사이드에서만 사용 (프론트엔드 노출 금지)
- 커뮤니티 DB에 RLS(Row Level Security) 적용: 누구나 읽기 가능, 인증된 사용자만 쓰기 가능
- 악의적 페이지 수 입력 방지: 1~9999 범위 제한 + 극단적 이상치는 무시 (기존 값 대비 ±50% 초과 시 별도 저장하되 추천에서 제외)
- 표지 이미지는 카카오 thumbnail URL 직접 참조 (추후 Supabase Storage 복사 고려)
