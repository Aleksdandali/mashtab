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
import { Spacing, Radius, Shadow } from '@/constants/spacing';
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
          Animated.parallel([
            Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }),
          ]),
          Animated.timing(anim, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.delay(Math.max(0, 560 - i * 160)),
        ]),
      ).start();
    });
    return () => anims.forEach((a) => a.stopAnimation());
  }, []);

  return (
    <View style={[typingStyles.bubble, { backgroundColor: C.surface2 }]}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            typingStyles.dot,
            {
              backgroundColor: C.textTertiary,
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
  );
}

const typingStyles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    marginLeft: Spacing.base,
    marginBottom: Spacing.sm,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({
  role,
  content,
  timestamp,
}: {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}) {
  const C = useTheme();
  const isUser = role === 'user';

  const time = new Date(timestamp).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[bubbleStyles.wrap, isUser ? bubbleStyles.wrapUser : bubbleStyles.wrapAssistant]}>
      {/* Avatar for assistant */}
      {!isUser && (
        <View style={[bubbleStyles.avatar, { backgroundColor: C.primary + '20' }]}>
          <Icon name="MessageCircle" size={16} color={C.primary} />
        </View>
      )}

      <View style={bubbleStyles.col}>
        <View
          style={[
            bubbleStyles.bubble,
            isUser
              ? [bubbleStyles.bubbleUser, { backgroundColor: C.primaryMuted }]
              : [bubbleStyles.bubbleAssistant, { backgroundColor: C.surface2 }],
          ]}
        >
          <Text
            style={[
              bubbleStyles.text,
              { color: C.text },
            ]}
          >
            {content}
          </Text>
        </View>
        <Text style={[bubbleStyles.time, { color: C.textTertiary }]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  wrapUser: { justifyContent: 'flex-end' },
  wrapAssistant: { justifyContent: 'flex-start', gap: Spacing.sm },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16 },
  col: { maxWidth: '75%', gap: 3 },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleUser: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  time: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    alignSelf: 'flex-end',
    paddingHorizontal: 4,
  },
});

// ─── Limit Banner ─────────────────────────────────────────────────────────────

function LimitBanner({ message }: { message: string }) {
  const C = useTheme();
  return (
    <View style={[limitStyles.banner, { backgroundColor: C.surface2, borderTopColor: C.border }]}>
      <Text style={[limitStyles.text, { color: C.textSecondary }]}>{message}</Text>
      <Pressable
        style={({ pressed }) => [
          limitStyles.btn,
          { backgroundColor: C.primary },
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => router.back()}
      >
        <Text style={[limitStyles.btnText, { color: C.surface1 }]}>Оновити план</Text>
      </Pressable>
    </View>
  );
}

const limitStyles = StyleSheet.create({
  banner: {
    padding: Spacing.base,
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  btn: {
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 14,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AICoachScreen() {
  const C = useTheme();
  const params = useLocalSearchParams<{
    contextType?: string;
    beliefId?: string;
    stageKey?: string;
    conversationId?: string;
  }>();

  const { messages, loading, limitReached, limitReason, error, sendMessage, initWithGreeting, loadConversation, clearMessages } = useAI();
  const { beliefs } = useBeliefs();

  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const scrollViewRef = useRef<ScrollView>(null);
  const initialized = useRef(false);

  const contextType = (params.contextType ?? 'general') as AIContextType;
  const beliefId = params.beliefId ?? null;
  const stageKey = params.stageKey ?? null;

  // Find linked belief for context
  const linkedBelief = beliefId ? beliefs.find((b) => b.id === beliefId) : null;
  const beliefTitle = linkedBelief ? getBeliefTitle(linkedBelief) : undefined;

  // Find stage question
  const stageObj = stageKey ? STAGES.find((s) => s.key === stageKey) : null;
  const stageQuestion = stageObj?.questionUk;

  const contextLabel = CONTEXT_LABELS[contextType];
  const contextColor = CONTEXT_COLORS[contextType] ?? C.primary;

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

  // Auto-scroll to bottom when messages change
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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Icon name="ChevronLeft" size={24} color={C.textSecondary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>AI Coach</Text>
          {contextLabel && (
            <View style={[styles.contextBadge, { backgroundColor: C.surface2 }]}>
              <Text style={[styles.contextBadgeText, { color: C.textSecondary }]}>
                {contextLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ─── Messages ─── */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {messages.map((msg, i) => (
            <ChatBubble
              key={i}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}

          {loading && <TypingIndicator />}

          {error && (
            <View style={[styles.errorBubble, { backgroundColor: '#C47B8A20' }]}>
              <Text style={[styles.errorText, { color: '#C47B8A' }]}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* ─── Limit banner or input ─── */}
        {limitReached ? (
          <LimitBanner message={limitReason ?? 'Ліміт вичерпано.'} />
        ) : (
          <View style={[styles.inputArea, { backgroundColor: C.surface1, borderTopColor: C.border }]}>
            <View style={[styles.inputRow, { backgroundColor: C.surface2 }]}>
              <TextInput
                style={[styles.textInput, { color: C.text, height: Math.min(inputHeight, MAX_INPUT_HEIGHT) }]}
                placeholder="Напишіть питання..."
                placeholderTextColor={C.textTertiary}
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
                  styles.sendBtn,
                  { backgroundColor: inputText.trim().length > 0 ? C.primary : C.surface3 },
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color={C.surface1} size="small" />
                ) : (
                  <Icon name="Send" size={16} color={inputText.trim() ? '#060810' : C.textTertiary} strokeWidth={1.5} />
                )}
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, alignItems: 'center' },
  backText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 22,
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  headerTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  contextBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contextBadgeText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
  },

  messagesList: { flex: 1 },
  messagesContent: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },

  errorBubble: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },

  inputArea: {
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    borderRadius: Radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendIcon: {
    fontFamily: FontFamily.sansBold,
    fontSize: 20,
  },
});
