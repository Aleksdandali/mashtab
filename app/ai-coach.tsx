import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, ChevronLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAI } from '@/hooks/useAI';
import { useBeliefs, getBeliefTitle } from '@/hooks/useBeliefs';

const GREETING = 'Я не тут, щоб тебе підтримувати. Я тут, щоб ставити складні питання. Готовий?';

export default function AICoachScreen() {
  const { beliefId, stageKey } = useLocalSearchParams<{ beliefId?: string; stageKey?: string }>();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { messages, loading, limitReached, limitReason, error, initWithGreeting, sendMessage, clearMessages } = useAI();
  const { beliefs } = useBeliefs();

  const belief = beliefId ? beliefs.find((b) => b.id === beliefId) : null;
  const beliefTitle = belief ? getBeliefTitle(belief) : null;

  useEffect(() => {
    clearMessages();
    initWithGreeting(GREETING);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    const text = message.trim();
    setMessage('');
    await sendMessage(text, {
      contextType: stageKey ? 'belief_stage' : beliefId ? 'belief_stage' : 'general',
      beliefId: beliefId ?? null,
      stageKey: stageKey ?? null,
    });
  };

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <Pressable style={S.backBtn} onPress={() => router.back()}>
          <ChevronLeft color="#A3AEC4" size={22} strokeWidth={1.5} />
        </Pressable>
        <View style={S.headerContent}>
          <Text style={S.title}>Твій коуч</Text>
          {beliefTitle && (
            <Text style={S.contextBadge} numberOfLines={1}>{beliefTitle}</Text>
          )}
        </View>
        <View style={S.statusRow}>
          <View style={S.statusDot} />
          <Text style={S.statusText}>Онлайн</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={S.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={S.scroll}
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={S.coachIntro}>
            <Text style={S.coachIntroText}>{GREETING}</Text>
          </View>

          {messages.map((msg, index) => (
            <View
              key={index}
              style={[S.messageRow, msg.role === 'user' && S.messageRowUser]}
            >
              <View style={[S.messageBubble, msg.role === 'user' && S.messageBubbleUser]}>
                <Text style={[S.messageText, msg.role === 'user' && S.messageTextUser]}>
                  {msg.content}
                </Text>
                {msg.timestamp && (
                  <Text style={[S.messageTime, msg.role === 'user' && S.messageTimeUser]}>
                    {new Date(msg.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {loading && (
            <View style={S.messageRow}>
              <View style={S.messageBubble}>
                <ActivityIndicator color="#C8FF00" size="small" />
              </View>
            </View>
          )}

          {(limitReached || error) && (
            <View style={S.limitCard}>
              <Text style={S.limitText}>{limitReason ?? error ?? 'Виникла помилка'}</Text>
            </View>
          )}
        </ScrollView>

        <View style={S.inputContainer}>
          <TextInput
            style={S.input}
            placeholder="Твоя відповідь..."
            placeholderTextColor="rgba(163, 174, 196, 0.4)"
            value={message}
            onChangeText={setMessage}
            multiline
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[S.sendButton, (!message.trim() || loading) && S.sendButtonDisabled]}
            disabled={!message.trim() || loading}
            onPress={handleSend}
          >
            <Send
              color={message.trim() && !loading ? '#060810' : 'rgba(163, 174, 196, 0.4)'}
              size={20}
              strokeWidth={1.5}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060810',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 174, 196, 0.12)',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 24,
    letterSpacing: -0.5,
    color: '#F9FAFF',
  },
  contextBadge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#C8FF00',
    marginTop: 2,
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
    backgroundColor: '#C8FF00',
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A3AEC4',
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  coachIntro: {
    backgroundColor: '#111622',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  coachIntroText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    maxWidth: '80%',
  },
  messageBubbleUser: {
    backgroundColor: '#C8FF00',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#F9FAFF',
    marginBottom: 6,
  },
  messageTextUser: {
    color: '#060810',
  },
  messageTime: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#A3AEC4',
  },
  messageTimeUser: {
    color: 'rgba(6, 8, 16, 0.6)',
  },
  limitCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 79, 0.3)',
  },
  limitText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FF4D4F',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 174, 196, 0.12)',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#0B0F18',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#F9FAFF',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C8FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(200, 255, 0, 0.3)',
  },
});
