import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { computeStreak, dateISO } from '@/utils/dates';

interface ProfileState {
  profile: Profile | null;
  streak: number;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  clear: () => void;
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: null,
  streak: 0,
  loading: false,

  fetchProfile: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loading: false }); return; }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    set({ profile: data ?? null, loading: false });
  },

  fetchStreak: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Last 60 days of morning journal entries
    const from = new Date();
    from.setDate(from.getDate() - 60);

    const { data } = await supabase
      .from('journal_entries')
      .select('date')
      .eq('user_id', user.id)
      .eq('type', 'morning')
      .gte('date', dateISO(from));

    const dates = (data ?? []).map((r: { date: string }) => r.date);
    set({ streak: computeStreak(dates) });
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();
    if (data) set({ profile: data });
  },

  clear: () => set({ profile: null, streak: 0 }),
}));
