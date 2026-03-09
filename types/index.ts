import { SphereKey } from '@/constants/spheres';
import { BeliefCategory } from '@/constants/categories';
import { StageKey } from '@/constants/stages';

// ─── Auth / Profile ───────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'standard' | 'premium';
export type Language = 'uk' | 'ru' | 'en';
export type ThemeMode = 'auto' | 'dark' | 'light';

export interface Profile {
  id: string;
  name: string | null;
  language: Language;
  timezone: string | null;
  subscription_tier: SubscriptionTier;
  subscription_expires: string | null;
  onboarding_done: boolean;
  morning_reminder: string;
  evening_reminder: string;
  weekly_checkin_day: number;
  ai_messages_today: number;
  ai_messages_date: string | null;
  theme_mode: ThemeMode;
  created_at: string;
}

// ─── Beliefs ──────────────────────────────────────────────────────────────────

export interface Belief {
  id: number;
  category: BeliefCategory;
  belief_uk: string;
  belief_ru: string;
  belief_en: string;
  conviction_uk: string;
  conviction_ru: string;
  conviction_en: string;
  source_hypothesis_uk: string;
  source_hypothesis_ru: string;
  source_hypothesis_en: string;
  new_belief_template_uk: string;
  new_belief_template_ru: string;
  new_belief_template_en: string;
  experiment_template_uk: string;
  experiment_template_ru: string;
  experiment_template_en: string;
  identity_template_uk: string;
  identity_template_ru: string;
  identity_template_en: string;
  order_index: number;
  is_active: boolean;
}

export interface UserBelief {
  id: string;
  user_id: string;
  belief_id: number | null;
  score: number;
  score_after: number | null;
  current_stage: number;
  completed_stages: Partial<Record<StageKey, boolean>>;
  custom_belief: string | null;
  custom_conviction: string | null;
  custom_source: string | null;
  custom_new_belief: string | null;
  custom_experiment: string | null;
  custom_identity: string | null;
  started_at: string;
  completed_at: string | null;
  // joined
  belief?: Belief;
}

export interface DiagnosticAnswer {
  id: string;
  user_id: string;
  belief_id: number;
  score: number;
  created_at: string;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export type GoalPeriod = 'year' | 'quarter';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  sphere: SphereKey;
  period: GoalPeriod;
  user_belief_id: string | null;
  due_date: string | null;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  completed_at: string | null;
  // computed
  tasks?: Task[];
  progress?: number;
}

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  user_belief_id: string | null;
  title: string;
  date: string;
  is_completed: boolean;
  is_focus: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  // joined
  goal?: Pick<Goal, 'id' | 'title' | 'sphere'>;
  user_belief?: Pick<UserBelief, 'id' | 'custom_belief' | 'belief_id'>;
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export type JournalType = 'stage' | 'morning' | 'evening' | 'weekly' | 'free';

export interface MorningContent {
  intention: string;
  gratitude: [string, string, string];
  belief_of_day: string;
  focus_task_ids: string[];
}

export interface EveningContent {
  wins: [string, string, string];
  learned: string;
  tomorrow: string;
  focus_results: { task_id: string; completed: boolean }[];
}

export interface WeeklyContent {
  wins_of_week: string;
  didnt_work: string;
  focus_next_week: string;
  belief_progress_note: string;
  energy_level: number;
}

export interface StageContent {
  text: string;
}

export interface FreeContent {
  text: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  type: JournalType;
  user_belief_id: string | null;
  stage_key: StageKey | null;
  content: MorningContent | EveningContent | WeeklyContent | StageContent | FreeContent;
  date: string;
  created_at: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export type AIContextType =
  | 'general'
  | 'belief_stage'
  | 'belief_create'
  | 'task_planning'
  | 'weekly_review';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  user_belief_id: string | null;
  stage_key: StageKey | null;
  context_type: AIContextType;
  title: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}
