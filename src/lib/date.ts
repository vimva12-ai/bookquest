// 이 파일이 하는 일: 로컬 시간대 기반 날짜 문자열 유틸리티
// UTC가 아닌 로컬 시간대로 "YYYY-MM-DD" 문자열을 반환한다.
// ⚠️ CRITICAL: new Date().toISOString().slice(0, 10) 사용 금지
// UTC 기준이라 KST 자정~오전 9시 사이에 어제 날짜가 반환됨 → 항상 toLocalDateStr()을 사용할 것

export function toLocalDateStr(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
