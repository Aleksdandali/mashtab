// @ts-nocheck — Deno runtime types
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ─────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Stage metadata ───────────────────────────────────────────────────────────

const STAGE_NAMES_UK: Record<string, string> = {
  identify: 'Виявити',
  explore: 'Дослідити',
  reality: 'Перевірити',
  replace: 'Замінити',
  action: 'Діяти',
  identity: 'Ідентичність',
};

const STAGE_FOCUS_UK: Record<string, string> = {
  identify: 'Допоможи усвідомити, де саме ця установка проявляється в бізнесі та повсякденному житті.',
  explore: 'Допоможи дослідити приховану вигоду від цієї установки та її справжнє походження.',
  reality: 'Допоможи знайти мінімум 3 реальні контрприклади, де ця установка не підтвердилась.',
  replace: 'Допоможи сформулювати нову, більш функціональну установку — правдиву і корисну.',
  action: 'Допоможи визначити одну конкретну, виміряну дію на цьому тижні. Наприкінці запропонуй створити задачу.',
  identity: 'Допоможи сформувати нову ідентичність після завершення роботи з цією установкою.',
};

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  context: {
    contextType: string;
    beliefId?: string | null;
    stageKey?: string | null;
    language?: string;
  },
  belief: Record<string, unknown> | null,
  journalEntries: Array<{ type: string; content: Record<string, unknown>; date: string; stage_key?: string }>,
  weeklyEntry: Record<string, unknown> | null,
): string {
  const lang = context.language ?? 'uk';
  const langLabel = lang === 'uk' ? 'українська' : lang === 'ru' ? 'російська' : 'англійська';

  let prompt = `Ти — AI-коуч застосунку МАСШТАБ для підприємців малого бізнесу.

МЕТОДОЛОГІЯ: 6 кроків трансформації обмежуючих установок:
1. Виявити — усвідомити, де і як проявляється
2. Дослідити — знайти вигоду і походження
3. Перевірити — знайти контрприклади (факти vs інтерпретація)
4. Замінити — сформулювати функціональнішу установку
5. Діяти — один конкретний крок цього тижня
6. Ідентичність — нова роль, новий масштаб

СТИЛЬ ВІДПОВІДЕЙ:
- Спокійний, впевнений, без мотиваційного крінжа
- 3–5 речень максимум — стисло і по суті
- Завершуй сильним коучинговим питанням
- НЕ давай готових відповідей — веди до власного відкриття
- НЕ повторюй питання користувача
- Мова відповідей: ${langLabel}
`;

  if (belief) {
    const beliefData = belief.belief as Record<string, string> | null;
    const beliefTitle = belief.belief_id
      ? (beliefData?.[`belief_${lang}`] ?? beliefData?.belief_uk ?? '')
      : (belief.custom_belief as string ?? '');

    const stageName = context.stageKey ? STAGE_NAMES_UK[context.stageKey] ?? '' : '';
    const stageFocus = context.stageKey ? STAGE_FOCUS_UK[context.stageKey] ?? '' : '';

    prompt += `
КОНТЕКСТ СЕСІЇ:
- Установка: "${beliefTitle}"
- Поточний етап: ${belief.current_stage}/6${stageName ? ` (${stageName})` : ''}
- Початковий вплив: ${belief.score}/10
`;
    if (stageFocus) {
      prompt += `- Фокус цієї сесії: ${stageFocus}\n`;
    }
  }

  if (journalEntries.length > 0) {
    prompt += '\nОСТАННІ РЕФЛЕКСІЇ КОРИСТУВАЧА:\n';
    journalEntries.slice(0, 5).forEach((entry) => {
      const text = (entry.content as Record<string, string>).text ?? '';
      if (text) {
        const stageName = entry.stage_key ? STAGE_NAMES_UK[entry.stage_key] ?? '' : '';
        prompt += `- [${entry.date}${stageName ? `, ${stageName}` : ''}]: ${text.slice(0, 150)}\n`;
      }
    });
  }

  if (context.contextType === 'weekly_review' && weeklyEntry) {
    const c = weeklyEntry.content as Record<string, string>;
    prompt += `
ТИЖНЕВИЙ ПІДСУМОК КОРИСТУВАЧА:
- Що вийшло: ${(c.wins_of_week ?? '').slice(0, 300)}
- Що не вийшло: ${(c.didnt_work ?? '').slice(0, 300)}
- Рівень енергії: ${c.energy_level ?? '?'}/10

Проаналізуй патерни, підкресли прогрес, допоможи визначити фокус.`;
  }

  if (context.contextType === 'task_planning') {
    prompt += '\nДопомагаєш структурувати задачі та пріоритети. Якщо бачиш зв\'язок між задачами та установками — підсвіти.\n';
  }

  if (context.contextType === 'belief_create') {
    prompt += '\nДопомагаєш сформулювати та деталізувати кастомну установку. Задавай уточнюючі питання. Після двох обмінів запропонуй варіант формулювання.\n';
  }

  return prompt;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    // Client with user token (for auth check)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    // Admin client for data fetching (bypasses RLS safely)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const { messages = [], context = {} } = body as {
      messages: Array<{ role: string; content: string }>;
      context: {
        contextType?: string;
        beliefId?: string | null;
        stageKey?: string | null;
        language?: string;
      };
    };

    // ─── Fetch belief context ──────────────────────────────────────────────

    let belief: Record<string, unknown> | null = null;
    let journalEntries: Array<{ type: string; content: Record<string, unknown>; date: string; stage_key?: string }> = [];

    if (context.beliefId) {
      const { data: beliefData } = await supabaseAdmin
        .from('user_beliefs')
        .select('*, belief:beliefs(belief_uk, belief_ru, belief_en, conviction_uk)')
        .eq('id', context.beliefId)
        .single();

      belief = beliefData;

      const { data: entries } = await supabaseAdmin
        .from('journal_entries')
        .select('type, content, date, stage_key')
        .eq('user_id', user.id)
        .eq('user_belief_id', context.beliefId)
        .eq('type', 'stage')
        .order('created_at', { ascending: false })
        .limit(5);

      journalEntries = entries ?? [];
    }

    // ─── Fetch weekly entry ────────────────────────────────────────────────

    let weeklyEntry: Record<string, unknown> | null = null;

    if (context.contextType === 'weekly_review') {
      const { data: entry } = await supabaseAdmin
        .from('journal_entries')
        .select('content, date')
        .eq('user_id', user.id)
        .eq('type', 'weekly')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      weeklyEntry = entry;
    }

    // ─── Build system prompt ───────────────────────────────────────────────

    const systemPrompt = buildSystemPrompt(context, belief, journalEntries, weeklyEntry);

    // ─── Call Claude ───────────────────────────────────────────────────────

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'AI service not configured' }, 500);

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error('Claude API error:', errText);
      return json({ error: 'AI service error' }, 500);
    }

    const claudeData = await claudeRes.json();
    const content: string = claudeData.content?.[0]?.text ?? '';

    return json({ content });

  } catch (err) {
    console.error('Edge function error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
