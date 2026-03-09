export type BeliefCategory =
  | 'pricing'
  | 'delegation'
  | 'fear'
  | 'selfworth'
  | 'growth'
  | 'time'
  | 'relationships'
  | 'money';

export interface Category {
  key: BeliefCategory;
  icon: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
}

export const CATEGORIES: Category[] = [
  { key: 'pricing', icon: '💲', nameUk: 'Ціноутворення', nameRu: 'Ценообразование', nameEn: 'Pricing' },
  { key: 'delegation', icon: '🤝', nameUk: 'Делегування', nameRu: 'Делегирование', nameEn: 'Delegation' },
  { key: 'fear', icon: '😰', nameUk: 'Страхи', nameRu: 'Страхи', nameEn: 'Fears' },
  { key: 'selfworth', icon: '💎', nameUk: 'Самооцінка', nameRu: 'Самооценка', nameEn: 'Self-worth' },
  { key: 'growth', icon: '📈', nameUk: 'Зростання', nameRu: 'Рост', nameEn: 'Growth' },
  { key: 'time', icon: '⏰', nameUk: 'Час', nameRu: 'Время', nameEn: 'Time' },
  { key: 'relationships', icon: '🧑‍🤝‍🧑', nameUk: 'Стосунки', nameRu: 'Отношения', nameEn: 'Relationships' },
  { key: 'money', icon: '💰', nameUk: 'Гроші', nameRu: 'Деньги', nameEn: 'Money' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<BeliefCategory, Category>;
