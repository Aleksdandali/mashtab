export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function dateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(date);
}

export function formatDayName(date: Date = new Date()): string {
  const name = new Intl.DateTimeFormat('uk-UA', { weekday: 'long' }).format(date);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export type DayPeriod = 'morning' | 'afternoon' | 'evening';

export function getDayPeriod(): DayPeriod {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function getGreeting(name: string | null, period: DayPeriod): string {
  const displayName = name ? `, ${name}` : '';
  switch (period) {
    case 'morning': return `Доброго ранку${displayName}`;
    case 'afternoon': return `Доброго дня${displayName}`;
    case 'evening': return `Добрий вечір${displayName}`;
  }
}

// Short Ukrainian day labels starting Monday
export const DAY_LABELS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export function getWeekDates(refDate: Date): string[] {
  const d = new Date(refDate);
  const day = d.getDay(); // 0=Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return dateISO(nd);
  });
}

// Compute ritual streak: how many consecutive days have a morning journal
export function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (set.has(dateISO(d))) {
      streak++;
    } else if (i > 0) {
      break; // consecutive chain broken
    }
  }
  return streak;
}
