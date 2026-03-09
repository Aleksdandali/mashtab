import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { SphereKey, SPHERES } from '@/constants/spheres';

export interface WheelScore {
  sphere: SphereKey;
  score: number;
  date: string;
}

export type ScoreMap = Record<SphereKey, number>;

const DEFAULT_SCORES: ScoreMap = Object.fromEntries(
  SPHERES.map((s) => [s.key, 5]),
) as ScoreMap;

interface WheelState {
  /** Scores for the current (latest) measurement */
  scores: ScoreMap;
  /** Date string of the latest measurement, null if no data yet */
  latestDate: string | null;
  /** Scores from the previous measurement for delta display */
  previousScores: ScoreMap | null;
  /** Date of the previous measurement */
  previousDate: string | null;
  loading: boolean;
  saving: boolean;

  fetchLatestScores: () => Promise<void>;
  /** Set a single score locally (before saving) */
  setScore: (sphere: SphereKey, score: number) => void;
  /** Persist all 8 current scores as a new measurement */
  saveScores: () => Promise<void>;
  clear: () => void;
}

export const useWheel = create<WheelState>((set, get) => ({
  scores: { ...DEFAULT_SCORES },
  latestDate: null,
  previousScores: null,
  previousDate: null,
  loading: false,
  saving: false,

  fetchLatestScores: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loading: false }); return; }

    // Fetch the two most recent distinct dates
    const { data: rows } = await supabase
      .from('wheel_scores')
      .select('sphere, score, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(32); // up to 4 full measurements (8 spheres × 4)

    if (!rows || rows.length === 0) {
      set({ scores: { ...DEFAULT_SCORES }, latestDate: null, loading: false });
      return;
    }

    // Group rows by date (sorted descending already)
    const byDate: Record<string, WheelScore[]> = {};
    for (const row of rows) {
      if (!byDate[row.date]) byDate[row.date] = [];
      byDate[row.date].push(row as WheelScore);
    }

    const dates = Object.keys(byDate).sort((a, b) => (b > a ? 1 : -1));
    const latestDate = dates[0] ?? null;
    const previousDate = dates[1] ?? null;

    const buildMap = (items: WheelScore[]): ScoreMap => {
      const map = { ...DEFAULT_SCORES };
      for (const item of items) {
        if (item.sphere in map) map[item.sphere as SphereKey] = item.score;
      }
      return map;
    };

    const latestScores = latestDate ? buildMap(byDate[latestDate]) : { ...DEFAULT_SCORES };
    const previousScores = previousDate ? buildMap(byDate[previousDate]) : null;

    set({
      scores: latestScores,
      latestDate,
      previousScores,
      previousDate,
      loading: false,
    });
  },

  setScore: (sphere, score) => {
    set((state) => ({ scores: { ...state.scores, [sphere]: score } }));
  },

  saveScores: async () => {
    set({ saving: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ saving: false }); return; }

    const { scores } = get();
    const today = new Date().toISOString().split('T')[0];

    const rows = SPHERES.map((s) => ({
      user_id: user.id,
      sphere: s.key,
      score: scores[s.key],
      date: today,
    }));

    await supabase.from('wheel_scores').insert(rows);

    // Refresh so previous becomes the old latest
    set({ saving: false });
    await get().fetchLatestScores();
  },

  clear: () =>
    set({
      scores: { ...DEFAULT_SCORES },
      latestDate: null,
      previousScores: null,
      previousDate: null,
    }),
}));
