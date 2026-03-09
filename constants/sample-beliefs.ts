import { BeliefCategory } from './categories';

export interface SampleBelief {
  id: number;
  category: BeliefCategory;
  belief_uk: string;
  conviction_uk: string;
}

// 20 beliefs from the catalog — used during onboarding diagnostic (before auth)
// Matches the SQL seed in 001_initial.sql
export const SAMPLE_BELIEFS: SampleBelief[] = [
  // PRICING (3)
  {
    id: 1,
    category: 'pricing',
    belief_uk: 'Я не можу встановлювати високі ціни',
    conviction_uk: 'Якщо я підніму ціни — клієнти підуть до конкурентів',
  },
  {
    id: 2,
    category: 'pricing',
    belief_uk: 'Я маю бути дешевшим за конкурентів',
    conviction_uk: 'Якщо ціна вища — ніхто не купить',
  },
  {
    id: 3,
    category: 'pricing',
    belief_uk: 'Просити гроші — це незручно і соромно',
    conviction_uk: 'Коли кажу ціну — почуваюся жадібним або нав\'язливим',
  },

  // DELEGATION (3)
  {
    id: 4,
    category: 'delegation',
    belief_uk: 'Якщо хочеш зробити добре — зроби сам',
    conviction_uk: 'Інші зроблять гірше, ніж я. Легше самому.',
  },
  {
    id: 5,
    category: 'delegation',
    belief_uk: 'У мене немає часу пояснювати — швидше зробити самому',
    conviction_uk: 'Навчання займає більше часу, ніж просто виконати',
  },
  {
    id: 6,
    category: 'delegation',
    belief_uk: 'Я маю контролювати кожну деталь',
    conviction_uk: 'Якщо не слідкую — все піде не так',
  },

  // FEAR (3)
  {
    id: 7,
    category: 'fear',
    belief_uk: 'Я боюся провалитися і що подумають інші',
    conviction_uk: 'Якщо не вийде — всі побачать і засудять',
  },
  {
    id: 8,
    category: 'fear',
    belief_uk: 'Зараз не найкращий час починати',
    conviction_uk: 'Умови недосконалі — треба почекати кращого моменту',
  },
  {
    id: 9,
    category: 'fear',
    belief_uk: 'Конкуренти сильніші, у мене немає шансів',
    conviction_uk: 'Ринок зайнятий, великі гравці знищать мене',
  },

  // SELF-WORTH (3)
  {
    id: 10,
    category: 'selfworth',
    belief_uk: 'Я недостатньо компетентний для цього рівня',
    conviction_uk: 'Інші знають більше, вони справжні експерти, а я ні',
  },
  {
    id: 11,
    category: 'selfworth',
    belief_uk: 'Хто я такий, щоб брати стільки грошей?',
    conviction_uk: 'Я не заслуговую на такий дохід — є кращі за мене',
  },
  {
    id: 12,
    category: 'selfworth',
    belief_uk: 'Мені потрібно ще більше вчитися перед тим, як почати',
    conviction_uk: 'Ще один курс, ще одна книга — тоді буду готовий',
  },

  // GROWTH (2)
  {
    id: 13,
    category: 'growth',
    belief_uk: 'Мій бізнес не може масштабуватися',
    conviction_uk: 'Це занадто нішево / залежить тільки від мене / ринок замалий',
  },
  {
    id: 14,
    category: 'growth',
    belief_uk: 'Зростання означає більше стресу і менше часу',
    conviction_uk: 'Чим більший бізнес — тим більше проблем і менше свободи',
  },

  // TIME (2)
  {
    id: 15,
    category: 'time',
    belief_uk: 'У мене немає часу на стратегію — треба просто працювати',
    conviction_uk: 'Я занадто зайнятий операційкою щоб думати про майбутнє',
  },
  {
    id: 16,
    category: 'time',
    belief_uk: 'Якщо я зупинюся — бізнес зупиниться',
    conviction_uk: 'Бізнес повністю залежить від мене — я не можу дозволити собі паузу',
  },

  // RELATIONSHIPS (2)
  {
    id: 17,
    category: 'relationships',
    belief_uk: 'Я не можу довіряти партнерам — зрадять',
    conviction_uk: 'Бізнес-партнерство завжди закінчується конфліктом',
  },
  {
    id: 18,
    category: 'relationships',
    belief_uk: 'Клієнти завжди будуть незадоволені — не варто намагатися',
    conviction_uk: 'Не можна догодити всім, тому навіщо намагатися надпостаратися',
  },

  // MONEY (2)
  {
    id: 19,
    category: 'money',
    belief_uk: 'Гроші псують людину',
    conviction_uk: 'Багаті люди — жадібні або нечесні',
  },
  {
    id: 20,
    category: 'money',
    belief_uk: 'Мені завжди буде не вистачати грошей',
    conviction_uk: 'Як тільки більше заробляю — витрати зростають так само',
  },
];

// Category color map for diagnostic UI
export const CATEGORY_COLORS: Record<BeliefCategory, string> = {
  pricing:       '#D4A574',
  delegation:    '#7BB8C9',
  fear:          '#E8976B',
  selfworth:     '#9B8AC4',
  growth:        '#7CB392',
  time:          '#E8C547',
  relationships: '#C47B8A',
  money:         '#7CB392',
};
