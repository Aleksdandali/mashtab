import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Goal, Task } from '@/types';
import { SphereKey } from '@/constants/spheres';

export interface CreateGoalInput {
  title: string;
  sphere: SphereKey;
  period: 'year' | 'quarter';
  user_belief_id?: string | null;
  due_date?: string | null;
}

function computeProgress(tasks: Task[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.is_completed).length;
  return Math.round((done / tasks.length) * 100);
}

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  fetchGoals: () => Promise<void>;
  createGoal: (data: CreateGoalInput) => Promise<Goal | null>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  clear: () => void;
}

export const useGoals = create<GoalsState>((set, get) => ({
  goals: [],
  loading: false,

  fetchGoals: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loading: false }); return; }

    const { data } = await supabase
      .from('goals')
      .select('*, tasks(*), user_belief:user_beliefs(id, custom_belief, belief_id, belief:beliefs(belief_uk))')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('sort_order', { ascending: true });

    const goalsWithProgress = (data ?? []).map((g) => ({
      ...g,
      progress: computeProgress(g.tasks ?? []),
    }));

    set({ goals: goalsWithProgress, loading: false });
  },

  createGoal: async (input) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { goals } = get();
    const { data } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: input.title,
        sphere: input.sphere,
        period: input.period,
        user_belief_id: input.user_belief_id ?? null,
        due_date: input.due_date ?? null,
        sort_order: goals.length,
        is_completed: false,
      })
      .select('*, tasks(*)')
      .single();

    if (data) {
      const goalWithProgress = { ...data, progress: 0 };
      set({ goals: [...get().goals, goalWithProgress] });
      return goalWithProgress;
    }
    return null;
  },

  updateGoal: async (id, data) => {
    const { goals } = get();
    set({ goals: goals.map((g) => (g.id === id ? { ...g, ...data } : g)) });
    await supabase.from('goals').update(data).eq('id', id);
  },

  clear: () => set({ goals: [] }),
}));

export { computeProgress };
