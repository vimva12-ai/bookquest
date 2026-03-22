// 이 파일이 하는 일: 로컬 시간대 기반 날짜 문자열 유틸리티
// UTC가 아닌 로컬 시간대로 "YYYY-MM-DD" 문자열을 반환한다.

export function toLocalDateStr(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
