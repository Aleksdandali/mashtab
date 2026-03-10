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
import Svg, { Circle } from 'react-native-svg';
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
import { STAGES, STAGE_COLORS, StageKey, Stage } from '@/constants/stages';
import { Icon } from '@/components/ui/Icon';
import { CATEGORY_MAP } from '@/constants/categories';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { UserBelief } from '@/types';

// ─── Ring constants ───────────────────────────────────────────────────────────

const RING_SIZE = 200;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 80;
const RING_STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
                { color: active ? '#060810' : C.textSecondary },
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
  btnText: { fontFamily: FontFamily.sansBold, fontSize: 13 },
});

// ─── Stage Card ───────────────────────────────────────────────────────────────

interface StageCardProps {
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

function StageCard({
  stage,
  status,
  reflection,
  onChangeReflection,
  saving,
  onContinue,
  onCoach,
  onCreateTask,
  showTaskBtn,
}: StageCardProps) {
  const C = useTheme();
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const isLocked = status === 'locked';

  const iconBg = isCompleted
    ? C.primary
    : isCurrent
    ? C.primaryMuted
    : 'rgba(163,174,196,0.12)';
  const titleColor = isLocked ? 'rgba(163,174,196,0.4)' : C.text;
  const descColor = isLocked ? 'rgba(163,174,196,0.4)' : C.textSecondary;

  return (
    <View style={[cardStyles.card, { backgroundColor: C.surface1 }]}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.iconCircle, { backgroundColor: iconBg }]}>
          {isCompleted && (
            <Icon name="Check" size={20} strokeWidth={2} color="#060810" />
          )}
          {isCurrent && (
            <Text style={[cardStyles.iconNum, { color: C.primary }]}>
              {stage.index}
            </Text>
          )}
          {isLocked && (
            <Icon
              name="Lock"
              size={20}
              color="rgba(163,174,196,0.4)"
              strokeWidth={1.5}
            />
          )}
        </View>
        <View style={cardStyles.content}>
          <Text style={[cardStyles.cardTitle, { color: titleColor }]}>
            {stage.nameUk}
          </Text>
          <Text style={[cardStyles.cardDesc, { color: descColor }]}>
            {stage.descriptionUk}
          </Text>
        </View>
      </View>

      {isCurrent && (
        <>
          <Text style={[cardStyles.question, { color: C.textSecondary }]}>
            {stage.questionUk}
          </Text>

          <TextInput
            style={[
              cardStyles.textarea,
              { backgroundColor: C.surface2, color: C.text },
            ]}
            placeholder="Напишіть вашу відповідь..."
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={reflection}
            onChangeText={onChangeReflection}
          />

          <View style={cardStyles.btnRow}>
            <Pressable
              style={({ pressed }) => [
                cardStyles.coachBtn,
                { borderColor: C.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={onCoach}
            >
              <Icon
                name="MessageSquare"
                size={18}
                color={C.textSecondary}
                strokeWidth={1.5}
              />
              <Text style={[cardStyles.coachBtnText, { color: C.textSecondary }]}>
                Запитати коуча
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                cardStyles.continueBtn,
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
                  <Text style={cardStyles.continueBtnText}>
                    Продовжити шлях
                  </Text>
                  <Icon
                    name="ArrowRight"
                    size={18}
                    strokeWidth={1.5}
                    color="#060810"
                  />
                </>
              )}
            </Pressable>
          </View>

          {showTaskBtn && (
            <Pressable
              style={({ pressed }) => [
                cardStyles.taskBtn,
                { borderColor: C.primary, backgroundColor: C.primaryMuted },
                pressed && { opacity: 0.75 },
              ]}
              onPress={onCreateTask}
            >
              <Icon name="Plus" size={14} color={C.primary} />
              <Text style={[cardStyles.taskBtnText, { color: C.primary }]}>
                Створити задачу
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconNum: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
  },
  content: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  question: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 16,
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  taskBtnText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 14,
  },
});

// ─── Butterfly Overlay ────────────────────────────────────────────────────────

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
    <View style={[bfStyles.overlay, { backgroundColor: C.surface1 }]}>
      <Animated.View style={[bfStyles.content, { opacity, transform: [{ scale }] }]}>
        <View style={bfStyles.sparklesWrap}>
          <Icon name="Sparkles" size={64} color={STAGE_COLORS.identity} />
        </View>
      </Animated.View>

      <Animated.View style={[bfStyles.stats, { opacity: statsOpacity }]}>
        <Text style={[bfStyles.title, { color: C.text }]}>
          Трансформація завершена
        </Text>

        <View style={[bfStyles.scoreCard, { backgroundColor: C.surface2 }]}>
          <View style={bfStyles.scoreRow}>
            <View style={bfStyles.scoreItem}>
              <Text style={[bfStyles.scoreLabel, { color: C.textSecondary }]}>Було</Text>
              <Text style={[bfStyles.scoreNum, { color: C.textSecondary }]}>{scoreBefore}/10</Text>
            </View>
            <Text style={[bfStyles.arrow, { color }]}>→</Text>
            <View style={bfStyles.scoreItem}>
              <Text style={[bfStyles.scoreLabel, { color }]}>Стало</Text>
              <Text style={[bfStyles.scoreNum, { color }]}>{scoreAfter}/10</Text>
            </View>
          </View>
          {diff > 0 && (
            <Text style={[bfStyles.diffText, { color: C.textSecondary }]}>
              Ви звільнили {diff} пункт{diff === 1 ? '' : diff < 5 ? 'и' : 'ів'} потенціалу
            </Text>
          )}
        </View>

        {!!identityText && (
          <View
            style={[
              bfStyles.identityCard,
              { backgroundColor: color + '18', borderColor: color + '44' },
            ]}
          >
            <Text style={[bfStyles.identityLabel, { color }]}>
              Ваша нова ідентичність
            </Text>
            <Text style={[bfStyles.identityText, { color: C.text }]}>
              «{identityText}»
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            bfStyles.doneBtn,
            { backgroundColor: color },
            pressed && { opacity: 0.85 },
          ]}
          onPress={onDone}
        >
          <Text style={bfStyles.doneBtnText}>Завершено</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const bfStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: { marginBottom: 8 },
  sparklesWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  stats: { width: '100%', alignItems: 'center', gap: 12 },
  title: {
    fontFamily: FontFamily.sansBold,
    fontSize: 24,
    textAlign: 'center',
  },
  scoreCard: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
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
  },
  identityCard: {
    width: '100%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  identityLabel: {
    fontFamily: FontFamily.sansBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  identityText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
  },
  doneBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
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
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  card: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  title: { fontFamily: FontFamily.sansBold, fontSize: 22 },
  body: { fontFamily: FontFamily.sans, fontSize: 14, lineHeight: 20 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { fontFamily: FontFamily.sansBold, fontSize: 15, color: '#fff' },
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
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
        <ActivityIndicator style={{ marginTop: 80 }} color={C.primary} />
      </SafeAreaView>
    );
  }

  const title = getBeliefTitle(ub);
  const completed = getCompletedStages(ub);
  const progress = completed / 6;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const progressPercent = Math.round(progress * 100);

  const currentStage = STAGES.find((s) => s.index === ub.current_stage);
  const currentStageName = currentStage?.nameUk ?? 'Завершено';

  const identityText =
    ub.belief_id && ub.belief
      ? ub.belief.identity_template_uk
      : ub.custom_identity ?? null;

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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      <ButterflyOverlay
        visible={showButterfly}
        scoreBefore={ub.score}
        scoreAfter={scoreAfterSelected ?? 1}
        identityText={identityText}
        onDone={() => router.back()}
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

          {/* Centered ring */}
          <View style={styles.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS}
                stroke="rgba(163,174,196,0.12)"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS}
                stroke={C.primary}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING_CENTER}, ${RING_CENTER}`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.ringPercent, { color: C.text }]}>
                {progressPercent}%
              </Text>
              <Text style={[styles.ringLabel, { color: C.textSecondary }]}>
                ПРОГРЕС
              </Text>
            </View>
          </View>

          {/* Title + current stage */}
          <Text style={[styles.beliefTitle, { color: C.text }]} numberOfLines={4}>
            {title}
          </Text>
          <Text style={[styles.currentStageText, { color: C.textSecondary }]}>
            {completed < 6
              ? `Поточний етап: ${currentStageName} · ${completed}/6`
              : `Всі 6 етапів завершено`}
          </Text>

          {/* Stage cards */}
          <View style={styles.stagesList}>
            {STAGES.map((stage) => {
              const status = getStageStatus(stage, ub);
              const isCurrent = status === 'current';
              return (
                <StageCard
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

          <View style={{ height: 96 }} />
        </ScrollView>

        {/* Sticky CTA */}
        <View style={[styles.footer, { backgroundColor: C.bg, borderTopColor: C.border }]}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: C.primary },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.push('/ai-coach')}
          >
            <Text style={styles.ctaBtnText}>Записати інсайт</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  scroll: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.base,
  },

  backBtn: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },

  ringContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 48,
    letterSpacing: -1,
    lineHeight: 52,
  },
  ringLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },

  beliefTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 38,
  },
  currentStageText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },

  stagesList: {
    gap: 12,
  },

  footer: {
    paddingHorizontal: Spacing.screen,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    color: '#060810',
  },
});
