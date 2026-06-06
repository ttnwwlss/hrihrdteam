import { Round, Project } from '../types';

export function calculateProjectStatus(rounds: Round[]): '준비중' | '운영중' | '완료' | '보류' | '취소' {
  const activeRounds = rounds.filter(r => r.is_active);
  if (activeRounds.length === 0) {
    return '준비중';
  }

  const statuses = activeRounds.map(r => r.status);

  // If all are canceled
  if (statuses.every(s => s === '취소')) {
    return '취소';
  }

  // If all are completed or canceled/hold, with at least one completed
  const nonCancelled = statuses.filter(s => s !== '취소');
  if (nonCancelled.length > 0 && nonCancelled.every(s => s === '완료')) {
    return '완료';
  }

  // If any are operating
  if (statuses.includes('운영중')) {
    return '운영중';
  }

  // Otherwise, if any is prepared or there's mixed prepared/completed
  if (statuses.includes('준비중')) {
    return '준비중';
  }

  // Fallback
  return '준비중';
}
