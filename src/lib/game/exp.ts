// 이 파일이 하는 일: EXP·레벨 계산 함수 모음 (PRD 4-1 기반)

// 레벨 N에 도달하기까지 필요한 누적 EXP
// 공식: 레벨 2부터 각 레벨마다 round(30 * level^1.4)를 합산
export function getExpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += Math.round(30 * Math.pow(i, 1.4));
  }
  return total;
}

// 현재 레벨에서 다음 레벨까지 필요한 EXP
export function getExpToNextLevel(level: number): number {
  return Math.round(30 * Math.pow(level + 1, 1.4));
}

// 누적 EXP로 현재 레벨 계산
export function getLevelFromExp(totalExp: number): number {
  let level = 1;
  while (totalExp >= getExpRequiredForLevel(level + 1)) {
    level++;
    if (level >= 100) break; // 안전장치
  }
  return level;
}

// 현재 레벨 내 진행도 (0~1)
export function getExpProgress(totalExp: number, level: number): number {
  const currentLevelExp = getExpRequiredForLevel(level);
  const nextLevelExp = getExpRequiredForLevel(level + 1);
  if (nextLevelExp === currentLevelExp) return 1;
  return (totalExp - currentLevelExp) / (nextLevelExp - currentLevelExp);
}

// 페이지 읽기로 얻는 EXP (1p = 1 EXP)
export const EXP_PER_PAGE = 1;

// 완독 보너스 EXP
export const EXP_BONUS_COMPLETE = 50;

// 메모 작성 EXP
export const EXP_PER_MEMO = 5;

// 골드: 1p = 1G, 완독 +30G
export const GOLD_PER_PAGE = 1;
export const GOLD_BONUS_COMPLETE = 30;
