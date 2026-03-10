import { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Animated,
} from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { useBeliefs, getBeliefTitle, getBeliefCategory, getCompletedStages } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';
import { Icon } from '@/components/ui/Icon';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { CATEGORY_MAP } from '@/constants/categories';
import { getDayPeriod, getGreeting, formatDisplayDate, formatDayName, todayISO } from '@/utils/dates';
import type { Task, UserBelief } from '@/types';

// ─── Ring SVG ─────────────────────────────────────────────────────────────────

function RingSvg({ progress, size = 64 }: { progress: number; size?: number }) {
  const R = size / 2 - 5;
  const circumference = 2 * Math.PI * R;
  const offset = circumference - (progress / 6) * circumference;
  const cx = size / 2;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(163,174,196,0.08)" strokeWidth={4} />
      <Circle
        cx={cx} cy={cx} r={R} fill="none"
        stroke="#C8FF00" strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const C = useTheme();
  return (
    <Text style={[S.sectionLabel, { color: C.textSecondary }]}>{text}</Text>
  );
}

// ─── Ritual Card ──────────────────────────────────────────────────────────────

function RitualCard({
  period,
  done,
  streak,
}: {
  period: 'morning' | 'evening';
  done: boolean;
  streak: number;
}) {
  const C = useTheme();
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (done) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [done]);

  const isMorning = period === 'morning';
  const title = isMorning ? 'Ранковий ритуал' : 'Вечірній ритуал';
  const subtitle = isMorning ? 'Намір · Вдячність · Фокус' : 'Перемоги · Інсайти · Завтра';
  const route = isMorning ? '/ritual/morning' : '/ritual/evening';

  if (done) {
    return (
      <View style={[S.ritualCard, { backgroundColor: C.surface2 }]}>
        <View style={S.ritualInner}>
          <Icon name="CheckCircle2" size={18} color={C.success} />
          <Text style={[S.ritualDoneText, { color: C.textSecondary }]}>
            {isMorning ? 'Ранковий ритуал завершено' : 'Вечірній ритуал завершено'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(route as any)}
      style={({ pressed }) => [
        S.ritualCard,
        { backgroundColor: C.surface2 },
        pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={S.ritualInner}>
        <View style={S.ritualTextCol}>
          <Text style={[S.ritualTitle, { color: C.text }]}>{title}</Text>
          <Text style={[S.ritualSubtitle, { color: C.textSecondary }]}>{subtitle}</Text>
        </View>
        {streak > 0 && (
          <View style={[S.streakBadge, { backgroundColor: C.surface3 }]}>
            <Icon name="Flame" size={14} color={C.primary} />
            <Text style={[S.streakText, { color: C.textSecondary }]}>{streak} днів</Text>
          </View>
        )}
      </View>
      <Pressable
        onPress={() => router.push(route as any)}
        style={[S.ritualBtn, { backgroundColor: C.primary }]}
      >
        <Text style={S.ritualBtnText}>Почати</Text>
        <Text style={[S.ritualBtnSub, { color: 'rgba(5,6,8,0.55)' }]}>3 хв</Text>
      </Pressable>
    </Pressable>
  );
}

// ─── Belief card (home) ───────────────────────────────────────────────────────

function BeliefHomeCard({ belief }: { belief: UserBelief }) {
  const C = useTheme();
  const completed = getCompletedStages(belief);
  const title = getBeliefTitle(belief);
  const conviction = (belief as any).score ?? 5;
  const convictionPct = Math.round((conviction / 10) * 100);

  return (
    <Pressable
      onPress={() => router.push(`/belief/${belief.id}` as any)}
      style={({ pressed }) => [
        S.beliefCard,
        { backgroundColor: C.surface2 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={S.beliefTop}>
        <View style={S.beliefRingWrap}>
          <RingSvg progress={completed} size={64} />
          <View style={S.beliefRingCenter}>
            <Text style={[S.beliefRingText, { color: C.textSecondary }]}>{completed}/6</Text>
          </View>
        </View>

        <View style={{ flex: 1, paddingTop: 8 }}>
          <Text style={[S.beliefQuote, { color: C.text }]} numberOfLines={3}>
            "{title}"
          </Text>
        </View>
      </View>

      <View style={S.beliefBar}>
        <View style={S.beliefBarLabels}>
          <Text style={[S.beliefBarLabel, { color: C.textSecondary }]}>−100</Text>
          <Text style={[S.beliefBarCenter, { color: C.primary }]}>
            +{convictionPct}
          </Text>
          <Text style={[S.beliefBarLabel, { color: C.textSecondary }]}>+100</Text>
        </View>
        <View style={[S.beliefBarTrack, { backgroundColor: C.surface3 }]}>
          <View
            style={[
              S.beliefBarFill,
              { backgroundColor: C.primary, width: `${convictionPct}%` as `${number}%` },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}

// ─── Task row (checkbox) ─────────────────────────────────────────────────────

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const C = useTheme();
  const checkAnim = useRef(new Animated.Value(task.is_completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(checkAnim, { toValue: task.is_completed ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [task.is_completed]);

  const checkBg = checkAnim.interpolate({ inputRange: [0, 1], outputRange: [C.surface3, C.primary] });

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(task.id);
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
      <View style={S.moneyTaskRow}>
        <Animated.View
          style={[S.checkbox, { backgroundColor: checkBg, borderColor: task.is_completed ? C.primary : C.borderMedium }]}
        >
          {task.is_completed && <Icon name="Check" size={11} color="#060810" strokeWidth={2.5} />}
        </Animated.View>
        <Text
          style={[
            S.moneyTaskText,
            { color: task.is_completed ? C.textTertiary : C.text },
            task.is_completed && { textDecorationLine: 'line-through', opacity: 0.55 },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const C = useTheme();

  const { profile, streak, fetchProfile, fetchStreak } = useProfile();
  const { beliefs, fetchBeliefs } = useBeliefs();
  const { tasks, fetchTasks, toggleTask, focusTasks, regularTasks } = useTasks();
  const { todayMorningDone, todayEveningDone, fetchTodayRituals } = useJournal();

  const period = getDayPeriod();
  const greeting = getGreeting(profile?.name ?? null, period);
  const displayDate = formatDisplayDate();
  const dayName = formatDayName();

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchStreak();
      fetchBeliefs();
      fetchTasks(todayISO());
      fetchTodayRituals();
    }, []),
  );

  const activeFocus = focusTasks();
  const allTasks = [...activeFocus, ...regularTasks()];
  const completedThisWeek = allTasks.filter((t) => t.is_completed).length;
  const firstFocusTask = activeFocus[0] ?? regularTasks()[0] ?? null;
  const visibleBelief = beliefs[0] ?? null;

  const focusCategory = visibleBelief ? getBeliefCategory(visibleBelief) : null;
  const focusCatLabel = focusCategory ? CATEGORY_MAP[focusCategory]?.nameUk ?? '' : '';

  return (
    <View style={[S.root, { backgroundColor: C.bg }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={S.header}>
            <Text style={[S.greeting, { color: C.text }]}>{greeting}</Text>
            <View style={S.dateRow}>
              <Text style={[S.dateText, { color: C.textSecondary }]}>
                {dayName}, {displayDate}
              </Text>
              {focusCatLabel !== '' && (
                <View style={[S.focusChip, { backgroundColor: C.primaryMuted }]}>
                  <Text style={[S.focusChipText, { color: C.primary }]}>
                    Фокус тижня: {focusCatLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Ritual card ── */}
          {(period === 'morning' || period === 'evening') && (
            <RitualCard
              period={period}
              done={period === 'morning' ? todayMorningDone : todayEveningDone}
              streak={streak}
            />
          )}

          {/* ── Belief in work ── */}
          {visibleBelief && (
            <View style={S.section}>
              <SectionLabel text="Установка в роботі" />
              <BeliefHomeCard belief={visibleBelief} />
            </View>
          )}

          {/* ── Money today ── */}
          {firstFocusTask && (
            <View style={S.section}>
              <SectionLabel text="Гроші сьогодні" />
              <View style={[S.moneyCard, { backgroundColor: C.surface2 }]}>
                <TaskRow task={firstFocusTask} onToggle={toggleTask} />
                <View style={S.moneyWeekRow}>
                  <Text style={[S.moneyWeekLabel, { color: C.textSecondary }]}>Цього тижня:</Text>
                  <Text style={[S.moneyWeekValue, { color: C.primary }]}>{completedThisWeek}/7</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Coach chip ── */}
          <Pressable
            onPress={() => router.push('/ai-coach' as any)}
            style={({ pressed }) => [
              S.coachChip,
              { borderColor: C.border },
              pressed && { borderColor: 'rgba(200,255,0,0.3)' },
            ]}
          >
            <Text style={[S.coachChipText, { color: C.textSecondary }]}>Запитати коуча</Text>
            <Icon name="ChevronRight" size={20} color={C.textSecondary} />
          </Pressable>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base, paddingBottom: 32 },

  // Header
  header: { paddingTop: 8, marginBottom: 32 },
  greeting: { fontFamily: FontFamily.sansBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3, marginBottom: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateText: { fontFamily: FontFamily.sans, fontSize: 14 },
  focusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  focusChipText: { fontFamily: FontFamily.sansMedium, fontSize: 13 },

  // Ritual card
  ritualCard: { borderRadius: 16, overflow: 'hidden', padding: 24, marginBottom: 24 },
  ritualInner: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  ritualTextCol: { flex: 1 },
  ritualTitle: { fontFamily: FontFamily.sansBold, fontSize: 20, lineHeight: 26, marginBottom: 4 },
  ritualSubtitle: { fontFamily: FontFamily.sans, fontSize: 14 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  streakText: { fontFamily: FontFamily.sansMedium, fontSize: 14 },
  ritualDoneText: { fontFamily: FontFamily.sansMedium, fontSize: 14 },
  ritualBtn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  ritualBtnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: '#060810' },
  ritualBtnSub: { fontFamily: FontFamily.sans, fontSize: 14 },

  // Section
  section: { marginBottom: 24 },
  sectionLabel: { fontFamily: FontFamily.sansSemiBold, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 16 },

  // Belief card
  beliefCard: { borderRadius: 16, padding: 24 },
  beliefTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
  beliefRingWrap: { position: 'relative', width: 64, height: 64, flexShrink: 0 },
  beliefRingCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  beliefRingText: { fontFamily: FontFamily.sansMedium, fontSize: 12 },
  beliefQuote: { fontFamily: FontFamily.sansMedium, fontSize: 18, lineHeight: 24 },
  beliefBar: { gap: 8 },
  beliefBarLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  beliefBarLabel: { fontFamily: FontFamily.sansMedium, fontSize: 12 },
  beliefBarCenter: { fontFamily: FontFamily.sansSemiBold, fontSize: 12 },
  beliefBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  beliefBarFill: { height: '100%', borderRadius: 3 },

  // Money today
  moneyCard: { borderRadius: 16, padding: 24 },
  moneyTaskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  moneyTaskText: { fontFamily: FontFamily.sansMedium, fontSize: 15, lineHeight: 22, flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  moneyWeekRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moneyWeekLabel: { fontFamily: FontFamily.sans, fontSize: 14 },
  moneyWeekValue: { fontFamily: FontFamily.sansSemiBold, fontSize: 14 },

  // Coach chip
  coachChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderWidth: 1, borderRadius: 12 },
  coachChipText: { fontFamily: FontFamily.sans, fontSize: 15 },
});
