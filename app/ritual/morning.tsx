import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useBeliefs, getBeliefTitle } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';
import { FontFamily } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { todayISO } from '@/utils/dates';
import { UserBelief, Task } from '@/types';
import type { IconName } from '@/components/ui/Icon';

// ─── Step configuration ───────────────────────────────────────────────────────

const STEP_CONFIGS: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'Brain',
    title: 'Установка дня',
    description: 'Оберіть установку для фокусу сьогодні',
  },
  {
    icon: 'Target',
    title: 'Намір на день',
    description: 'Один ясний намір задає тон усьому дню',
  },
  {
    icon: 'Star',
    title: 'Вдячність',
    description: 'Конкретність — ключ. Навіть дрібниці мають значення',
  },
  {
    icon: 'CheckCircle2',
    title: 'Фокус-задачі',
    description: 'Максимум 3 задачі — ваші must-do сьогодні',
  },
];

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({
  index,
  checked,
  onToggleCheck,
  children,
}: {
  index: number;
  checked: boolean;
  onToggleCheck: () => void;
  children: React.ReactNode;
}) {
  const C = useTheme();
  const cfg = STEP_CONFIGS[index];

  return (
    <View style={[s.stepCard, { backgroundColor: C.surface1 }]}>
      <View style={s.stepHeader}>
        <View
          style={[
            s.stepIcon,
            { backgroundColor: checked ? C.primary : C.primaryMuted },
          ]}
        >
          <Icon
            name={cfg.icon}
            size={20}
            color={checked ? '#060810' : C.primary}
          />
        </View>

        <View style={s.stepContent}>
          <Text style={[s.stepTitle, { color: C.text }]}>{cfg.title}</Text>
          <Text style={[s.stepDescription, { color: C.textSecondary }]}>
            {cfg.description}
          </Text>
        </View>

        <Pressable
          onPress={onToggleCheck}
          hitSlop={12}
          style={[
            s.checkbox,
            {
              backgroundColor: checked ? C.primary : 'transparent',
              borderColor: checked ? C.primary : 'rgba(163,174,196,0.4)',
            },
          ]}
        >
          {checked && <Icon name="Check" size={16} color="#060810" />}
        </Pressable>
      </View>

      <View style={s.stepBody}>{children}</View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MorningRitualScreen() {
  const C = useTheme();
  const { beliefs, fetchBeliefs } = useBeliefs();
  const { tasks, fetchTasks, addTask, updateTask } = useTasks();
  const { saveEntry } = useJournal();

  const [checked, setChecked] = useState([false, false, false, false]);

  // Step 0: belief of day
  const [beliefOfDayId, setBeliefOfDayId] = useState<string | null>(null);
  // Step 1: intention
  const [intention, setIntention] = useState('');
  // Step 2: gratitude (3 inputs)
  const [gratitude, setGratitude] = useState<[string, string, string]>(['', '', '']);
  // Step 3: focus tasks
  const [focusIds, setFocusIds] = useState<Set<string>>(new Set());
  const [newTaskInput, setNewTaskInput] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBeliefs();
      fetchTasks(todayISO());
    }, [fetchBeliefs, fetchTasks]),
  );

  useEffect(() => {
    const currentFocus = new Set(tasks.filter((t) => t.is_focus).map((t) => t.id));
    setFocusIds(currentFocus);
  }, [tasks]);

  // ─── Interactions ──────────────────────────────────────────────────────────

  const toggleCheck = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const toggleFocus = (id: string) => {
    setFocusIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddTask = async () => {
    if (!newTaskInput.trim()) return;
    await addTask(newTaskInput.trim(), { date: todayISO() });
    setNewTaskInput('');
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const allCompleted = checked.every(Boolean);

  const handleFinish = async () => {
    if (!allCompleted || saving) return;
    setSaving(true);
    try {
      await Promise.all(
        tasks.map((t) => updateTask(t.id, { is_focus: focusIds.has(t.id) })),
      );
      await saveEntry('morning', {
        intention: intention.trim(),
        gratitude: gratitude.map((g) => g.trim()),
        belief_of_day: beliefOfDayId,
        focus_task_ids: [...focusIds],
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    } finally {
      setSaving(false);
    }
  };

  // ─── Time display ──────────────────────────────────────────────────────────

  const timeStr = new Date().toLocaleTimeString('uk', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <Text style={[s.headerTitle, { color: C.text }]}>Ранковий ритуал</Text>
          <Text style={[s.headerTime, { color: C.primary }]}>{timeStr}</Text>
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro */}
          <Text style={[s.introText, { color: C.textSecondary }]}>
            Це не to-do list. Це налаштування системи перед стартом дня. 4 питання за 5 хвилин.
          </Text>

          {/* ── Step 0: Belief of day ── */}
          <StepCard index={0} checked={checked[0]} onToggleCheck={() => toggleCheck(0)}>
            {beliefs.length === 0 ? (
              <View style={[s.inputContainer, { backgroundColor: C.bg }]}>
                <Text style={[s.emptyText, { color: C.textSecondary }]}>
                  Немає активних установок. Відкрийте Mindset і почніть роботу.
                </Text>
              </View>
            ) : (
              <View style={[s.inputContainer, { backgroundColor: C.bg }]}>
                {beliefs.map((ub) => (
                  <Pressable
                    key={ub.id}
                    onPress={() => setBeliefOfDayId(beliefOfDayId === ub.id ? null : ub.id)}
                    style={({ pressed }) => [
                      s.beliefRow,
                      {
                        backgroundColor:
                          beliefOfDayId === ub.id ? C.primary : C.surface2,
                      },
                      pressed && beliefOfDayId !== ub.id && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={[
                        s.beliefRowText,
                        { color: beliefOfDayId === ub.id ? '#060810' : C.text },
                      ]}
                      numberOfLines={3}
                    >
                      {getBeliefTitle(ub)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </StepCard>

          {/* ── Step 1: Intention ── */}
          <StepCard index={1} checked={checked[1]} onToggleCheck={() => toggleCheck(1)}>
            <View style={[s.inputContainer, { backgroundColor: C.bg }]}>
              <TextInput
                style={[s.textInput, { color: C.text }]}
                placeholder="Сьогодні я хочу відчути або досягти..."
                placeholderTextColor={C.textTertiary}
                multiline
                textAlignVertical="top"
                value={intention}
                onChangeText={setIntention}
              />
            </View>
          </StepCard>

          {/* ── Step 2: Gratitude ── */}
          <StepCard index={2} checked={checked[2]} onToggleCheck={() => toggleCheck(2)}>
            <View style={[s.inputContainer, { backgroundColor: C.bg }]}>
              {gratitude.map((g, i) => (
                <TextInput
                  key={i}
                  style={[
                    s.textInput,
                    { color: C.text },
                    i < 2 && s.gratitudeSpacing,
                  ]}
                  placeholder={`${i + 1}. Вдячний за...`}
                  placeholderTextColor={C.textTertiary}
                  value={g}
                  onChangeText={(v) => {
                    const next: [string, string, string] = [
                      ...gratitude,
                    ] as [string, string, string];
                    next[i] = v;
                    setGratitude(next);
                  }}
                  returnKeyType={i < 2 ? 'next' : 'done'}
                />
              ))}
            </View>
          </StepCard>

          {/* ── Step 3: Focus tasks ── */}
          <StepCard index={3} checked={checked[3]} onToggleCheck={() => toggleCheck(3)}>
            <View style={[s.inputContainer, { backgroundColor: C.bg }]}>
              {tasks.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => toggleFocus(t.id)}
                  style={[s.taskRow, { opacity: !focusIds.has(t.id) && focusIds.size >= 3 ? 0.4 : 1 }]}
                >
                  <View
                    style={[
                      s.taskCheck,
                      {
                        backgroundColor: focusIds.has(t.id) ? C.primary : 'transparent',
                        borderColor: focusIds.has(t.id) ? C.primary : C.borderActive,
                      },
                    ]}
                  >
                    {focusIds.has(t.id) && (
                      <Icon name="Check" size={12} color="#060810" />
                    )}
                  </View>
                  <Text style={[s.taskTitle, { color: C.text }]} numberOfLines={2}>
                    {t.title}
                  </Text>
                </Pressable>
              ))}

              {/* New task inline input */}
              <View style={s.taskRow}>
                <View style={[s.taskCheck, { borderColor: C.borderActive }]} />
                <TextInput
                  style={[s.taskInput, { color: C.text }]}
                  placeholder="＋ Нова задача..."
                  placeholderTextColor={C.textTertiary}
                  value={newTaskInput}
                  onChangeText={setNewTaskInput}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                />
              </View>

              {focusIds.size > 0 && (
                <View style={[s.focusBadge, { backgroundColor: C.primaryMuted }]}>
                  <Text style={[s.focusBadgeText, { color: C.primary }]}>
                    {focusIds.size}/3 фокус-задач обрано
                  </Text>
                </View>
              )}
            </View>
          </StepCard>

          {/* Complete card */}
          {allCompleted && (
            <View style={[s.completeCard, { backgroundColor: C.surface2 }]}>
              <Text style={s.completeCheck}>✓</Text>
              <Text style={[s.completeTitle, { color: C.text }]}>Ритуал завершено</Text>
              <Text style={[s.completeSubtitle, { color: C.textSecondary }]}>
                Ти готовий до дня
              </Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
          <Pressable
            style={({ pressed }) => [
              s.ctaButton,
              { backgroundColor: C.primary, opacity: allCompleted ? (pressed ? 0.85 : 1) : 0.3 },
            ]}
            onPress={handleFinish}
            disabled={!allCompleted || saving}
          >
            {saving ? (
              <ActivityIndicator color="#060810" />
            ) : (
              <Text style={s.ctaText}>Завершити ритуал</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  headerTime: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
  },

  scrollContent: {
    padding: 20,
  },

  introText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  // Step card
  stepCard: {
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
  },
  stepDescription: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  stepBody: {
    marginTop: 16,
  },

  // Input container (shared bg wrapper)
  inputContainer: {
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: 0,
  },

  textInput: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 40,
  },

  gratitudeSpacing: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163,174,196,0.1)',
    paddingBottom: 12,
    marginBottom: 12,
  },

  emptyText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Belief list
  beliefRow: {
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  beliefRowText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 21,
  },

  // Task rows
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskTitle: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 21,
  },
  taskInput: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
  },

  focusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  focusBadgeText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 12,
  },

  // Complete card
  completeCard: {
    borderRadius: Radius.lg,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  completeCheck: {
    fontSize: 48,
    color: '#C8FF00',
    lineHeight: 56,
  },
  completeTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 20,
  },
  completeSubtitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    padding: 20,
  },
  ctaButton: {
    borderRadius: Radius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    color: '#060810',
  },
});
