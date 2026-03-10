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
import { Spacing, Radius, Shadow } from '@/constants/spacing';
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
  stageContent: string | null;
  color: string;
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
  stageContent,
  color,
  reflection,
  onChangeReflection,
  saving,
  onContinue,
  onCoach,
  onCreateTask,
  showTaskBtn,
}: StageRowProps) {
  const C = useTheme();
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'current') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2200, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, glowAnim]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  if (status === 'completed') {
    return (
      <View style={[stageStyles.completedRow, { borderLeftColor: color }]}>
        <View style={[stageStyles.iconBadge, { backgroundColor: color + '28' }]}>
          <Icon name={stage.icon} size={16} color={color} />
        </View>
        <Text style={[stageStyles.completedName, { color: color }]}>
          {stage.nameUk}
        </Text>
        <View style={[stageStyles.checkBadge, { backgroundColor: color }]}>
          <Icon name="Check" size={11} color="#050608" strokeWidth={2.5} />
        </View>
      </View>
    );
  }

  if (status === 'locked') {
    return (
      <View style={[stageStyles.lockedRow, { opacity: 0.28 }]}>
        <View style={[stageStyles.iconBadge, { backgroundColor: C.surface3 }]}>
          <Icon name={stage.icon} size={16} color={C.textTertiary} />
        </View>
        <Text style={[stageStyles.lockedName, { color: C.textSecondary }]}>
          {stage.nameUk}
        </Text>
        <Icon name="Lock" size={14} color={C.textTertiary} />
      </View>
    );
  }

  // Current — expanded
  return (
    <View style={[stageStyles.currentCard, { backgroundColor: C.surface2 }]}>
      {/* Glow */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: Radius.lg, backgroundColor: color, opacity: glowOpacity },
        ]}
        pointerEvents="none"
      />

      {/* Stage header */}
      <View style={stageStyles.currentHeader}>
        <View style={[stageStyles.iconBadgeLarge, { backgroundColor: color + '28' }]}>
          <Icon name={stage.icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[stageStyles.currentName, { color: color }]}>
            {stage.nameUk}
          </Text>
          <Text style={[stageStyles.currentDesc, { color: C.textSecondary }]}>
            {stage.descriptionUk}
          </Text>
        </View>
        <View style={[stageStyles.currentBadge, { backgroundColor: color + '28' }]}>
          <Text style={[stageStyles.currentBadgeText, { color: color }]}>
            Зараз
          </Text>
        </View>
      </View>

      {/* Stage content from belief */}
      {!!stageContent && (
        <View style={[stageStyles.contentBlock, { backgroundColor: C.surface3 }]}>
          <Text style={[stageStyles.contentLabel, { color: C.textTertiary }]}>
            Контекст
          </Text>
          <Text style={[stageStyles.contentText, { color: C.textSecondary }]}>
            {stageContent}
          </Text>
        </View>
      )}

      {/* Question */}
      <View style={stageStyles.questionWrap}>
        <Text style={[stageStyles.questionText, { color: C.text }]}>
          {stage.questionUk}
        </Text>
      </View>

      {/* Textarea */}
      <TextInput
        style={[
          stageStyles.textarea,
          {
            backgroundColor: C.surface3,
            color: C.text,
            borderColor: C.border,
          },
        ]}
        placeholder="Ваша рефлексія..."
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="MessageCircle" size={14} color={C.textSecondary} />
            <Text style={[stageStyles.coachBtnText, { color: C.textSecondary }]}>Запитати коуча</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            stageStyles.continueBtn,
            { backgroundColor: color },
            (!reflection.trim() || saving) && { opacity: 0.5 },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          onPress={onContinue}
          disabled={!reflection.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={stageStyles.continueBtnText}>Продовжити шлях</Text>
          )}
        </Pressable>
      </View>

      {/* Stage 5 special: create task button */}
      {showTaskBtn && (
        <Pressable
          style={({ pressed }) => [
            stageStyles.taskBtn,
            { borderColor: color, backgroundColor: color + '14' },
            pressed && { opacity: 0.75 },
          ]}
          onPress={onCreateTask}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="Plus" size={14} color={color} />
            <Text style={[stageStyles.taskBtnText, { color: color }]}>Створити задачу</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const stageStyles = StyleSheet.create({
  // Completed
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginBottom: 2,
    borderLeftWidth: 3,
    gap: 3,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 16, height: 16 },
  completedName: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Locked
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginBottom: 2,
    gap: 3,
  },
  lockedName: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
  },
  lockIcon: { width: 14, height: 14 },

  // Current
  currentCard: {
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: 2,
    overflow: 'hidden',
    ...Shadow.md,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
    marginBottom: 3,
  },
  iconBadgeLarge: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLarge: { width: 20, height: 20 },
  currentName: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  currentDesc: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  currentBadgeText: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  contentBlock: {
    borderRadius: Radius.sm,
    padding: 3,
    marginBottom: 3,
  },
  contentLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contentText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  questionWrap: { marginBottom: 3 },
  questionText: {
    fontFamily: FontFamily.serif,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  textarea: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: 3,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
    marginBottom: 3,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  coachBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  coachBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
  },
  continueBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  continueBtnText: {
    color: '#fff',
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  taskBtn: {
    marginTop: 3,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  taskBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
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
    fontFamily: FontFamily.serif,
    fontSize: 24,
    fontWeight: '700',
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
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  scoreNum: {
    fontFamily: FontFamily.serif,
    fontSize: 32,
    fontWeight: '700',
  },
  arrow: {
    fontFamily: FontFamily.sans,
    fontSize: 24,
    fontWeight: '700',
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
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  identityText: {
    fontFamily: FontFamily.serif,
    fontSize: 17,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  doneBtn: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  doneBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 16,
    fontWeight: '700',
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
    fontFamily: FontFamily.serif,
    fontSize: 22,
    fontWeight: '700',
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
    fontFamily: FontFamily.sans,
    fontSize: 15,
    fontWeight: '700',
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
  // Stage 5: show create-task button after advancing
  const [showTaskBtn, setShowTaskBtn] = useState(false);
  const [taskReflection, setTaskReflection] = useState('');
  // Stage 6: score modal + butterfly
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreAfterSelected, setScoreAfterSelected] = useState<number | null>(null);
  const [showButterfly, setShowButterfly] = useState(false);

  // Keep ub in sync with store
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
      {/* Butterfly overlay */}
      <ButterflyOverlay
        visible={showButterfly}
        scoreBefore={ub.score}
        scoreAfter={scoreAfterSelected ?? 1}
        identityText={identityText}
        onDone={handleButterflyDone}
      />

      {/* Score modal for stage 6 */}
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
            <Text style={[styles.backText, { color: C.textSecondary }]}>← Назад</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <RingProgress
              progress={completed}
              color={catColor}
              size={68}
              strokeWidth={5}
              animated
            />
            {cat && (
              <View style={[styles.catBadge, { backgroundColor: catColor + '20' }]}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catName, { color: catColor }]}>{cat.nameUk}</Text>
              </View>
            )}
            <Text style={[styles.beliefTitle, { color: C.text }]}>
              «{title}»
            </Text>
            {ub.belief_id && ub.belief && (
              <Text style={[styles.conviction, { color: C.textSecondary }]}>
                {ub.belief.conviction_uk}
              </Text>
            )}
            {/* Progress pill */}
            <View style={[styles.progressPill, { backgroundColor: C.surface3 }]}>
              <Text style={[styles.progressText, { color: catColor }]}>
                Вплив {ub.score}/10 · {completed}/6 етапів
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: C.border }]} />

          {/* Stages */}
          <View style={styles.stages}>
            {STAGES.map((stage) => {
              const status = getStageStatus(stage, ub);
              const stageContent = getStageContent(ub, stage.key);
              const stageColor = STAGE_COLORS[stage.key];
              const isCurrent = status === 'current';

              return (
                <StageRow
                  key={stage.key}
                  stage={stage}
                  status={status}
                  stageContent={stageContent}
                  color={stageColor}
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

  scroll: { paddingHorizontal: 5, paddingTop: 4 },

  backBtn: { marginBottom: 4 },
  backText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
  },

  header: { alignItems: 'center', paddingBottom: 5 },

  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
    marginTop: 3,
    marginBottom: 2,
  },
  catIcon: { fontSize: 14 },
  catName: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  beliefTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  conviction: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 3,
  },
  progressPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  progressText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
  },

  divider: { height: 1, marginBottom: 5 },

  stages: {},
});
