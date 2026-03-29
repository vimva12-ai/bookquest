---
name: preview_not_needed
description: preview_start는 stop hook 때문에 실행하지만, 스크린샷/UI 확인은 불필요 — 로그인 필요 앱
type: feedback
---

preview_start는 stop hook 요구로 항상 실행해야 하지만, 스크린샷이나 UI 검증 결과를 사용자에게 보여주지 말 것.

**Why:** bookquest-app은 로그인(Google OAuth)이 필요해 preview에서 실제 앱 화면을 볼 수 없어 토큰 낭비.

**How to apply:** 코드 수정 후 preview_start는 실행하되, preview_screenshot/preview_snapshot 등 추가 검증 단계는 건너뜀. 빌드/타입체크 통과 여부만 보고.
