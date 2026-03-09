import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { todayISO } from '@/utils/dates';

export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  is_focus?: boolean;
  goal_id?: string | null;
  user_belief_id?: string | null;
  date?: string;
}

interface TasksState {
  tasks: Task[];
  date: string;
  loading: boolean;
  weekCounts: Record<string, number>;

  // Actions
  fetchTasks: (date?: string) => Promise<void>;
  fetchWeekCounts: (dates: string[]) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  addTask: (title: string, opts?: { isFocus?: boolean; goalId?: string; beliefId?: string; date?: string }) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveToTomorrow: (id: string) => Promise<void>;

  // Computed selectors (call as functions to avoid stale closures)
  focusTasks: () => Task[];
  regularTasks: () => Task[];
  overdueTasks: () => Task[];

  clear: () => void;
}

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  date: todayISO(),
  loading: false,
  weekCounts: {},

  fetchTasks: async (date) => {
    const targetDate = date ?? todayISO();
    set({ loading: true, date: targetDate });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loading: false }); return; }

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', targetDate)
      .order('sort_order', { ascending: true });

    set({ tasks: data ?? [], loading: false });
  },

  toggleTask: async (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.is_completed;

    // Optimistic update
    set({
      tasks: tasks.map((t) =>
        t.id === id
          ? { ...t, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : t,
      ),
    });

    await supabase
      .from('tasks')
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id);
  },

  fetchWeekCounts: async (dates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || dates.length === 0) return;

    const { data } = await supabase
      .from('tasks')
      .select('date')
      .eq('user_id', user.id)
      .in('date', dates);

    const counts: Record<string, number> = {};
    dates.forEach((d) => { counts[d] = 0; });
    (data ?? []).forEach((t) => { counts[t.date] = (counts[t.date] ?? 0) + 1; });
    set({ weekCounts: { ...get().weekCounts, ...counts } });
  },

  addTask: async (title, opts = {}) => {
    const { date, tasks } = get();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const taskDate = opts.date ?? date;
    const { data } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title,
        date: taskDate,
        is_focus: opts.isFocus ?? false,
        goal_id: opts.goalId ?? null,
        user_belief_id: opts.beliefId ?? null,
        sort_order: tasks.length,
      })
      .select()
      .single();

    if (data && data.date === get().date) set({ tasks: [...get().tasks, data] });
  },

  updateTask: async (id, data) => {
    const { tasks } = get();
    const updated = { ...tasks.find((t) => t.id === id), ...data } as Task;
    set({ tasks: tasks.map((t) => (t.id === id ? updated : t)) });
    await supabase.from('tasks').update(data).eq('id', id);
  },

  deleteTask: async (id) => {
    const { tasks } = get();
    set({ tasks: tasks.filter((t) => t.id !== id) });
    await supabase.from('tasks').delete().eq('id', id);
  },

  moveToTomorrow: async (id) => {
    const { tasks } = get();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    set({ tasks: tasks.filter((t) => t.id !== id) });
    await supabase.from('tasks').update({ date: tomorrowISO }).eq('id', id);
  },

  focusTasks: () => get().tasks.filter((t) => t.is_focus).slice(0, 3),
  regularTasks: () => get().tasks.filter((t) => !t.is_focus),
  overdueTasks: () => {
    const today = todayISO();
    return get().tasks.filter((t) => t.date < today && !t.is_completed);
  },

  clear: () => set({ tasks: [], date: todayISO() }),
}));
