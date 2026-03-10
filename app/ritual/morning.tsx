import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useBeliefs, getBeliefTitle, getBeliefCategory, getCompletedStages } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';
import { RingProgress } from '@/components/charts/RingProgress';
import { CATEGORY_MAP } from '@/constants/categories';
import { STAGE_COLORS } from '@/constants/stages';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { todayISO, formatDisplayDate } from '@/utils/dates';
import { UserBelief, Task } from '@/types';

const TOTAL_STEPS = 4;

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  const C = useTheme();
  return (
    <View style={dotsStyles.row}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            dotsStyles.dot,
            { backgroundColor: i <= step ? C.primary : C.surface3 },
            i === step && dotsStyles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

const dotsStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 32 },
});

// ─── Belief Card (vertical list item) ────────────────────────────────────────

function BeliefSelectCard({
  ub,
  selected,
  onSelect,
}: {
  ub: UserBelief;
  selected: boolean;
  onSelect: () => void;
}) {
  const C = useTheme();
  const title = getBeliefTitle(ub);

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        beliefCardStyles.card,
        selected
          ? { backgroundColor: C.primary }
          : { backgroundColor: C.surface2 },
        pressed && !selected && { backgroundColor: C.surface3 },
      ]}
    >
      <Text
        style={[
          beliefCardStyles.title,
          { color: selected ? '#060810' : C.text },
        ]}
        numberOfLines={3}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const beliefCardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
  },
  title: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    fontStyle: 'italic',
  },
});

// ─── Focus Task Row (simplified: checkbox + text) ────────────────────────────

function FocusTaskRow({
  task,
  isFocused,
  canAddMore,
  onToggle,
}: {
  task: Task;
  isFocused: boolean;
  canAddMore: boolean;
  onToggle: () => void;
}) {
  const C = useTheme();
  const disabled = !isFocused && !canAddMore;

  return (
    <Pressable
      onPress={disabled ? undefined : onToggle}
      style={[
        taskRowStyles.row,
        { backgroundColor: C.surface2 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <View
        style={[
          taskRowStyles.checkbox,
          {
            backgroundColor: isFocused ? C.primary : 'transparent',
            borderColor: isFocused ? C.primary : C.textTertiary,
          },
        ]}
      >
        {isFocused && <Icon name="Check" size={14} color="#060810" />}
      </View>
      <Text style={[taskRowStyles.title, { color: C.text }]} numberOfLines={2}>
        {task.title}
      </Text>
    </Pressable>
  );
}

const taskRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 19,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MorningRitualScreen() {
  const C = useTheme();
  const { beliefs, fetchBeliefs } = useBeliefs();
  const { tasks, fetchTasks, addTask, updateTask } = useTasks();
  const { saveEntry } = useJournal();

  // Step state
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Step 0: intention
  const [intention, setIntention] = useState('');
  // Step 1: gratitude
  const [gratitude, setGratitude] = useState<[string, string, string]>(['', '', '']);
  // Step 2: belief of day
  const [beliefOfDayId, setBeliefOfDayId] = useState<string | null>(null);
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

  // ─── Transition ───────────────────────────────────────────────────────────

  const transitionTo = (nextStep: number) => {
    const dir = nextStep > step ? 1 : -1;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -dir * 28, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(dir * 28);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, speed: 22, bounciness: 3, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => { if (step < TOTAL_STEPS - 1) transitionTo(step + 1); };
  const handleBack = () => { if (step > 0) transitionTo(step - 1); };

  // ─── Focus task actions ───────────────────────────────────────────────────

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

  const handleAddInlineTask = async () => {
    if (!newTaskInput.trim()) return;
    await addTask(newTaskInput.trim(), { date: todayISO() });
    setNewTaskInput('');
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleFinish = async () => {
    setSaving(true);
    try {
      const today = todayISO();
      const updates = tasks.map((t) =>
        updateTask(t.id, { is_focus: focusIds.has(t.id) }),
      );
      await Promise.all(updates);

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

  // ─── Step content ─────────────────────────────────────────────────────────

  const canProceed = () => {
    if (step === 0) return intention.trim().length > 0;
    if (step === 1) return gratitude.some((g) => g.trim().length > 0);
    return true;
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Centered dots */}
          <View style={styles.dotsWrap}>
            <ProgressDots step={step} />
          </View>

          {/* Centered title */}
          <Text style={[styles.mainTitle, { color: C.text }]}>
            Ранковий ритуал
          </Text>

          {/* Step content */}
          <Animated.View
            style={[
              styles.stepWrap,
              { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
            ]}
          >
            {/* ─── Step 0: Intention ─── */}
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Що хочу досягти або відчути сьогодні?
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Один ясний намір задає тон усьому дню.
                </Text>
                <TextInput
                  style={[styles.bigTextarea, { backgroundColor: C.surface2, color: C.text, borderColor: C.border }]}
                  placeholder="Сьогодні я хочу відчути..."
                  placeholderTextColor={C.textTertiary}
                  multiline
                  textAlignVertical="top"
                  value={intention}
                  onChangeText={setIntention}
                  autoFocus
                />
              </View>
            )}

            {/* ─── Step 1: Gratitude ─── */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  3 речі, за які я вдячний/на
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Навіть дрібниці мають значення. Конкретність — ключ.
                </Text>
                <View style={styles.gratitudeList}>
                  {gratitude.map((g, i) => (
                    <View key={i} style={styles.gratitudeRow}>
                      <View style={[styles.gratitudeNum, { backgroundColor: C.primary + '20' }]}>
                        <Text style={[styles.gratitudeNumText, { color: C.primary }]}>{i + 1}</Text>
                      </View>
                      <TextInput
                        style={[styles.gratitudeInput, { backgroundColor: C.surface2, color: C.text, borderColor: C.border }]}
                        placeholder={['Маю здорове тіло...', 'Люди поряд...', 'Справа, яка надихає...'][i]}
                        placeholderTextColor={C.textTertiary}
                        value={g}
                        onChangeText={(v) => {
                          const next: [string, string, string] = [...gratitude] as [string, string, string];
                          next[i] = v;
                          setGratitude(next);
                        }}
                        returnKeyType={i < 2 ? 'next' : 'done'}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── Step 2: Belief of day (vertical list) ─── */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Оберіть установку для роботи сьогодні
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Одна установка в фокусі — глибша рефлексія протягом дня.
                </Text>
                {beliefs.length === 0 ? (
                  <View style={[styles.noBeliefs, { backgroundColor: C.surface2 }]}>
                    <Text style={[styles.noBeliefsText, { color: C.textSecondary }]}>
                      Немає активних установок. Відкрийте Mindset і почніть роботу.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.beliefList}>
                    {beliefs.map((ub) => (
                      <BeliefSelectCard
                        key={ub.id}
                        ub={ub}
                        selected={beliefOfDayId === ub.id}
                        onSelect={() =>
                          setBeliefOfDayId(beliefOfDayId === ub.id ? null : ub.id)
                        }
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ─── Step 3: Focus tasks (checkbox + input rows) ─── */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Максимум 3 фокус-задачі
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Це ваші «must-do» на сьогодні. Решта — бонус.
                </Text>

                <View style={styles.taskList}>
                  {tasks.length === 0 ? (
                    <View style={[styles.noTasks, { backgroundColor: C.surface2 }]}>
                      <Text style={[styles.noTasksText, { color: C.textTertiary }]}>
                        Задач немає. Додайте першу нижче.
                      </Text>
                    </View>
                  ) : (
                    tasks.map((t) => (
                      <FocusTaskRow
                        key={t.id}
                        task={t}
                        isFocused={focusIds.has(t.id)}
                        canAddMore={focusIds.size < 3}
                        onToggle={() => toggleFocus(t.id)}
                      />
                    ))
                  )}
                </View>

                {/* Inline add task */}
                <View style={[styles.inlineAdd, { backgroundColor: C.surface2 }]}>
                  <View style={[styles.addCheckbox, { borderColor: C.textTertiary }]} />
                  <TextInput
                    style={[styles.inlineInput, { color: C.text }]}
                    placeholder="＋ Нова задача на сьогодні..."
                    placeholderTextColor={C.textTertiary}
                    value={newTaskInput}
                    onChangeText={setNewTaskInput}
                    onSubmitEditing={handleAddInlineTask}
                    returnKeyType="done"
                  />
                </View>

                {focusIds.size > 0 && (
                  <View style={[styles.focusCounter, { backgroundColor: C.primary + '18' }]}>
                    <Text style={[styles.focusCounterText, { color: C.primary }]}>
                      {focusIds.size}/3 фокус-задач обрано
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Navigation — inline in content */}
          <View style={styles.navRow}>
            {step > 0 ? (
              <Pressable
                style={[styles.backBtn, { borderColor: C.border }]}
                onPress={handleBack}
              >
                <Text style={[styles.backBtnText, { color: C.textSecondary }]}>Назад</Text>
              </Pressable>
            ) : (
              <View />
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Pressable
                style={({ pressed }) => [
                  styles.nextBtn,
                  { backgroundColor: C.primary },
                  !canProceed() && { opacity: 0.45 },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
                onPress={handleNext}
              >
                <Text style={[styles.nextBtnText, { color: C.surface1 }]}>Далі</Text>
                <Icon name="ArrowRight" size={16} color={C.surface1} />
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.nextBtn,
                  { backgroundColor: C.primary },
                  saving && { opacity: 0.6 },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
                onPress={handleFinish}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={C.surface1} size="small" />
                ) : (
                  <Text style={[styles.nextBtnText, { color: C.surface1 }]}>Готово. Дій.</Text>
                )}
              </Pressable>
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: { paddingBottom: Spacing.xxl },

  dotsWrap: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },

  mainTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  stepWrap: {},

  stepContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  stepTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
    marginBottom: Spacing.sm,
  },
  stepHint: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  bigTextarea: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    fontFamily: FontFamily.sansMedium,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
  },

  gratitudeList: { gap: Spacing.md },
  gratitudeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  gratitudeNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  gratitudeNumText: { fontFamily: FontFamily.sansSemiBold, fontSize: 13 },
  gratitudeInput: {
    flex: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
  },

  beliefList: {
    gap: Spacing.sm,
  },

  noBeliefs: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noBeliefsText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  taskList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  noTasks: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noTasksText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  inlineAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  addCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    flexShrink: 0,
  },
  inlineInput: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
  },

  focusCounter: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  focusCounterText: { fontFamily: FontFamily.sansSemiBold, fontSize: 12 },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xl,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  backBtnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 14 },
  nextBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextBtnText: { fontFamily: FontFamily.sansBold, fontSize: 15 },
});
