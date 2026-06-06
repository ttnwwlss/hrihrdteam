import { Project, Round } from '../types';

export function getYearsFromData(projects: Project[], rounds: Round[]): number[] {
  const years = new Set<number>();
  years.add(new Date().getFullYear()); // Always include current year

  projects.forEach(p => {
    if (p.is_active) {
      if (p.start_month) {
        const yr = parseInt(p.start_month.split('-')[0], 10);
        if (!isNaN(yr)) years.add(yr);
      }
      if (p.end_month) {
        const yr = parseInt(p.end_month.split('-')[0], 10);
        if (!isNaN(yr)) years.add(yr);
      }
    }
  });

  rounds.forEach(r => {
    if (r.is_active) {
      if (r.start_date) {
        const yr = new Date(r.start_date).getFullYear();
        if (!isNaN(yr)) years.add(yr);
      }
      if (r.end_date) {
        const yr = new Date(r.end_date).getFullYear();
        if (!isNaN(yr)) years.add(yr);
      }
    }
  });

  return Array.from(years).sort((a, b) => b - a); // descending order
}

export function formatDateLabel(startDate: string, endDate: string): string {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;

  if (isNaN(start.getTime())) return '';

  const formatSingle = (date: Date) => `${date.getMonth() + 1}.${date.getDate()}`;

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate()) {
    return formatSingle(start);
  }
  return `${formatSingle(start)} - ${formatSingle(end)}`;
}

export function getMonthAndDay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function isInThisMonth(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

export function isInNextMonth(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  let nextMonth = today.getMonth() + 1;
  let year = today.getFullYear();
  if (nextMonth > 11) {
    nextMonth = 0;
    year += 1;
  }
  return date.getFullYear() === year && date.getMonth() === nextMonth;
}
