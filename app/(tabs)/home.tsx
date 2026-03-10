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
  const category = getBeliefCategory(belief);
  const cat = category ? CATEGORY_MAP[category] : null;
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
        {/* Ring */}
        <View style={S.beliefRingWrap}>
          <RingSvg progress={completed} size={64} />
          <View style={S.beliefRingCenter}>
            <Text style={[S.beliefRingText, { color: C.textSecondary }]}>{completed}/6</Text>
          </View>
        </View>

        {/* Quote */}
        <View style={{ flex: 1, paddingTop: 6 }}>
          <Text style={[S.beliefQuote, { color: C.text }]} numberOfLines={3}>
            "{title}"
          </Text>
        </View>
      </View>

      {/* Conviction progress bar */}
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

      {cat && (
        <View style={S.beliefCatRow}>
          <Icon name={cat.icon} size={11} color={C.primary} />
          <Text style={[S.beliefCatText, { color: C.primary }]}>{cat.nameUk.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

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
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        S.taskRow,
        { backgroundColor: C.surface2 },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Animated.View
        style={[S.checkbox, { backgroundColor: checkBg, borderColor: task.is_completed ? C.primary : C.borderMedium }]}
      >
        {task.is_completed && <Icon name="Check" size={11} color="#060810" strokeWidth={2.5} />}
      </Animated.View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            S.taskText,
            { color: task.is_completed ? C.textTertiary : C.text },
            task.is_completed && { textDecorationLine: 'line-through' },
          ]}
          numberOfLines={2}
        >
          {task.is_focus && <Text style={{ color: C.primary }}>★ </Text>}
          {task.title}
        </Text>
        {!!task.user_belief_id && (
          <View style={S.taskBeliefBadge}>
            <Icon name="Brain" size={10} color={C.primary} />
            <Text style={[S.taskBeliefText, { color: C.primary }]}>Пов'язана установка</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Quick stats ──────────────────────────────────────────────────────────────

function QuickStats({
  beliefsProgress,
  streak,
  focusDone,
  focusTotal,
}: {
  beliefsProgress: number;
  streak: number;
  focusDone: number;
  focusTotal: number;
}) {
  const C = useTheme();
  const stats = [
    { label: 'Установки', value: `${beliefsProgress}%`, icon: 'Brain' as const },
    { label: 'Ритуалів', value: `${streak}`, icon: 'Flame' as const },
    { label: 'Фокус', value: `${focusDone}/${focusTotal}`, icon: 'Target' as const },
  ];
  return (
    <View style={[S.statsRow, { backgroundColor: C.surface2, borderRadius: Radius.lg }]}>
      {stats.map((s, i) => (
        <View
          key={s.label}
          style={[S.statItem, i < 2 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: C.border }]}
        >
          <Icon name={s.icon} size={16} color={C.primary} />
          <Text style={[S.statValue, { color: C.text }]}>{s.value}</Text>
          <Text style={[S.statLabel, { color: C.textTertiary }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────────

function FABButton() {
  const C = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[S.fabWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => router.push('/ai-coach' as any)}
        onPressIn={() => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()}
        style={[S.fab, { backgroundColor: C.primary }]}
      >
        <Icon name="MessageCircle" size={24} color="#060810" />
      </Pressable>
    </Animated.View>
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

  const today = new Date();
  const isWeeklyDay = profile ? today.getDay() === profile.weekly_checkin_day : today.getDay() === 0;

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
  const focusDone = activeFocus.filter((t) => t.is_completed).length;
  const focusTotal = activeFocus.length;
  const allRegular = regularTasks();
  const visibleBeliefs = beliefs.slice(0, 2);

  const beliefsProgress =
    beliefs.length > 0
      ? Math.round((beliefs.reduce((sum, b) => sum + getCompletedStages(b), 0) / (beliefs.length * 6)) * 100)
      : 0;

  return (
    <View style={[S.root, { backgroundColor: C.bg }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={S.header}>
            <View style={{ flex: 1 }}>
              <Text style={[S.greeting, { color: C.text }]}>{greeting}</Text>
              <View style={S.dateRow}>
                <Text style={[S.dateText, { color: C.textSecondary }]}>
                  {dayName}, {displayDate}
                </Text>
                {beliefs.length > 0 && (
                  <View style={[S.focusChip, { backgroundColor: C.primaryMuted }]}>
                    <Text style={[S.focusChipText, { color: C.primary }]}>Фокус тижня</Text>
                  </View>
                )}
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/profile' as any)}
              style={[S.avatar, { backgroundColor: C.primaryMuted }]}
            >
              <Text style={[S.avatarText, { color: C.primary }]}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </Pressable>
          </View>

          {/* ── Weekly check-in (Sunday) ── */}
          {isWeeklyDay && (
            <Pressable
              onPress={() => router.push('/ritual/weekly' as any)}
              style={({ pressed }) => [S.weeklyCard, { backgroundColor: C.surface2 }, pressed && { opacity: 0.85 }]}
            >
              <Icon name="BarChart2" size={20} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[S.weeklyTitle, { color: C.text }]}>Тижневий підсумок</Text>
                <Text style={[S.weeklySub, { color: C.textTertiary }]}>Підбийте підсумки тижня</Text>
              </View>
              <Icon name="ChevronRight" size={18} color={C.textTertiary} />
            </Pressable>
          )}

          {/* ── Ritual card ── */}
          {(period === 'morning' || period === 'evening') && (
            <RitualCard
              period={period}
              done={period === 'morning' ? todayMorningDone : todayEveningDone}
              streak={streak}
            />
          )}

          {/* ── Active beliefs ── */}
          {visibleBeliefs.length > 0 && (
            <View style={S.section}>
              <SectionLabel text="Установка в роботі" />
              {visibleBeliefs.map((b) => (
                <BeliefHomeCard key={b.id} belief={b} />
              ))}
            </View>
          )}

          {/* ── Focus tasks ── */}
          {activeFocus.length > 0 && (
            <View style={S.section}>
              <SectionLabel text="Фокус на сьогодні" />
              <View style={S.tasksList}>
                {activeFocus.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                ))}
              </View>
            </View>
          )}

          {/* ── Regular tasks ── */}
          {allRegular.length > 0 && (
            <View style={S.section}>
              <SectionLabel text="Задачі" />
              <View style={S.tasksList}>
                {allRegular.slice(0, 4).map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                ))}
                {allRegular.length > 4 && (
                  <Pressable
                    onPress={() => router.push('/(tabs)/plans' as any)}
                    style={S.showMore}
                  >
                    <Text style={[S.showMoreText, { color: C.primary }]}>
                      Ще {allRegular.length - 4} задач
                    </Text>
                    <Icon name="ChevronRight" size={16} color={C.primary} />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* ── Stats ── */}
          <QuickStats
            beliefsProgress={beliefsProgress}
            streak={streak}
            focusDone={focusDone}
            focusTotal={Math.max(focusTotal, 1)}
          />

          {/* ── Coach chip ── */}
          <Pressable
            onPress={() => router.push('/ai-coach' as any)}
            style={({ pressed }) => [
              S.coachChip,
              { borderColor: C.border },
              pressed && { borderColor: 'rgba(200,230,74,0.3)' },
            ]}
          >
            <Text style={[S.coachChipText, { color: C.textSecondary }]}>Запитати коуча</Text>
            <Icon name="ChevronRight" size={20} color={C.textSecondary} />
          </Pressable>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>

      <FABButton />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base, gap: 16, paddingBottom: 32 },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 8, marginBottom: 4 },
  greeting: { fontFamily: FontFamily.serifBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  dateText: { fontFamily: FontFamily.sans, fontSize: 14 },
  focusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  focusChipText: { fontFamily: FontFamily.sansMedium, fontSize: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FontFamily.sansBold, fontSize: 16 },

  // Weekly card
  weeklyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.lg, padding: 16 },
  weeklyTitle: { fontFamily: FontFamily.sansSemiBold, fontSize: 14 },
  weeklySub: { fontFamily: FontFamily.sans, fontSize: 12, marginTop: 2 },

  // Ritual card
  ritualCard: { borderRadius: Radius.lg, overflow: 'hidden', gap: 16, padding: 20 },
  ritualInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ritualTextCol: { flex: 1 },
  ritualTitle: { fontFamily: FontFamily.serif, fontSize: 20, fontWeight: '600', lineHeight: 26 },
  ritualSubtitle: { fontFamily: FontFamily.sans, fontSize: 13, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  streakText: { fontFamily: FontFamily.sansMedium, fontSize: 13 },
  ritualDoneText: { fontFamily: FontFamily.sansMedium, fontSize: 14 },
  ritualBtn: {
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  ritualBtnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: '#060810' },
  ritualBtnSub: { fontFamily: FontFamily.sans, fontSize: 13 },

  // Section
  section: { gap: 10 },
  sectionLabel: { fontFamily: FontFamily.sansSemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 2 },

  // Belief card
  beliefCard: { borderRadius: Radius.lg, padding: 20, gap: 12 },
  beliefTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  beliefRingWrap: { position: 'relative', width: 64, height: 64, flexShrink: 0 },
  beliefRingCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  beliefRingText: { fontFamily: FontFamily.sansMedium, fontSize: 11 },
  beliefQuote: { fontFamily: FontFamily.serifItalic, fontSize: 17, lineHeight: 24 },
  beliefBar: { gap: 6 },
  beliefBarLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  beliefBarLabel: { fontFamily: FontFamily.sansMedium, fontSize: 11 },
  beliefBarCenter: { fontFamily: FontFamily.sansSemiBold, fontSize: 12 },
  beliefBarTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  beliefBarFill: { height: '100%', borderRadius: 3 },
  beliefCatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  beliefCatText: { fontFamily: FontFamily.sansSemiBold, fontSize: 11, letterSpacing: 0.8 },

  // Tasks
  tasksList: { gap: 6 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.lg, padding: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskText: { fontFamily: FontFamily.sansMedium, fontSize: 14, lineHeight: 20 },
  taskBeliefBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  taskBeliefText: { fontFamily: FontFamily.sansMedium, fontSize: 11 },

  showMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 },
  showMoreText: { fontFamily: FontFamily.sansMedium, fontSize: 13 },

  // Stats
  statsRow: { flexDirection: 'row', overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 3 },
  statValue: { fontFamily: FontFamily.serifBold, fontSize: 20, lineHeight: 24 },
  statLabel: { fontFamily: FontFamily.sansMedium, fontSize: 11 },

  // Coach chip
  coachChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderWidth: 1, borderRadius: Radius.lg },
  coachChipText: { fontFamily: FontFamily.sans, fontSize: 15 },

  // FAB
  fabWrap: { position: 'absolute', bottom: 90, right: Spacing.screen, zIndex: 20 },
  fab: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
});
