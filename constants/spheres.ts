import type { IconName } from '@/components/ui/Icon';

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
  icon: IconName;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  color: string;
}

export const SPHERES: Sphere[] = [
  { key: 'business',      icon: 'Briefcase',  nameUk: 'Бізнес',      nameRu: 'Бизнес',     nameEn: 'Business',      color: '#C8FF00' },
  { key: 'finance',       icon: 'Wallet',     nameUk: 'Фінанси',     nameRu: 'Финансы',    nameEn: 'Finance',       color: '#4AE68C' },
  { key: 'health',        icon: 'Activity',   nameUk: "Здоров'я",    nameRu: 'Здоровье',   nameEn: 'Health',        color: '#E8976B' },
  { key: 'relationships', icon: 'Heart',      nameUk: 'Стосунки',    nameRu: 'Отношения',  nameEn: 'Relationships', color: '#E64A5E' },
  { key: 'learning',      icon: 'BookOpen',   nameUk: 'Навчання',    nameRu: 'Обучение',   nameEn: 'Learning',      color: '#7BB8C9' },
  { key: 'spiritual',     icon: 'Sparkles',   nameUk: 'Духовність',  nameRu: 'Духовность', nameEn: 'Spiritual',     color: '#9B8AC4' },
  { key: 'fun',           icon: 'Smile',      nameUk: 'Відпочинок',  nameRu: 'Отдых',      nameEn: 'Fun',           color: '#E6B44A' },
  { key: 'environment',   icon: 'Home',       nameUk: 'Середовище',  nameRu: 'Окружение',  nameEn: 'Environment',   color: '#4AE68C' },
];

export const SPHERE_MAP = Object.fromEntries(
  SPHERES.map((s) => [s.key, s])
) as Record<SphereKey, Sphere>;
