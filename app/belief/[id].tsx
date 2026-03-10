import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Check, Lock, ChevronLeft, MessageSquare, ArrowRight, Plus, Sparkles } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useBeliefs, getBeliefTitle, getCompletedStages } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { STAGES, STAGE_COLORS, StageKey } from '@/constants/stages';
import { UserBelief } from '@/types';

const RING_SIZE = 200;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 80;
const RING_STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Score Selector ───────────────────────────────────────────────────────────

function ScoreSelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={SC.row}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[SC.btn, { backgroundColor: active ? '#C8FF00' : '#1A1F2E' }]}
          >
            <Text style={[SC.btnText, { color: active ? '#060810' : '#A3AEC4' }]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SC = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});

// ─── Score Modal ──────────────────────────────────────────────────────────────

function ScoreModal({
  visible,
  onSubmit,
  loading,
}: {
  visible: boolean;
  onSubmit: (score: number) => void;
  loading: boolean;
}) {
  const [score, setScore] = useState<number | null>(null);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={MM.backdrop}>
        <View style={MM.card}>
          <Text style={MM.title}>Оцініть вплив зараз</Text>
          <Text style={MM.body}>
            Ви пройшли всі 6 етапів. Наскільки ця установка впливає на вас зараз?
          </Text>
          <ScoreSelector value={score} onChange={setScore} />
          <Pressable
            style={[MM.submitBtn, (!score || loading) && { opacity: 0.5 }]}
            onPress={() => score && onSubmit(score)}
            disabled={!score || loading}
          >
            {loading ? (
              <ActivityIndicator color="#060810" size="small" />
            ) : (
              <Text style={MM.submitText}>Зберегти результат</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const MM = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' },
  card: {
    backgroundColor: '#111622',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#F9FAFF' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: '#A3AEC4' },
  submitBtn: {
    backgroundColor: '#C8FF00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#060810' },
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
  }, [visible]);

  if (!visible) return null;

  const diff = scoreBefore - scoreAfter;
  const color = STAGE_COLORS.identity;

  return (
    <View style={BF.overlay}>
      <Animated.View style={{ opacity, transform: [{ scale }], marginBottom: 8 }}>
        <Sparkles color={color} size={64} strokeWidth={1.5} />
      </Animated.View>

      <Animated.View style={[BF.stats, { opacity: statsOpacity }]}>
        <Text style={BF.title}>Трансформація завершена</Text>

        <View style={BF.scoreCard}>
          <View style={BF.scoreRow}>
            <View style={BF.scoreItem}>
              <Text style={BF.scoreLabel}>Було</Text>
              <Text style={[BF.scoreNum, { color: '#A3AEC4' }]}>{scoreBefore}/10</Text>
            </View>
            <Text style={[BF.arrow, { color }]}>→</Text>
            <View style={BF.scoreItem}>
              <Text style={[BF.scoreLabel, { color }]}>Стало</Text>
              <Text style={[BF.scoreNum, { color }]}>{scoreAfter}/10</Text>
            </View>
          </View>
          {diff > 0 && (
            <Text style={BF.diffText}>
              Ви звільнили {diff} пункт{diff === 1 ? '' : diff < 5 ? 'и' : 'ів'} потенціалу
            </Text>
          )}
        </View>

        {!!identityText && (
          <View style={[BF.identityCard, { borderColor: color + '44', backgroundColor: color + '18' }]}>
            <Text style={[BF.identityLabel, { color }]}>Ваша нова ідентичність</Text>
            <Text style={BF.identityText}>«{identityText}»</Text>
          </View>
        )}

        <Pressable style={[BF.doneBtn, { backgroundColor: color }]} onPress={onDone}>
          <Text style={BF.doneBtnText}>Завершено</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const BF = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#0B0F18',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stats: { width: '100%', alignItems: 'center', gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#F9FAFF', textAlign: 'center' },
  scoreCard: {
    width: '100%',
    backgroundColor: '#111622',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  scoreItem: { alignItems: 'center' },
  scoreLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#A3AEC4', marginBottom: 4 },
  scoreNum: { fontFamily: 'Inter_700Bold', fontSize: 32 },
  arrow: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  diffText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A3AEC4' },
  identityCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16 },
  identityLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  identityText: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 24, color: '#F9FAFF' },
  doneBtn: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  doneBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BeliefDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
      <SafeAreaView style={S.container}>
        <ActivityIndicator style={{ marginTop: 80 }} color="#C8FF00" />
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
    ub.belief_id && ub.belief ? ub.belief.identity_template_uk : ub.custom_identity ?? null;

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
    <SafeAreaView style={S.container}>
      <ButterflyOverlay
        visible={showButterfly}
        scoreBefore={ub.score}
        scoreAfter={scoreAfterSelected ?? 1}
        identityText={identityText}
        onDone={() => router.back()}
      />
      <ScoreModal
        visible={showScoreModal}
        onSubmit={handleScoreSubmit}
        loading={scoreSaving}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
          <Pressable style={S.backBtn} onPress={() => router.back()}>
            <ChevronLeft color="#A3AEC4" size={22} strokeWidth={1.5} />
          </Pressable>

          {/* Progress Ring */}
          <View style={S.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS}
                stroke="rgba(163, 174, 196, 0.12)"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS}
                stroke="#C8FF00"
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING_CENTER}, ${RING_CENTER}`}
              />
            </Svg>
            <View style={S.ringCenter}>
              <Text style={S.ringPercent}>{progressPercent}%</Text>
              <Text style={S.ringLabel}>ПРОГРЕС</Text>
            </View>
          </View>

          <Text style={S.beliefTitle}>{title}</Text>
          <Text style={S.currentStage}>
            {completed < 6
              ? `Етап ${ub.current_stage} з 6 • ${currentStageName}`
              : 'Всі 6 етапів завершено'}
          </Text>

          <View style={S.stagesContainer}>
            {STAGES.map((stage) => {
              const isCompleted = !!ub.completed_stages?.[stage.key];
              const isCurrent = !isCompleted && stage.index === ub.current_stage;
              const isLocked = !isCompleted && !isCurrent;

              return (
                <View key={stage.key} style={S.stageCard}>
                  <View style={S.stageHeader}>
                    <View
                      style={[
                        S.stageIcon,
                        isCompleted && S.stageIconCompleted,
                        isLocked && S.stageIconLocked,
                      ]}
                    >
                      {isCompleted ? (
                        <Check color="#060810" size={20} strokeWidth={2} />
                      ) : isLocked ? (
                        <Lock color="rgba(163, 174, 196, 0.4)" size={20} strokeWidth={1.5} />
                      ) : (
                        <Text style={S.stageNumber}>{stage.index}</Text>
                      )}
                    </View>
                    <View style={S.stageContent}>
                      <Text style={[S.stageTitle, isLocked && S.stageTitleLocked]}>
                        {stage.nameUk}
                      </Text>
                      <Text style={[S.stageDescription, isLocked && S.stageDescriptionLocked]}>
                        {stage.descriptionUk}
                      </Text>
                    </View>
                  </View>

                  {isCurrent && (
                    <>
                      <Text style={S.stageQuestion}>{stage.questionUk}</Text>
                      <View style={S.inputContainer}>
                        <TextInput
                          style={S.input}
                          placeholder="Напишіть вашу відповідь..."
                          placeholderTextColor="rgba(163, 174, 196, 0.4)"
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          value={reflection}
                          onChangeText={setReflection}
                        />
                      </View>
                      <View style={S.btnRow}>
                        <Pressable
                          style={S.coachBtn}
                          onPress={() =>
                            router.push({
                              pathname: '/ai-coach',
                              params: { beliefId: ub.id, stageKey: stage.key },
                            })
                          }
                        >
                          <MessageSquare color="#A3AEC4" size={18} strokeWidth={1.5} />
                          <Text style={S.coachBtnText}>Запитати коуча</Text>
                        </Pressable>
                        <Pressable
                          style={[
                            S.continueBtn,
                            (!reflection.trim() || saving) && { opacity: 0.5 },
                          ]}
                          onPress={handleContinue}
                          disabled={!reflection.trim() || saving}
                        >
                          {saving ? (
                            <ActivityIndicator color="#060810" size="small" />
                          ) : (
                            <>
                              <Text style={S.continueBtnText}>Продовжити шлях</Text>
                              <ArrowRight color="#060810" size={18} strokeWidth={1.5} />
                            </>
                          )}
                        </Pressable>
                      </View>
                      {stage.key === 'action' && showTaskBtn && (
                        <Pressable style={S.taskBtn} onPress={handleCreateTask}>
                          <Plus color="#C8FF00" size={14} strokeWidth={2} />
                          <Text style={S.taskBtnText}>Створити задачу</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>

          <Pressable style={S.ctaButton} onPress={() => router.push('/ai-coach')}>
            <Text style={S.ctaButtonText}>Записати інсайт</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060810',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 48,
    letterSpacing: -1,
    color: '#F9FAFF',
  },
  ringLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#A3AEC4',
    marginTop: 4,
  },
  beliefTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.5,
    color: '#F9FAFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentStage: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#A3AEC4',
    textAlign: 'center',
    marginBottom: 32,
  },
  stagesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  stageCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 20,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stageIconCompleted: {
    backgroundColor: '#C8FF00',
  },
  stageIconLocked: {
    backgroundColor: 'rgba(163, 174, 196, 0.12)',
  },
  stageNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#C8FF00',
  },
  stageContent: {
    flex: 1,
  },
  stageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#F9FAFF',
    marginBottom: 4,
  },
  stageTitleLocked: {
    color: 'rgba(163, 174, 196, 0.4)',
  },
  stageDescription: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
  },
  stageDescriptionLocked: {
    color: 'rgba(163, 174, 196, 0.4)',
  },
  stageQuestion: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#A3AEC4',
    marginTop: 16,
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: '#060810',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#F9FAFF',
    minHeight: 80,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(163, 174, 196, 0.12)',
  },
  coachBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A3AEC4',
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#C8FF00',
    minHeight: 46,
  },
  continueBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#060810',
  },
  taskBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8FF00',
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
  },
  taskBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#C8FF00',
  },
  ctaButton: {
    backgroundColor: '#C8FF00',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#060810',
  },
});
