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
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import {
  useBeliefs,
  getBeliefTitle,
  getBeliefCategory,
  getCompletedStages,
} from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { RingProgress } from '@/components/charts/RingProgress';
import { STAGES, STAGE_COLORS, StageKey, Stage } from '@/constants/stages';
import { Icon } from '@/components/ui/Icon';
import { CATEGORY_MAP } from '@/constants/categories';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { UserBelief } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStageContent(ub: UserBelief, key: StageKey): string | null {
  const fieldMap: Record<StageKey, string> = {
    identify: 'conviction_uk',
    explore: 'source_hypothesis_uk',
    reality: 'source_hypothesis_uk',
    replace: 'new_belief_template_uk',
    action: 'experiment_template_uk',
    identity: 'identity_template_uk',
  };
  if (ub.belief_id && ub.belief) {
    return (ub.belief as unknown as Record<string, string>)[fieldMap[key]] ?? null;
  }
  const customMap: Record<StageKey, string | null> = {
    identify: ub.custom_conviction,
    explore: ub.custom_source,
    reality: ub.custom_source,
    replace: ub.custom_new_belief,
    action: ub.custom_experiment,
    identity: ub.custom_identity,
  };
  return customMap[key];
}

function getStageStatus(
  stage: Stage,
  ub: UserBelief,
): 'completed' | 'current' | 'locked' {
  if (ub.completed_stages?.[stage.key]) return 'completed';
  if (stage.index === ub.current_stage) return 'current';
  return 'locked';
}

// ─── Score Selector ───────────────────────────────────────────────────────────

function ScoreSelector({
  value,
  onChange,
  color,
}: {
  value: number | null;
  onChange: (v: number) => void;
  color: string;
}) {
  const C = useTheme();
  return (
    <View style={scoreStyles.row}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[
              scoreStyles.btn,
              { backgroundColor: active ? color : C.surface3 },
            ]}
          >
            <Text
              style={[
                scoreStyles.btnText,
                { color: active ? C.surface1 : C.textSecondary },
              ]}
            >
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
  },
});

// ─── Stage Row ────────────────────────────────────────────────────────────────

interface StageRowProps {
  stage: Stage;
  status: 'completed' | 'current' | 'locked';
  reflection: string;
  onChangeReflection: (text: string) => void;
  saving: boolean;
  onContinue: () => void;
  onCoach: () => void;
  onCreateTask?: () => void;
  showTaskBtn?: boolean;
}

function StageRow({
  stage,
  status,
  reflection,
  onChangeReflection,
  saving,
  onContinue,
  onCoach,
  onCreateTask,
  showTaskBtn,
}: StageRowProps) {
  const C = useTheme();

  if (status === 'completed') {
    return (
      <View style={[stageStyles.row, stageStyles.rowCompleted, { backgroundColor: C.surface2 }]}>
        <View style={[stageStyles.circle, { backgroundColor: C.primary }]}>
          <Icon name="Check" size={14} strokeWidth={2.5} color="#060810" />
        </View>
        <View style={stageStyles.rowContent}>
          <Text style={[stageStyles.rowTitle, { color: C.text }]}>{stage.nameUk}</Text>
          <Text style={[stageStyles.rowDesc, { color: C.textSecondary }]}>{stage.descriptionUk}</Text>
        </View>
      </View>
    );
  }

  if (status === 'locked') {
    return (
      <View style={[stageStyles.row, stageStyles.rowLocked, { backgroundColor: C.surface2, opacity: 0.5 }]}>
        <View style={[stageStyles.circle, { backgroundColor: C.surface3 }]}>
          <Icon name="Lock" size={14} color={C.textSecondary} strokeWidth={1.5} />
        </View>
        <View style={stageStyles.rowContent}>
          <Text style={[stageStyles.rowTitle, { color: C.text }]}>{stage.nameUk}</Text>
          <Text style={[stageStyles.rowDesc, { color: C.textSecondary }]}>{stage.descriptionUk}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[stageStyles.currentCard, { backgroundColor: C.surface2, borderColor: 'rgba(200,255,0,0.5)' }]}>
      <View style={stageStyles.currentHeader}>
        <View style={[stageStyles.circle, { backgroundColor: C.primary }]}>
          <Text style={stageStyles.circleNum}>{stage.index}</Text>
        </View>
        <View style={stageStyles.rowContent}>
          <Text style={[stageStyles.currentName, { color: C.text }]}>{stage.nameUk}</Text>
          <Text style={[stageStyles.currentDesc, { color: C.textSecondary }]}>{stage.descriptionUk}</Text>
        </View>
      </View>

      {/* Question — italic */}
      <View style={stageStyles.questionWrap}>
        <Text style={[stageStyles.questionText, { color: C.textSecondary }]}>
          {stage.questionUk}
        </Text>
      </View>

      {/* Textarea */}
      <TextInput
        style={[
          stageStyles.textarea,
          { backgroundColor: C.surface3, color: C.text },
        ]}
        placeholder="Напишіть вашу відповідь..."
        placeholderTextColor={C.textTertiary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={reflection}
        onChangeText={onChangeReflection}
      />

      {/* Action buttons */}
      <View style={stageStyles.btnRow}>
        <Pressable
          style={({ pressed }) => [
            stageStyles.coachBtn,
            { borderColor: C.border },
            pressed && { opacity: 0.7 },
          ]}
          onPress={onCoach}
        >
          <Icon name="MessageSquare" size={18} color={C.textSecondary} strokeWidth={1.5} />
          <Text style={[stageStyles.coachBtnText, { color: C.textSecondary }]}>Запитати коуча</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            stageStyles.continueBtn,
            { backgroundColor: C.primary },
            (!reflection.trim() || saving) && { opacity: 0.5 },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          onPress={onContinue}
          disabled={!reflection.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color="#060810" size="small" />
          ) : (
            <>
              <Text style={stageStyles.continueBtnText}>Продовжити шлях</Text>
              <Icon name="ArrowRight" size={18} strokeWidth={1.5} color="#060810" />
            </>
          )}
        </Pressable>
      </View>

      {showTaskBtn && (
        <Pressable
          style={({ pressed }) => [
            stageStyles.taskBtn,
            { borderColor: C.primary, backgroundColor: C.primaryMuted },
            pressed && { opacity: 0.75 },
          ]}
          onPress={onCreateTask}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="Plus" size={14} color={C.primary} />
            <Text style={[stageStyles.taskBtnText, { color: C.primary }]}>Створити задачу</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const stageStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: Radius.lg,
    marginBottom: 12,
  },
  rowCompleted: {
    padding: 20,
  },
  rowLocked: {
    padding: 20,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  rowDesc: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  circleNum: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12,
    color: '#060810',
  },

  currentCard: {
    borderRadius: Radius.lg,
    padding: 24,
    marginBottom: 12,
    borderWidth: 1,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  currentName: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 2,
  },
  currentDesc: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  questionWrap: {
    marginBottom: 16,
  },
  questionText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  textarea: {
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 100,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  coachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  coachBtnText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    minHeight: 46,
  },
  continueBtnText: {
    color: '#060810',
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 14,
  },
  taskBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  taskBtnText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 14,
  },
});

// ─── Butterfly Completion ─────────────────────────────────────────────────────

function ButterflyOverlay({
  visible,
  scoreBefore,
  scoreAfter,
  identityText,
  onDone,
}: {
  visible: boolean;
  scoreBefore: number;
  scoreAfter: number;
  identityText: string | null;
  onDone: () => void;
}) {
  const C = useTheme();
  const scale = useRef(new Animated.Value(0.1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, speed: 5, bounciness: 18, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(statsOpacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, opacity, scale, statsOpacity]);

  if (!visible) return null;

  const diff = scoreBefore - scoreAfter;
  const color = STAGE_COLORS.identity;

  return (
    <View style={[butterflyStyles.overlay, { backgroundColor: C.surface1 }]}>
      <Animated.View style={[butterflyStyles.content, { opacity, transform: [{ scale }] }]}>
        <View style={butterflyStyles.sparklesWrap}>
          <Icon name="Sparkles" size={64} color={STAGE_COLORS.identity} />
        </View>
      </Animated.View>

      <Animated.View style={[butterflyStyles.stats, { opacity: statsOpacity }]}>
        <Text style={[butterflyStyles.title, { color: C.text }]}>
          Трансформація завершена
        </Text>

        <View style={[butterflyStyles.scoreCard, { backgroundColor: C.surface2 }]}>
          <View style={butterflyStyles.scoreRow}>
            <View style={butterflyStyles.scoreItem}>
              <Text style={[butterflyStyles.scoreLabel, { color: C.textSecondary }]}>Було</Text>
              <Text style={[butterflyStyles.scoreNum, { color: C.textSecondary }]}>{scoreBefore}/10</Text>
            </View>
            <Text style={[butterflyStyles.arrow, { color: color }]}>→</Text>
            <View style={butterflyStyles.scoreItem}>
              <Text style={[butterflyStyles.scoreLabel, { color: color }]}>Стало</Text>
              <Text style={[butterflyStyles.scoreNum, { color: color }]}>{scoreAfter}/10</Text>
            </View>
          </View>
          {diff > 0 && (
            <Text style={[butterflyStyles.diffText, { color: C.textSecondary }]}>
              Ви звільнили {diff} пункт{diff === 1 ? '' : diff < 5 ? 'и' : 'ів'} потенціалу
            </Text>
          )}
        </View>

        {!!identityText && (
          <View style={[butterflyStyles.identityCard, { backgroundColor: color + '18', borderColor: color + '44' }]}>
            <Text style={[butterflyStyles.identityLabel, { color: color }]}>Ваша нова ідентичність</Text>
            <Text style={[butterflyStyles.identityText, { color: C.text }]}>
              «{identityText}»
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            butterflyStyles.doneBtn,
            { backgroundColor: color },
            pressed && { opacity: 0.85 },
          ]}
          onPress={onDone}
        >
          <Text style={butterflyStyles.doneBtnText}>Завершено</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const butterflyStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  content: {
    marginBottom: 6,
  },
  sparklesWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  stats: { width: '100%', alignItems: 'center' },
  title: {
    fontFamily: FontFamily.sansBold,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 5,
  },
  scoreCard: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: 5,
    marginBottom: 4,
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  scoreItem: { alignItems: 'center' },
  scoreLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    marginBottom: 4,
  },
  scoreNum: {
    fontFamily: FontFamily.sansBold,
    fontSize: 32,
  },
  arrow: {
    fontFamily: FontFamily.sansBold,
    fontSize: 24,
  },
  diffText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    marginTop: 2,
  },
  identityCard: {
    width: '100%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 4,
    marginBottom: 5,
  },
  identityLabel: {
    fontFamily: FontFamily.sansBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  identityText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
  },
  doneBtn: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  doneBtnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
    color: '#fff',
  },
});

// ─── Score Modal (Stage 6) ────────────────────────────────────────────────────

function ScoreModal({
  visible,
  color,
  onSubmit,
  loading,
}: {
  visible: boolean;
  color: string;
  onSubmit: (score: number) => void;
  loading: boolean;
}) {
  const C = useTheme();
  const [score, setScore] = useState<number | null>(null);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[modalStyles.backdrop, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
        <View style={[modalStyles.card, { backgroundColor: C.surface2 }]}>
          <Text style={[modalStyles.title, { color: C.text }]}>
            Оцініть вплив зараз
          </Text>
          <Text style={[modalStyles.body, { color: C.textSecondary }]}>
            Ви пройшли всі 6 етапів. Наскільки ця установка впливає на вас зараз?
          </Text>
          <ScoreSelector value={score} onChange={setScore} color={color} />
          <Pressable
            style={({ pressed }) => [
              modalStyles.submitBtn,
              { backgroundColor: color },
              (!score || loading) && { opacity: 0.5 },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => score && onSubmit(score)}
            disabled={!score || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={modalStyles.submitText}>Зберегти результат</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 6,
    paddingBottom: 8,
    gap: 4,
  },
  title: {
    fontFamily: FontFamily.sansBold,
    fontSize: 22,
  },
  body: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 2,
  },
  submitText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
    color: '#fff',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BeliefDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const C = useTheme();
  const { beliefs, fetchBeliefById, advanceStage, completeWithScore } = useBeliefs();
  const { addTask } = useTasks();

  const [ub, setUb] = useState<UserBelief | null>(null);
  const [loadingBelief, setLoadingBelief] = useState(false);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTaskBtn, setShowTaskBtn] = useState(false);
  const [taskReflection, setTaskReflection] = useState('');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreAfterSelected, setScoreAfterSelected] = useState<number | null>(null);
  const [showButterfly, setShowButterfly] = useState(false);

  useEffect(() => {
    const found = beliefs.find((b) => b.id === id);
    if (found) setUb(found);
  }, [beliefs, id]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      const found = beliefs.find((b) => b.id === id);
      if (found) {
        setUb(found);
      } else {
        setLoadingBelief(true);
        fetchBeliefById(id).then((data) => {
          if (data) setUb(data);
          setLoadingBelief(false);
        });
      }
    }, [id, beliefs, fetchBeliefById]),
  );

  if (loadingBelief || !ub) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
        <ActivityIndicator style={{ marginTop: 80 }} color={C.primary} />
      </SafeAreaView>
    );
  }

  const title = getBeliefTitle(ub);
  const catKey = getBeliefCategory(ub);
  const cat = catKey ? CATEGORY_MAP[catKey] : null;
  const completed = getCompletedStages(ub);
  const catColor = catKey
    ? (STAGE_COLORS as Record<string, string>)[catKey] ?? C.primary
    : C.primary;

  const identityText = ub.belief_id && ub.belief
    ? ub.belief.identity_template_uk
    : ub.custom_identity ?? null;

  const currentStage = STAGES.find((s) => s.index === ub.current_stage);

  const handleContinue = async () => {
    if (!currentStage || !reflection.trim()) return;
    setSaving(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await advanceStage(ub.id, currentStage.key, reflection.trim());

      if (currentStage.key === 'action') {
        setTaskReflection(reflection.trim());
        setShowTaskBtn(true);
        setReflection('');
      } else if (currentStage.key === 'identity') {
        setReflection('');
        setShowScoreModal(true);
      } else {
        setReflection('');
        setShowTaskBtn(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTask = async () => {
    await addTask(taskReflection, { beliefId: ub.id });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTaskBtn(false);
  };

  const handleScoreSubmit = async (score: number) => {
    setScoreSaving(true);
    setScoreAfterSelected(score);
    try {
      await completeWithScore(ub.id, score);
      setShowScoreModal(false);
      setShowButterfly(true);
    } finally {
      setScoreSaving(false);
    }
  };

  const handleButterflyDone = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      <ButterflyOverlay
        visible={showButterfly}
        scoreBefore={ub.score}
        scoreAfter={scoreAfterSelected ?? 1}
        identityText={identityText}
        onDone={handleButterflyDone}
      />

      <ScoreModal
        visible={showScoreModal}
        color={STAGE_COLORS.identity}
        onSubmit={handleScoreSubmit}
        loading={scoreSaving}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Back button */}
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Icon name="ChevronLeft" size={22} color={C.textSecondary} />
          </Pressable>

          {/* Header: Ring + category + title */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerRing}>
                <RingProgress
                  progress={completed}
                  color={C.primary}
                  size={68}
                  strokeWidth={4}
                  animated
                />
                <View style={styles.headerRingCenter}>
                  <Text style={[styles.headerRingText, { color: C.textSecondary }]}>{completed}/6</Text>
                </View>
              </View>
              <View style={styles.headerMeta}>
                {cat && (
                  <Text style={[styles.catLabel, { color: C.primary }]}>
                    {cat.nameUk.toUpperCase()}
                  </Text>
                )}
                <Text style={[styles.beliefTitle, { color: C.text }]} numberOfLines={4}>
                  "{title}"
                </Text>
              </View>
            </View>
          </View>

          {/* Stages */}
          <View style={styles.stages}>
            {STAGES.map((stage) => {
              const status = getStageStatus(stage, ub);
              const isCurrent = status === 'current';

              return (
                <StageRow
                  key={stage.key}
                  stage={stage}
                  status={status}
                  reflection={isCurrent ? reflection : ''}
                  onChangeReflection={setReflection}
                  saving={saving}
                  onContinue={handleContinue}
                  onCoach={() =>
                    router.push({
                      pathname: '/ai-coach',
                      params: { beliefId: ub.id, stageKey: stage.key },
                    })
                  }
                  onCreateTask={handleCreateTask}
                  showTaskBtn={isCurrent && stage.key === 'action' && showTaskBtn}
                />
              );
            })}
          </View>

          <View style={{ height: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  scroll: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base },

  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },

  header: { marginBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  headerRing: { position: 'relative', width: 68, height: 68, flexShrink: 0 },
  headerRingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRingText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
  },
  headerMeta: {
    flex: 1,
    paddingTop: 8,
  },

  catLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  beliefTitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 20,
    lineHeight: 28,
    fontStyle: 'italic',
  },

  stages: { gap: 0 },
});
