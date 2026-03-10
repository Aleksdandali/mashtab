import AsyncStorage from '@react-native-async-storage/async-storage';
import { BeliefCategory } from '@/constants/categories';

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  SELECTED_FOCUS:     '@mashtab/onboarding/focus',
  DIAGNOSTIC_ANSWERS: '@mashtab/onboarding/answers',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredAnswer {
  beliefId: number;
  category: BeliefCategory;
  score: number;
}

export interface OnboardingData {
  selectedFocus: BeliefCategory | null;
  answers: StoredAnswer[];
}

// ─── Focus ───────────────────────────────────────────────────────────────────

export async function saveSelectedFocus(focus: BeliefCategory): Promise<void> {
  await AsyncStorage.setItem(KEYS.SELECTED_FOCUS, focus);
}

export async function getSelectedFocus(): Promise<BeliefCategory | null> {
  const val = await AsyncStorage.getItem(KEYS.SELECTED_FOCUS);
  return val as BeliefCategory | null;
}

// ─── Diagnostic answers ──────────────────────────────────────────────────────

export async function saveAnswers(answers: StoredAnswer[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.DIAGNOSTIC_ANSWERS, JSON.stringify(answers));
}

export async function getAnswers(): Promise<StoredAnswer[]> {
  const val = await AsyncStorage.getItem(KEYS.DIAGNOSTIC_ANSWERS);
  if (!val) return [];
  try {
    return JSON.parse(val) as StoredAnswer[];
  } catch {
    return [];
  }
}

export async function addAnswer(answer: StoredAnswer): Promise<void> {
  const existing = await getAnswers();
  const filtered = existing.filter((a) => a.beliefId !== answer.beliefId);
  await saveAnswers([...filtered, answer]);
}

// ─── Full data ───────────────────────────────────────────────────────────────

export async function getOnboardingData(): Promise<OnboardingData> {
  const [focus, answers] = await Promise.all([
    getSelectedFocus(),
    getAnswers(),
  ]);
  return { selectedFocus: focus, answers };
}

// ─── Sync to Supabase after sign-up ──────────────────────────────────────────

export async function syncOnboardingData(
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { answers } = await getOnboardingData();
  if (answers.length === 0) return;

  const rows = answers.map((a) => ({
    user_id: userId,
    belief_id: a.beliefId,
    score: a.score,
  }));

  await supabase.from('diagnostic_answers').insert(rows);
  await clearOnboardingData();
}

// ─── Clear ───────────────────────────────────────────────────────────────────

export async function clearOnboardingData(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SELECTED_FOCUS);
  await AsyncStorage.removeItem(KEYS.DIAGNOSTIC_ANSWERS);
}
