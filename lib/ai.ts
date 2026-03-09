import { supabase } from './supabase';
import { AIContextType, AIMessage } from '@/types';

export interface AIContext {
  contextType: AIContextType;
  beliefId?: string | null;
  stageKey?: string | null;
  language?: string;
}

export interface AILimitStatus {
  limitReached: boolean;
  reason: 'free_tier' | 'daily_limit' | null;
}

// ─── Check limit before sending ──────────────────────────────────────────────

export async function checkAILimit(userId: string): Promise<AILimitStatus> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier, ai_messages_today, ai_messages_date')
    .eq('id', userId)
    .single();

  if (!data) return { limitReached: false, reason: null };

  if (data.subscription_tier === 'free') {
    return { limitReached: true, reason: 'free_tier' };
  }

  if (data.subscription_tier === 'standard') {
    const today = new Date().toISOString().split('T')[0];
    const isToday = data.ai_messages_date === today;
    const count = isToday ? (data.ai_messages_today ?? 0) : 0;
    if (count >= 20) return { limitReached: true, reason: 'daily_limit' };
  }

  return { limitReached: false, reason: null };
}

// ─── Increment daily counter ──────────────────────────────────────────────────

export async function incrementAICounter(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('profiles')
    .select('ai_messages_today, ai_messages_date')
    .eq('id', userId)
    .single();

  const isToday = data?.ai_messages_date === today;
  const current = isToday ? (data?.ai_messages_today ?? 0) : 0;

  await supabase
    .from('profiles')
    .update({ ai_messages_today: current + 1, ai_messages_date: today })
    .eq('id', userId);
}

// ─── Call Edge Function ───────────────────────────────────────────────────────

export async function callAICoach(
  messages: Pick<AIMessage, 'role' | 'content'>[],
  context: AIContext,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { messages, context },
  });

  if (error) throw new Error(error.message ?? 'AI service error');
  if (!data?.content) throw new Error('Empty response from AI');

  return data.content as string;
}

// ─── Limit message text ───────────────────────────────────────────────────────

export function getLimitMessage(reason: AILimitStatus['reason']): string {
  if (reason === 'free_tier') {
    return 'AI-коуч доступний на тарифах Standard і Premium. Оновіть підписку, щоб отримати доступ.';
  }
  return 'Ліміт на сьогодні вичерпано (20 повідомлень). Оновіть до Premium для безлімітного доступу.';
}
