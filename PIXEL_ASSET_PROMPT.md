# Book Quest — 픽셀아트 에셋 교체 + 라이선스 표기 요청

## 요청 사항

현재 SVG로 그려진 도트 캐릭터와 장비를 다운로드한 픽셀아트 에셋 이미지로 교체해줘.
라이선스 표기도 앱 내에 추가해줘.

## 에셋 파일 위치

```
public/assets/characters/  → LPC Medieval Fantasy 캐릭터 스프라이트
public/assets/equipment/   → MedievalMore 장비 아이콘
```

## 교체 내용

### 캐릭터
- 현재 SVG로 그린 도트 캐릭터를 LPC 스프라이트 이미지로 교체
- 장비 등급에 따라 해당 등급의 장비 이미지를 레이어로 표시
- LPC 에셋은 모듈식이라 몸통/갑옷/투구/무기 등을 레이어로 겹칠 수 있음
- 기본 상태 (idle) 스프라이트를 캐릭터 탭에 표시

### 장비 슬롯
- 캐릭터 탭의 장비 슬롯 6칸에 해당 부위의 아이콘 이미지 표시
- 현재 이모지(⛑️🛡️🧣⚔️🔰👢)를 실제 픽셀아트 아이콘으로 교체

### 상점
- 등급별 장비 아이콘을 목록에 표시
- 구매 가능한 장비의 미리보기 이미지로 활용

## 라이선스 표기 (필수!)

앱 내에 **크레딧/라이선스 페이지**를 추가해줘.

### 표기 위치
- 설정 또는 앱 정보 페이지에 "크레딧" 섹션 추가
- 또는 앱 하단에 작은 ⓘ 버튼 → 크레딧 모달

### 표기 내용

```
📜 크레딧 / Credits

이 앱에서 사용된 에셋의 저작권은 각 원작자에게 있습니다.

[캐릭터 스프라이트]
LPC Medieval Fantasy Character Sprites
by wulax (based on work by Redshrike)
License: CC-BY-SA 3.0 / CC-BY 3.0
Source: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites

[장비 아이콘]
Free Pixel Art Weapon Icons
by MedievalMore
License: 상업/비상업 사용 가능 (수정/리컬러 허용)
Source: https://medievalmore.itch.io/free-weapon-icons

[도서 데이터]
도서 검색: Kakao Developers (Daum 책 검색 API)
https://developers.kakao.com
```

### 구현 방식 제안
- 앱 헤더의 설정(⚙️) 아이콘 또는 프로필 메뉴에 "크레딧" 항목 추가
- 클릭 시 크레딧 모달 또는 페이지 표시
- 각 에셋 출처에 하이퍼링크 포함
- 디자인은 앱의 전체 테마(차분한 초록 서재)에 맞게

## 주의사항

- 에셋 이미지가 앱 스타일과 자연스럽게 어울리도록 크기/배치 조정
- 에셋 파일이 없거나 경로가 다르면 알려줘 (내가 확인할게)
- 기존 기능은 건드리지 말고 이미지와 크레딧만 추가해줘
- CC-BY-SA 라이선스는 수정본도 같은 라이선스로 공유해야 하므로, 에셋을 수정한 경우 이를 크레딧에 명시
