import type { IconName } from '@/components/ui/Icon';

export type StageKey = 'identify' | 'explore' | 'reality' | 'replace' | 'action' | 'identity';

export interface Stage {
  key: StageKey;
  index: number;
  icon: IconName;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  descriptionUk: string;
  questionUk: string;
}

export const STAGES: Stage[] = [
  {
    key: 'identify',
    index: 1,
    icon: 'Search',
    nameUk: 'Виявити',
    nameRu: 'Выявить',
    nameEn: 'Identify',
    descriptionUk: 'Помітити через реакції. Фрази: «ніколи», «завжди», «я так звик»',
    questionUk: 'Наскільки резонує? Де помічаєте цю установку в житті?',
  },
  {
    key: 'explore',
    index: 2,
    icon: 'Microscope',
    nameUk: 'Дослідити',
    nameRu: 'Исследовать',
    nameEn: 'Explore',
    descriptionUk: 'НЕ поспішати. Переконання? Звідки? Яка ВИГОДА від цієї установки?',
    questionUk: 'Яку вигоду дає ця установка? Що б змінилось, якби її не було?',
  },
  {
    key: 'reality',
    index: 3,
    icon: 'Scale',
    nameUk: 'Перевірити',
    nameRu: 'Проверить',
    nameEn: 'Reality check',
    descriptionUk: 'Контрприклади? Факт vs інтерпретація',
    questionUk: 'Коли це НЕ підтвердилось? Наведіть 3 приклади.',
  },
  {
    key: 'replace',
    index: 4,
    icon: 'RefreshCw',
    nameUk: 'Замінити',
    nameRu: 'Заменить',
    nameEn: 'Replace',
    descriptionUk: 'Не прибрати — замінити функціональнішою установкою',
    questionUk: 'Яка нова установка буде правдивою і корисною? Перепишіть своїми словами.',
  },
  {
    key: 'action',
    index: 5,
    icon: 'PlayCircle',
    nameUk: 'Діяти',
    nameRu: 'Действовать',
    nameEn: 'Take action',
    descriptionUk: 'Маленький крок — тріщина в старому патерні. Дія + термін.',
    questionUk: 'Який конкретний крок зробите цього тижня? З якою датою?',
  },
  {
    key: 'identity',
    index: 6,
    icon: 'Sparkles',
    nameUk: 'Ідентичність',
    nameRu: 'Идентичность',
    nameEn: 'Identity',
    descriptionUk: 'Нова територія. Масштаб і нові можливості.',
    questionUk: 'Ким ви є тепер, після цієї трансформації?',
  },
];

export const STAGE_COLORS: Record<StageKey, string> = {
  identify: '#7BB8C9',
  explore:  '#9B8AC4',
  reality:  '#E8976B',
  replace:  '#7CB392',
  action:   '#C8FF00',
  identity: '#E8C547',
};
