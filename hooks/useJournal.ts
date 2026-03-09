import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { JournalEntry, JournalType } from '@/types';
import { todayISO } from '@/utils/dates';

interface JournalState {
  todayMorningDone: boolean;
  todayEveningDone: boolean;
  weeklyEntries: JournalEntry[];
  loading: boolean;
  saveEntry: (
    type: JournalType,
    content: object,
    opts?: { beliefId?: string | null; stageKey?: string | null },
  ) => Promise<JournalEntry | null>;
  fetchTodayRituals: () => Promise<void>;
  fetchWeeklyEntries: () => Promise<void>;
  clear: () => void;
}

export const useJournal = create<JournalState>((set) => ({
  todayMorningDone: false,
  todayEveningDone: false,
  weeklyEntries: [],
  loading: false,

  saveEntry: async (type, content, opts = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        type,
        content,
        date: todayISO(),
        user_belief_id: opts.beliefId ?? null,
        stage_key: opts.stageKey ?? null,
      })
      .select()
      .single();

    if (data) {
      if (type === 'morning') set({ todayMorningDone: true });
      if (type === 'evening') set({ todayEveningDone: true });
    }
    return (data as JournalEntry) ?? null;
  },

  fetchTodayRituals: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('journal_entries')
      .select('type')
      .eq('user_id', user.id)
      .eq('date', todayISO())
      .in('type', ['morning', 'evening']);

    const entries = data ?? [];
    set({
      todayMorningDone: entries.some((e) => e.type === 'morning'),
      todayEveningDone: entries.some((e) => e.type === 'evening'),
    });
  },

  fetchWeeklyEntries: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loading: false }); return; }

    const start = new Date();
    start.setDate(start.getDate() - 6);

    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', todayISO())
      .order('created_at', { ascending: false });

    set({ weeklyEntries: (data ?? []) as JournalEntry[], loading: false });
  },

  clear: () => set({
    todayMorningDone: false,
    todayEveningDone: false,
    weeklyEntries: [],
  }),
}));
