import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { UserBelief } from '@/types';
import { BeliefCategory } from '@/constants/categories';
import { StageKey } from '@/constants/stages';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getBeliefTitle(ub: UserBelief, lang: 'uk' | 'ru' | 'en' = 'uk'): string {
  if (ub.belief_id && ub.belief) {
    return (ub.belief as Record<string, string>)[`belief_${lang}`] ?? ub.belief.belief_uk;
  }
  return ub.custom_belief ?? 'Кастомна установка';
}

export function getBeliefCategory(ub: UserBelief): BeliefCategory | null {
  if (ub.belief) return ub.belief.category as BeliefCategory;
  return null;
}

export function getCompletedStages(ub: UserBelief): number {
  return Object.values(ub.completed_stages ?? {}).filter(Boolean).length;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface CustomBeliefInput {
  belief: string;
  conviction: string;
  source?: string;
  newBelief?: string;
  experiment?: string;
  identity?: string;
  score: number;
}

interface BeliefsState {
  beliefs: UserBelief[];
  loading: boolean;
  fetchBeliefs: () => Promise<void>;
  fetchBeliefById: (id: string) => Promise<UserBelief | null>;
  advanceStage: (beliefId: string, stageKey: StageKey, journalText: string) => Promise<void>;
  completeWithScore: (beliefId: string, scoreAfter: number) => Promise<void>;
  createCustomBelief: (data: CustomBeliefInput) => Promise<UserBelief | null>;
  clear: () => void;
}

export const useBeliefs = create<BeliefsState>((set, get) => ({
  beliefs: [],
  loading: false,

  fetchBeliefs: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loading: false }); return; }

    const { data } = await supabase
      .from('user_beliefs')
      .select('*, belief:beliefs(*)')
      .eq('user_id', user.id)
      .is('completed_at', null)
      .order('started_at', { ascending: false });

    set({ beliefs: data ?? [], loading: false });
  },

  advanceStage: async (beliefId, stageKey, journalText) => {
    const { beliefs } = get();
    const ub = beliefs.find((b) => b.id === beliefId);
    if (!ub) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const completedStages = { ...ub.completed_stages, [stageKey]: true };
    const completedKeys = Object.keys(completedStages) as StageKey[];
    const nextStage = Math.min(ub.current_stage + 1, 6);

    // Save journal entry
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      type: 'stage',
      user_belief_id: beliefId,
      stage_key: stageKey,
      content: { text: journalText },
    });

    // Update user_belief
    const { data: updated } = await supabase
      .from('user_beliefs')
      .update({ completed_stages: completedStages, current_stage: nextStage })
      .eq('id', beliefId)
      .select('*, belief:beliefs(*)')
      .single();

    if (updated) {
      set({ beliefs: beliefs.map((b) => (b.id === beliefId ? updated : b)) });
    }
  },

  completeWithScore: async (beliefId, scoreAfter) => {
    const { beliefs } = get();
    const now = new Date().toISOString();

    const { data: updated } = await supabase
      .from('user_beliefs')
      .update({ score_after: scoreAfter, completed_at: now })
      .eq('id', beliefId)
      .select('*, belief:beliefs(*)')
      .single();

    if (updated) {
      set({ beliefs: beliefs.filter((b) => b.id !== beliefId) });
    }
  },

  fetchBeliefById: async (id) => {
    const { beliefs } = get();
    const cached = beliefs.find((b) => b.id === id);
    if (cached) return cached;

    const { data } = await supabase
      .from('user_beliefs')
      .select('*, belief:beliefs(*)')
      .eq('id', id)
      .single();

    if (data) {
      set({ beliefs: [...get().beliefs, data] });
    }
    return data ?? null;
  },

  createCustomBelief: async (input) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('user_beliefs')
      .insert({
        user_id: user.id,
        belief_id: null,
        score: input.score,
        current_stage: 1,
        completed_stages: {},
        custom_belief: input.belief,
        custom_conviction: input.conviction,
        custom_source: input.source ?? null,
        custom_new_belief: input.newBelief ?? null,
        custom_experiment: input.experiment ?? null,
        custom_identity: input.identity ?? null,
      })
      .select('*, belief:beliefs(*)')
      .single();

    if (data) {
      set({ beliefs: [data, ...get().beliefs] });
    }
    return data ?? null;
  },

  clear: () => set({ beliefs: [] }),
}));
