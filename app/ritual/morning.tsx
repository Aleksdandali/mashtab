import React, { useState, useEffect } from 'react';
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
import { Check, Brain, Target, Star, Sun } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useJournal } from '@/hooks/useJournal';
import { useBeliefs, getBeliefTitle } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';

export default function MorningRitualScreen() {
  const { saveEntry, fetchTodayRituals } = useJournal();
  const { beliefs, fetchBeliefs } = useBeliefs();
  const { tasks, fetchTasks, addTask } = useTasks();

  const [completed, setCompleted] = useState([false, false, false, false]);
  const [beliefOfDay, setBeliefOfDay] = useState('');
  const [intention, setIntention] = useState('');
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBeliefs();
    fetchTasks();
  }, []);

  const activeBeliefs = beliefs.filter((b) => !b.completed_at);
  const focusTasks = tasks.filter((t) => t.is_focus);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  const toggleStep = (index: number) => {
    const newCompleted = [...completed];
    newCompleted[index] = !newCompleted[index];
    setCompleted(newCompleted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const allCompleted = completed.every((c) => c);

  const steps = [
    {
      icon: Brain,
      title: 'Установка дня',
      description: 'Яку установку ти інтегруєш сьогодні?',
      content: (
        <View style={S.inputContainer}>
          {activeBeliefs.length > 0 ? (
            activeBeliefs.slice(0, 3).map((b) => (
              <Pressable
                key={b.id}
                style={[S.beliefOption, beliefOfDay === b.id && S.beliefOptionSelected]}
                onPress={() => setBeliefOfDay(b.id)}
              >
                <Text style={[S.beliefOptionText, beliefOfDay === b.id && S.beliefOptionTextSelected]}>
                  {getBeliefTitle(b)}
                </Text>
              </Pressable>
            ))
          ) : (
            <TextInput
              style={S.input}
              placeholder="Я заробляю $50K/міс"
              placeholderTextColor="rgba(163, 174, 196, 0.4)"
              value={beliefOfDay}
              onChangeText={setBeliefOfDay}
            />
          )}
        </View>
      ),
    },
    {
      icon: Target,
      title: 'Одна ціль',
      description: 'Що найважливіше сьогодні?',
      content: (
        <View style={S.inputContainer}>
          <TextInput
            style={S.input}
            placeholder="Закрити deal з клієнтом..."
            placeholderTextColor="rgba(163, 174, 196, 0.4)"
            value={intention}
            onChangeText={setIntention}
            multiline
          />
        </View>
      ),
    },
    {
      icon: Star,
      title: 'Вдячність',
      description: '3 речі, за які ти вдячний',
      content: (
        <View style={S.inputContainer}>
          <TextInput
            style={[S.input, { marginBottom: 8 }]}
            placeholder="1. За що вдячний..."
            placeholderTextColor="rgba(163, 174, 196, 0.4)"
            value={gratitude1}
            onChangeText={setGratitude1}
          />
          <TextInput
            style={[S.input, { marginBottom: 8 }]}
            placeholder="2. За що вдячний..."
            placeholderTextColor="rgba(163, 174, 196, 0.4)"
            value={gratitude2}
            onChangeText={setGratitude2}
          />
          <TextInput
            style={S.input}
            placeholder="3. За що вдячний..."
            placeholderTextColor="rgba(163, 174, 196, 0.4)"
            value={gratitude3}
            onChangeText={setGratitude3}
          />
        </View>
      ),
    },
    {
      icon: Check,
      title: 'Як я себе почуваю',
      description: '1-10, чесно',
      content: (
        <View style={S.inputContainer}>
          <TextInput
            style={S.input}
            placeholder="7/10 — готовий діяти"
            placeholderTextColor="rgba(163, 174, 196, 0.4)"
          />
        </View>
      ),
    },
  ];

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveEntry('morning', {
        intention,
        gratitude: [gratitude1, gratitude2, gratitude3],
        belief_of_day: beliefOfDay || null,
        focus_task_ids: focusTasks.map((t) => t.id),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <View>
          <Text style={S.title}>Ранковий ритуал</Text>
          <Text style={S.subtitle}>4 питання за 5 хвилин</Text>
        </View>
        <View style={S.timeContainer}>
          <Sun color="#C8FF00" size={16} strokeWidth={1.5} />
          <Text style={S.time}>{timeStr}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
          <Text style={S.intro}>
            Це не to-do list. Це налаштування системи перед стартом дня.
          </Text>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = completed[index];

            return (
              <View key={index} style={S.stepCard}>
                <View style={S.stepHeader}>
                  <View style={[S.stepIcon, isCompleted && S.stepIconCompleted]}>
                    <Icon
                      color={isCompleted ? '#060810' : '#C8FF00'}
                      size={20}
                      strokeWidth={1.5}
                    />
                  </View>
                  <View style={S.stepContent}>
                    <Text style={S.stepTitle}>{step.title}</Text>
                    <Text style={S.stepDescription}>{step.description}</Text>
                  </View>
                  <Pressable
                    style={[S.checkbox, isCompleted && S.checkboxCompleted]}
                    onPress={() => toggleStep(index)}
                  >
                    {isCompleted && <Check color="#060810" size={16} strokeWidth={2} />}
                  </Pressable>
                </View>

                {step.content}
              </View>
            );
          })}

          {allCompleted && (
            <View style={S.completeCard}>
              <Text style={S.completeIcon}>✓</Text>
              <Text style={S.completeText}>Ритуал завершено</Text>
              <Text style={S.completeSubtext}>Ти готовий до дня</Text>
            </View>
          )}
        </ScrollView>

        <View style={S.footer}>
          <Pressable
            style={[S.ctaButton, (!allCompleted || saving) && S.ctaButtonDisabled]}
            disabled={!allCompleted || saving}
            onPress={handleFinish}
          >
            {saving ? (
              <ActivityIndicator color="#060810" size="small" />
            ) : (
              <Text style={S.ctaButtonText}>Завершити ритуал</Text>
            )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 174, 196, 0.12)',
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.5,
    color: '#F9FAFF',
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A3AEC4',
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#C8FF00',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  intro: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
    marginBottom: 24,
  },
  stepCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepIconCompleted: {
    backgroundColor: '#C8FF00',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#F9FAFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A3AEC4',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(163, 174, 196, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#C8FF00',
    borderColor: '#C8FF00',
  },
  inputContainer: {
    backgroundColor: '#060810',
    borderRadius: 12,
    padding: 16,
  },
  input: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#F9FAFF',
    minHeight: 40,
  },
  beliefOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(163, 174, 196, 0.12)',
    marginBottom: 8,
  },
  beliefOptionSelected: {
    borderColor: '#C8FF00',
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
  },
  beliefOptionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#A3AEC4',
  },
  beliefOptionTextSelected: {
    color: '#C8FF00',
  },
  completeCard: {
    backgroundColor: '#111622',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  completeIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: '#C8FF00',
  },
  completeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#F9FAFF',
    marginBottom: 8,
  },
  completeSubtext: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#A3AEC4',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 174, 196, 0.12)',
  },
  ctaButton: {
    backgroundColor: '#C8FF00',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: 'rgba(200, 255, 0, 0.3)',
  },
  ctaButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#060810',
  },
});
