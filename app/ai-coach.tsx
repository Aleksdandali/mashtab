import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useAI } from '@/hooks/useAI';
import { useBeliefs, getBeliefTitle } from '@/hooks/useBeliefs';
import { STAGES } from '@/constants/stages';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { AIContextType } from '@/types';
import type { AIContext } from '@/lib/ai';

// ─── Context badge labels ─────────────────────────────────────────────────────

const CONTEXT_LABELS: Partial<Record<AIContextType, string>> = {
  belief_stage: 'Установка',
  belief_create: 'Нова установка',
  task_planning: 'Планування',
  weekly_review: 'Тижневий огляд',
};

const CONTEXT_COLORS: Partial<Record<AIContextType, string>> = {
  belief_stage: '#9B8AC4',
  belief_create: '#7BB8C9',
  task_planning: '#7CB392',
  weekly_review: '#E8976B',
};

// ─── Initial greeter ──────────────────────────────────────────────────────────

function buildInitialGreeting(
  contextType: AIContextType,
  beliefTitle?: string,
  stageQuestion?: string,
): string {
  switch (contextType) {
    case 'belief_stage':
      if (beliefTitle && stageQuestion) {
        return `Ви працюєте над установкою «${beliefTitle}». ${stageQuestion}`;
      }
      return 'Привіт! Давайте попрацюємо над вашою установкою. З чого почнемо?';
    case 'belief_create':
      return 'Давайте разом сформулюємо вашу установку. Розкажіть, що вас обмежує в бізнесі?';
    case 'task_planning':
      return 'Допоможу спланувати та розставити пріоритети. Які ваші ключові цілі зараз?';
    case 'weekly_review':
      return 'Підведемо підсумки тижня. Що вдалося найкраще — і що дало найбільше сил?';
    default:
      return 'Привіт! Я ваш AI-коуч. Над чим хочете попрацювати сьогодні?';
  }
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  const C = useTheme();
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.delay(Math.max(0, 560 - i * 160)),
        ]),
      ).start();
    });
    return () => anims.forEach((a) => a.stopAnimation());
  }, []);

  return (
    <View style={S.messageRow}>
      <View style={[S.typingBubble, { backgroundColor: C.surface1 }]}>
        {anims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              S.typingDot,
              {
                backgroundColor: C.textSecondary,
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({
  role,
  content,
  timestamp,
}: {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}) {
  const C = useTheme();
  const isUser = role === 'user';

  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <View style={[S.messageRow, isUser && S.messageRowUser]}>
      <View
        style={[
          S.messageBubble,
          isUser
            ? [S.messageBubbleUser, { backgroundColor: C.primary }]
            : { backgroundColor: C.surface1 },
        ]}
      >
        <Text
          style={[
            S.messageText,
            isUser ? S.messageTextUser : { color: C.text },
          ]}
        >
          {content}
        </Text>
        {timeLabel && (
          <Text
            style={[
              S.messageTime,
              { color: isUser ? 'rgba(6,8,16,0.6)' : C.textSecondary },
            ]}
          >
            {timeLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Limit Banner ─────────────────────────────────────────────────────────────

function LimitBanner({ message }: { message: string }) {
  const C = useTheme();
  return (
    <View style={[S.limitBanner, { backgroundColor: C.surface2, borderTopColor: C.border }]}>
      <Text style={[S.limitText, { color: C.textSecondary }]}>{message}</Text>
      <Pressable
        style={({ pressed }) => [
          S.limitBtn,
          { backgroundColor: C.primary },
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => router.back()}
      >
        <Text style={S.limitBtnText}>Оновити план</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AICoachScreen() {
  const C = useTheme();
  const params = useLocalSearchParams<{
    contextType?: string;
    beliefId?: string;
    stageKey?: string;
    conversationId?: string;
  }>();

  const {
    messages,
    loading,
    limitReached,
    limitReason,
    error,
    sendMessage,
    initWithGreeting,
    loadConversation,
    clearMessages,
  } = useAI();
  const { beliefs } = useBeliefs();

  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const scrollViewRef = useRef<ScrollView>(null);
  const initialized = useRef(false);

  const contextType = (params.contextType ?? 'general') as AIContextType;
  const beliefId = params.beliefId ?? null;
  const stageKey = params.stageKey ?? null;

  const linkedBelief = beliefId ? beliefs.find((b) => b.id === beliefId) : null;
  const beliefTitle = linkedBelief ? getBeliefTitle(linkedBelief) : undefined;

  const stageObj = stageKey ? STAGES.find((s) => s.key === stageKey) : null;
  const stageQuestion = stageObj?.questionUk;

  const contextLabel = CONTEXT_LABELS[contextType];
  const contextColor = CONTEXT_COLORS[contextType] ?? C.primary;

  const badgeText = contextLabel
    ? beliefTitle
      ? `${contextLabel}: ${beliefTitle}`
      : contextLabel
    : null;

  // ─── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (params.conversationId) {
      loadConversation(params.conversationId);
    } else {
      clearMessages();
      const greeting = buildInitialGreeting(contextType, beliefTitle, stageQuestion);
      initWithGreeting(greeting);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  // ─── Send ────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText('');
    setInputHeight(44);

    const context: AIContext = {
      contextType,
      beliefId,
      stageKey,
      language: 'uk',
    };

    await sendMessage(text, context);
  }, [inputText, loading, contextType, beliefId, stageKey, sendMessage]);

  const LINE_HEIGHT = 22;
  const MAX_INPUT_HEIGHT = LINE_HEIGHT * 4 + 22;
  const canSend = inputText.trim().length > 0 && !loading;

  return (
    <SafeAreaView style={[S.root, { backgroundColor: C.bg }]}>
      {/* ─── Header ─── */}
      <View style={[S.header, { borderBottomColor: C.border }]}>
        <View style={S.headerLeft}>
          <Pressable
            style={({ pressed }) => [S.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Icon name="ChevronLeft" size={24} color={C.textSecondary} />
          </Pressable>
          <View>
            <Text style={[S.headerTitle, { color: C.text }]}>Твій коуч</Text>
            <View style={S.statusRow}>
              <View style={[S.statusDot, { backgroundColor: C.primary }]} />
              <Text style={[S.statusText, { color: C.textSecondary }]}>Онлайн</Text>
            </View>
          </View>
        </View>

        {badgeText && (
          <View style={[S.contextBadge, { backgroundColor: C.surface2, borderColor: contextColor + '40' }]}>
            <Text style={[S.contextBadgeText, { color: contextColor }]} numberOfLines={1}>
              {badgeText}
            </Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ─── Messages ─── */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={S.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {/* Coach intro card */}
          <View style={[S.introCard, { backgroundColor: C.surface2 }]}>
            <Text style={[S.introText, { color: C.textSecondary }]}>
              Я не тут, щоб тебе підтримувати. Я тут, щоб ставити складні питання.
            </Text>
          </View>

          {messages.map((msg, i) => (
            <ChatBubble
              key={i}
              role={msg.role}
              content={msg.content}
              timestamp={(msg as typeof msg & { timestamp?: string }).timestamp}
            />
          ))}

          {loading && <TypingIndicator />}

          {error && (
            <View style={[S.errorBubble, { backgroundColor: '#C47B8A20' }]}>
              <Text style={[S.errorText, { color: '#C47B8A' }]}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* ─── Limit banner or input ─── */}
        {limitReached ? (
          <LimitBanner message={limitReason ?? 'Ліміт вичерпано.'} />
        ) : (
          <View style={[S.inputContainer, { borderTopColor: C.border }]}>
            <TextInput
              style={[
                S.input,
                {
                  backgroundColor: C.surface1,
                  color: C.text,
                  height: Math.min(inputHeight, MAX_INPUT_HEIGHT),
                },
              ]}
              placeholder="Напишіть питання..."
              placeholderTextColor={C.textSecondary}
              multiline
              value={inputText}
              onChangeText={setInputText}
              onContentSizeChange={(e) => {
                setInputHeight(e.nativeEvent.contentSize.height + 22);
              }}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              style={({ pressed }) => [
                S.sendButton,
                {
                  backgroundColor: canSend ? C.primary : 'rgba(200,255,0,0.3)',
                },
                pressed && canSend && { transform: [{ scale: 0.94 }] },
              ]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {loading ? (
                <ActivityIndicator color="#060810" size="small" />
              ) : (
                <Icon
                  name="Send"
                  size={18}
                  color={canSend ? '#060810' : 'rgba(163,174,196,0.4)'}
                  strokeWidth={1.5}
                />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
    marginRight: 4,
  },
  headerTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  contextBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    maxWidth: 160,
  },
  contextBadgeText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
  },

  // Messages
  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Spacing.lg,
  },

  // Coach intro card
  introCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  introText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Message bubbles
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    maxWidth: '80%',
  },
  messageBubbleUser: {
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  messageTextUser: {
    color: '#060810',
  },
  messageTime: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 14,
  },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Error
  errorBubble: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Limit banner
  limitBanner: {
    padding: Spacing.base,
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  limitText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  limitBtn: {
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  limitBtnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 14,
    color: '#060810',
  },
});
