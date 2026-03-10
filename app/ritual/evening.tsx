import { useState, useRef, useCallback } from 'react';
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
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { todayISO, formatDisplayDate } from '@/utils/dates';
import { Task } from '@/types';

const TOTAL_STEPS = 4;

// ─── Progress Dots ─────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  const C = useTheme();
  return (
    <View style={dotsStyles.row}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            dotsStyles.dot,
            { backgroundColor: i <= step ? '#7BB8C9' : C.surface3 },
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

// ─── Focus Result Row ──────────────────────────────────────────────────────

type FocusResult = 'done' | 'skipped' | null;

function FocusResultRow({
  task,
  result,
  onSelect,
}: {
  task: Task;
  result: FocusResult;
  onSelect: (r: FocusResult) => void;
}) {
  const C = useTheme();

  return (
    <View style={[resultStyles.row, { borderBottomColor: C.border }]}>
      <Text style={[resultStyles.title, { color: C.text }]} numberOfLines={2}>
        {task.title}
      </Text>
      <View style={resultStyles.btns}>
        <Pressable
          style={[
            resultStyles.btn,
            {
              backgroundColor: result === 'done' ? '#7CB392' : C.surface3,
              borderColor: result === 'done' ? '#7CB392' : C.border,
            },
          ]}
          onPress={() => onSelect(result === 'done' ? null : 'done')}
        >
          <Text style={[resultStyles.btnText, { color: result === 'done' ? '#fff' : C.textSecondary }]}>
            Виконав
          </Text>
        </Pressable>
        <Pressable
          style={[
            resultStyles.btn,
            {
              backgroundColor: result === 'skipped' ? '#E8976B' : C.surface3,
              borderColor: result === 'skipped' ? '#E8976B' : C.border,
            },
          ]}
          onPress={() => onSelect(result === 'skipped' ? null : 'skipped')}
        >
          <Text style={[resultStyles.btnText, { color: result === 'skipped' ? '#fff' : C.textSecondary }]}>
            Не встиг
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const resultStyles = StyleSheet.create({
  row: {
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: FontFamily.sansMedium, fontSize: 14, lineHeight: 19 },
  btns: { flexDirection: 'row', gap: Spacing.sm },
  btn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  btnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 12 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function EveningRitualScreen() {
  const C = useTheme();
  const { tasks, fetchTasks } = useTasks();
  const { saveEntry } = useJournal();

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Step 0: wins
  const [wins, setWins] = useState<[string, string, string]>(['', '', '']);
  // Step 1: learned
  const [learned, setLearned] = useState('');
  // Step 2: tomorrow
  const [tomorrow, setTomorrow] = useState('');
  // Step 3: focus results
  const [focusResults, setFocusResults] = useState<Record<string, FocusResult>>({});
  const [saving, setSaving] = useState(false);

  const focusTasks = tasks.filter((t) => t.is_focus);

  useFocusEffect(
    useCallback(() => {
      fetchTasks(todayISO());
    }, [fetchTasks]),
  );

  // ─── Transition ─────────────────────────────────────────────────────────

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

  const setFocusResult = (taskId: string, result: FocusResult) => {
    setFocusResults((prev) => ({ ...prev, [taskId]: result }));
  };

  // ─── Save ───────────────────────────────────────────────────────────────

  const handleFinish = async () => {
    setSaving(true);
    try {
      const focusResultsList = focusTasks.map((t) => ({
        task_id: t.id,
        completed: focusResults[t.id] === 'done',
      }));

      await saveEntry('evening', {
        wins: wins.map((w) => w.trim()),
        learned: learned.trim(),
        tomorrow: tomorrow.trim(),
        focus_results: focusResultsList,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    } finally {
      setSaving(false);
    }
  };

  const stepMeta = [
    { icon: 'Award' as const, title: 'Перемоги дня' },
    { icon: 'Lightbulb' as const, title: 'Інсайт дня' },
    { icon: 'ArrowRight' as const, title: 'Завтра' },
    { icon: 'CheckCircle2' as const, title: 'Огляд фокусу' },
  ];

  const current = stepMeta[step];
  const accentColor = '#7BB8C9';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="X" size={20} color={C.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Icon name="Moon" size={18} color={accentColor} />
          <Text style={[styles.headerTitle, { color: C.text }]}>Вечірній ритуал</Text>
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
        <Animated.View style={[styles.stepWrap, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ─── Step 0: Wins ─── */}
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  3 перемоги сьогодні
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Кожна справа, якою пишаєтесь — велика чи мала.
                </Text>
                <View style={styles.winsRow}>
                  {wins.map((w, i) => (
                    <View key={i} style={styles.winItem}>
                      <View style={[styles.winBadge, { backgroundColor: accentColor + '22' }]}>
                        <Text style={[styles.winBadgeText, { color: accentColor }]}>
                          {i + 1}
                        </Text>
                      </View>
                      <TextInput
                        style={[styles.winInput, { backgroundColor: C.surface2, color: C.text, borderColor: C.border }]}
                        placeholder={['Найголовніша перемога...', 'Ще одна...', 'І третя...'][i]}
                        placeholderTextColor={C.textTertiary}
                        value={w}
                        onChangeText={(v) => {
                          const next: [string, string, string] = [...wins] as [string, string, string];
                          next[i] = v;
                          setWins(next);
                        }}
                        returnKeyType={i < 2 ? 'next' : 'done'}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── Step 1: Learned ─── */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Що я зрозумів/ла сьогодні?
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Про себе, роботу, стосунки, світ. Один щирий інсайт.
                </Text>
                <TextInput
                  style={[styles.bigTextarea, { backgroundColor: C.surface2, color: C.text, borderColor: C.border }]}
                  placeholder="Сьогодні я зрозумів/ла, що..."
                  placeholderTextColor={C.textTertiary}
                  multiline
                  textAlignVertical="top"
                  value={learned}
                  onChangeText={setLearned}
                  autoFocus
                />
              </View>
            )}

            {/* ─── Step 2: Tomorrow ─── */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Що завтра зроблю інакше?
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Маленька зміна у підході — великий вплив на результат.
                </Text>
                <TextInput
                  style={[styles.bigTextarea, { backgroundColor: C.surface2, color: C.text, borderColor: C.border }]}
                  placeholder="Завтра я буду більш..."
                  placeholderTextColor={C.textTertiary}
                  multiline
                  textAlignVertical="top"
                  value={tomorrow}
                  onChangeText={setTomorrow}
                  autoFocus
                />
              </View>
            )}

            {/* ─── Step 3: Focus results ─── */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Огляд фокус-задач
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Чесно відзначте, що вдалось, а що — ні. Без суду.
                </Text>

                {focusTasks.length === 0 ? (
                  <View style={[styles.noFocusCard, { backgroundColor: C.surface2 }]}>
                    <Text style={[styles.noFocusText, { color: C.textSecondary }]}>
                      Сьогодні не було фокус-задач. Завтра виберіть їх на ранковому ритуалі.
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.focusResultsList, { backgroundColor: C.surface2 }]}>
                    {focusTasks.map((t) => (
                      <FocusResultRow
                        key={t.id}
                        task={t}
                        result={focusResults[t.id] ?? null}
                        onSelect={(r) => setFocusResult(t.id, r)}
                      />
                    ))}
                  </View>
                )}

                {focusTasks.length > 0 && (
                  <View style={[styles.resultSummary, { backgroundColor: C.surface2 }]}>
                    <Text style={[styles.resultSummaryText, { color: C.textSecondary }]}>
                      {Object.values(focusResults).filter((r) => r === 'done').length} з {focusTasks.length} виконано
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
                { backgroundColor: accentColor },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleNext}
            >
              <Text style={[styles.nextBtnText, { color: '#fff' }]}>Далі →</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: accentColor },
                saving && { opacity: 0.6 },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleFinish}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.nextBtnText, { color: '#fff' }]}>День закритий.</Text>
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
  headerTitle: { fontFamily: FontFamily.serifBold, fontSize: 18, letterSpacing: -0.2 },

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
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
  },

  winsRow: { gap: Spacing.md },
  winItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  winBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  winBadgeText: { fontSize: 18 },
  winInput: {
    flex: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
  },

  noFocusCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noFocusText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  focusResultsList: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },

  resultSummary: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  resultSummaryText: { fontFamily: FontFamily.sansSemiBold, fontSize: 13 },

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
