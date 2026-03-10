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
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 20 },
});

// ─── Belief Card (mini, for selection) ────────────────────────────────────────

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
  const catKey = getBeliefCategory(ub);
  const cat = catKey ? CATEGORY_MAP[catKey] : null;
  const color = catKey ? (STAGE_COLORS as Record<string, string>)[catKey] ?? C.primary : C.primary;
  const completed = getCompletedStages(ub);
  const title = getBeliefTitle(ub);

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        beliefCardStyles.card,
        selected
          ? { backgroundColor: C.primary }
          : { backgroundColor: C.surface2 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text
        style={[
          beliefCardStyles.title,
          { color: selected ? '#060810' : C.text },
        ]}
        numberOfLines={2}
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
  },
  top: {},
  catIcon: {},
  title: {
    fontFamily: FontFamily.serifItalic,
        fontSize: 15,
    lineHeight: 21,
  },
  stage: {},
  stageText: {},
  check: {},
  checkText: {},
});

// ─── Task Focus Toggle Row ────────────────────────────────────────────────────

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
        { borderBottomColor: C.border },
        disabled && { opacity: 0.4 },
      ]}
    >
      <View
        style={[
          taskRowStyles.star,
          {
            backgroundColor: isFocused ? C.primary : C.surface3,
            borderColor: isFocused ? C.primary : C.border,
          },
        ]}
      >
        <Icon name="Zap" size={14} color={isFocused ? '#060810' : C.textTertiary} />
      </View>
      <Text style={[taskRowStyles.title, { color: C.text }]} numberOfLines={2}>
        {task.title}
      </Text>
      {isFocused && (
        <View style={[taskRowStyles.focusBadge, { backgroundColor: C.primary + '20' }]}>
          <Text style={[taskRowStyles.focusBadgeText, { color: C.primary }]}>Фокус</Text>
        </View>
      )}
    </Pressable>
  );
}

const taskRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  star: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: { fontSize: 14, fontWeight: '700' },
  title: { flex: 1, fontFamily: FontFamily.sansMedium, fontSize: 14, lineHeight: 19 },
  focusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  focusBadgeText: { fontFamily: FontFamily.sansSemiBold, fontSize: 10 },
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

  // Pre-select currently focused tasks
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
      // Update focus flags on tasks
      const today = todayISO();
      const updates = tasks.map((t) =>
        updateTask(t.id, { is_focus: focusIds.has(t.id) }),
      );
      await Promise.all(updates);

      // Save journal entry
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
    return true; // steps 2 and 3 are optional
  };

  const stepMeta = [
    { icon: 'Target' as const, title: 'Намір на сьогодні' },
    { icon: 'Sparkles' as const, title: 'Вдячність' },
    { icon: 'Brain' as const, title: 'Установка дня' },
    { icon: 'CheckCircle2' as const, title: 'Фокус-задачі' },
  ];

  const current = stepMeta[step];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="X" size={20} color={C.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Icon name={current.icon} size={18} color={C.primary} />
          <Text style={[styles.headerTitle, { color: C.text }]}>Ранковий ритуал</Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      {/* Date + progress */}
      <View style={styles.meta}>
        <Text style={[styles.dateText, { color: C.textTertiary }]}>
          {formatDisplayDate(new Date())}
        </Text>
        <ProgressDots step={step} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Step content */}
        <Animated.View
          style={[
            styles.stepWrap,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
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

            {/* ─── Step 2: Belief of day ─── */}
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
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.beliefScroll}
                  >
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
                  </ScrollView>
                )}
              </View>
            )}

            {/* ─── Step 3: Focus tasks ─── */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Максимум 3 фокус-задачі
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Це ваші «must-do» на сьогодні. Решта — бонус.
                </Text>

                <View style={[styles.taskList, { backgroundColor: C.surface2 }]}>
                  {tasks.length === 0 ? (
                    <Text style={[styles.noTasksText, { color: C.textTertiary }]}>
                      Задач немає. Додайте першу нижче.
                    </Text>
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
                <View style={[styles.inlineAdd, { borderColor: C.border, backgroundColor: C.surface2 }]}>
                  <TextInput
                    style={[styles.inlineInput, { color: C.text }]}
                    placeholder="＋ Нова задача на сьогодні..."
                    placeholderTextColor={C.textTertiary}
                    value={newTaskInput}
                    onChangeText={setNewTaskInput}
                    onSubmitEditing={handleAddInlineTask}
                    returnKeyType="done"
                  />
                  {newTaskInput.trim().length > 0 && (
                    <Pressable
                      onPress={handleAddInlineTask}
                      style={[styles.inlineAddBtn, { backgroundColor: C.primary }]}
                    >
                      <Text style={[styles.inlineAddBtnText, { color: C.surface1 }]}>+</Text>
                    </Pressable>
                  )}
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
          </ScrollView>
        </Animated.View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: C.border, backgroundColor: C.surface1 }]}>
          <Pressable
            style={[styles.backBtn, { borderColor: C.border }, step === 0 && { opacity: 0 }]}
            onPress={handleBack}
            disabled={step === 0}
          >
            <Text style={[styles.backBtnText, { color: C.textSecondary }]}>← Назад</Text>
          </Pressable>

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
              <Text style={[styles.nextBtnText, { color: C.surface1 }]}>Далі →</Text>
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
  closeBtn: { width: 36, alignItems: 'center' },
  closeText: { fontFamily: FontFamily.sans, fontSize: 20 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerEmoji: { fontSize: 18 },
  headerTitle: {
    fontFamily: FontFamily.serifBold,
    fontSize: 18,
    letterSpacing: -0.2,
  },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  dateText: { fontFamily: FontFamily.sansMedium, fontSize: 12 },

  stepWrap: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl },

  stepContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.lg },
  stepTitle: {
    fontFamily: FontFamily.serifBold,
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

  beliefScroll: { paddingBottom: Spacing.sm },

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
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    minHeight: 60,
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
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  inlineInput: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
  },
  inlineAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAddBtnText: { fontSize: 18, fontWeight: '300' },

  focusCounter: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  focusCounterText: { fontFamily: FontFamily.sansSemiBold, fontSize: 12 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  backBtnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 14 },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { fontFamily: FontFamily.sansBold, fontSize: 15 },
});
