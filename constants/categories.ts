import type { IconName } from '@/components/ui/Icon';

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
  icon: IconName;
  nameUk: string;
  nameRu: string;
  nameEn: string;
}

export const CATEGORIES: Category[] = [
  { key: 'pricing',       icon: 'Coins',        nameUk: 'Ціноутворення', nameRu: 'Ценообразование', nameEn: 'Pricing' },
  { key: 'delegation',    icon: 'Users',         nameUk: 'Делегування',   nameRu: 'Делегирование',   nameEn: 'Delegation' },
  { key: 'fear',          icon: 'ShieldAlert',   nameUk: 'Страхи',        nameRu: 'Страхи',          nameEn: 'Fears' },
  { key: 'selfworth',     icon: 'Award',         nameUk: 'Самооцінка',    nameRu: 'Самооценка',      nameEn: 'Self-worth' },
  { key: 'growth',        icon: 'TrendingUp',    nameUk: 'Зростання',     nameRu: 'Рост',            nameEn: 'Growth' },
  { key: 'time',          icon: 'Clock',         nameUk: 'Час',           nameRu: 'Время',           nameEn: 'Time' },
  { key: 'relationships', icon: 'Heart',         nameUk: 'Стосунки',      nameRu: 'Отношения',       nameEn: 'Relationships' },
  { key: 'money',         icon: 'Wallet',        nameUk: 'Гроші',         nameRu: 'Деньги',          nameEn: 'Money' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<BeliefCategory, Category>;
