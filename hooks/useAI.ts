import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { callAICoach, checkAILimit, incrementAICounter, AIContext, getLimitMessage } from '@/lib/ai';
import { AIMessage, AIContextType } from '@/types';

interface AIState {
  messages: AIMessage[];
  loading: boolean;
  limitReached: boolean;
  limitReason: string | null;
  error: string | null;
  currentConversationId: string | null;

  /** Add an initial (local) greeting from the assistant */
  initWithGreeting: (greeting: string) => void;
  /** Send a user message and get AI response */
  sendMessage: (content: string, context: AIContext) => Promise<void>;
  /** Load a previous conversation from Supabase */
  loadConversation: (id: string) => Promise<void>;
  /** Reset the chat state */
  clearMessages: () => void;
}

export const useAI = create<AIState>((set, get) => ({
  messages: [],
  loading: false,
  limitReached: false,
  limitReason: null,
  error: null,
  currentConversationId: null,

  initWithGreeting: (greeting) => {
    set({
      messages: [
        {
          role: 'assistant',
          content: greeting,
          timestamp: new Date().toISOString(),
        },
      ],
      limitReached: false,
      limitReason: null,
      error: null,
      currentConversationId: null,
    });
  },

  sendMessage: async (content, context) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ─── Check limit ────────────────────────────────────────────────────────
    const limitStatus = await checkAILimit(user.id);
    if (limitStatus.limitReached) {
      set({
        limitReached: true,
        limitReason: getLimitMessage(limitStatus.reason),
      });
      return;
    }

    // ─── Optimistic user message ────────────────────────────────────────────
    const userMsg: AIMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    const prevMessages = get().messages;
    const newMessages = [...prevMessages, userMsg];
    set({ messages: newMessages, loading: true, error: null });

    try {
      // ─── Call Edge Function ────────────────────────────────────────────────
      const responseContent = await callAICoach(
        // Only send user/assistant messages (exclude initial assistant greeting if needed)
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        context,
      );

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      set({ messages: finalMessages, loading: false });

      // ─── Increment counter ─────────────────────────────────────────────────
      await incrementAICounter(user.id);

      // ─── Persist conversation ──────────────────────────────────────────────
      const { currentConversationId } = get();

      if (currentConversationId) {
        await supabase
          .from('ai_conversations')
          .update({
            messages: finalMessages,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentConversationId);
      } else {
        const title = content.trim().slice(0, 60);
        const { data: conv } = await supabase
          .from('ai_conversations')
          .insert({
            user_id: user.id,
            context_type: context.contextType,
            user_belief_id: context.beliefId ?? null,
            stage_key: context.stageKey ?? null,
            title,
            messages: finalMessages,
          })
          .select('id')
          .single();

        if (conv) set({ currentConversationId: conv.id });
      }
    } catch (err) {
      console.error('AI sendMessage error:', err);
      set({
        loading: false,
        error: 'Помилка зв\'язку з AI. Перевірте інтернет і спробуйте ще раз.',
      });
    }
  },

  loadConversation: async (id) => {
    const { data } = await supabase
      .from('ai_conversations')
      .select('messages, context_type, user_belief_id, stage_key')
      .eq('id', id)
      .single();

    if (data) {
      set({
        messages: (data.messages as AIMessage[]) ?? [],
        currentConversationId: id,
        limitReached: false,
        error: null,
      });
    }
  },

  clearMessages: () =>
    set({
      messages: [],
      loading: false,
      limitReached: false,
      limitReason: null,
      error: null,
      currentConversationId: null,
    }),
}));
