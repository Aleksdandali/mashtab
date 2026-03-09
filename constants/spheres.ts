export type SphereKey =
  | 'business'
  | 'finance'
  | 'health'
  | 'relationships'
  | 'learning'
  | 'spiritual'
  | 'fun'
  | 'environment';

export interface Sphere {
  key: SphereKey;
  icon: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  color: string;
}

export const SPHERES: Sphere[] = [
  { key: 'business', icon: '💼', nameUk: 'Бізнес', nameRu: 'Бизнес', nameEn: 'Business', color: '#D4A574' },
  { key: 'finance', icon: '💰', nameUk: 'Фінанси', nameRu: 'Финансы', nameEn: 'Finance', color: '#7CB392' },
  { key: 'health', icon: '🏃', nameUk: "Здоров'я", nameRu: 'Здоровье', nameEn: 'Health', color: '#E8976B' },
  { key: 'relationships', icon: '❤️', nameUk: 'Стосунки', nameRu: 'Отношения', nameEn: 'Relationships', color: '#C47B8A' },
  { key: 'learning', icon: '📚', nameUk: 'Навчання', nameRu: 'Обучение', nameEn: 'Learning', color: '#7BB8C9' },
  { key: 'spiritual', icon: '✨', nameUk: 'Духовність', nameRu: 'Духовность', nameEn: 'Spiritual', color: '#9B8AC4' },
  { key: 'fun', icon: '🎉', nameUk: 'Відпочинок', nameRu: 'Отдых', nameEn: 'Fun', color: '#E8C547' },
  { key: 'environment', icon: '🏡', nameUk: 'Середовище', nameRu: 'Окружение', nameEn: 'Environment', color: '#8AC4A0' },
];

export const SPHERE_MAP = Object.fromEntries(
  SPHERES.map((s) => [s.key, s])
) as Record<SphereKey, Sphere>;
