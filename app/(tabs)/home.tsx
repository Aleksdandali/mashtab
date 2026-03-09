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
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { useBeliefs, getBeliefTitle, getBeliefCategory, getCompletedStages } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';
import { RingProgress } from '@/components/charts/RingProgress';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { CATEGORY_MAP } from '@/constants/categories';
import { CATEGORY_COLORS } from '@/constants/sample-beliefs';
import { STAGE_COLORS } from '@/constants/stages';
import { getDayPeriod, getGreeting, formatDisplayDate, formatDayName, todayISO } from '@/utils/dates';
import type { Task } from '@/types';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Ritual CTA card with pulsing glow */
function RitualCard({
  period,
  done,
  colors,
}: {
  period: 'morning' | 'evening';
  done: boolean;
  colors: ReturnType<typeof useTheme>;
}) {
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

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.32] });

  const isMorning = period === 'morning';
  const icon = isMorning ? '🌅' : '🌙';
  const title = isMorning ? 'Ранковий ритуал' : 'Вечірній ритуал';
  const subtitle = isMorning ? 'Намір · Вдячність · Фокус' : 'Перемоги · Інсайти · Завтра';
  const route = isMorning ? '/ritual/morning' : '/ritual/evening';
  const accentColor = isMorning ? colors.primary : '#7BB8C9';

  if (done) {
    return (
      <View style={[styles.ritualDone, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
        <Text style={styles.ritualDoneIcon}>✅</Text>
        <Text style={[styles.ritualDoneText, { color: colors.textSecondary }]}>
          {isMorning ? 'Ранковий ритуал завершено' : 'Вечірній ритуал завершено'}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(route as any)}
      style={({ pressed }) => [
        styles.ritualCard,
        { backgroundColor: colors.surface1, borderColor: accentColor + '40' },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
    >
      {/* Glow pulse */}
      <Animated.View
        style={[styles.ritualGlow, { backgroundColor: accentColor, opacity: glowOpacity }]}
      />

      <View style={styles.ritualRow}>
        <View style={styles.ritualLeft}>
          <View style={[styles.ritualIconWrap, { backgroundColor: accentColor + '20' }]}>
            <Text style={styles.ritualIcon}>{icon}</Text>
          </View>
          <View style={styles.ritualText}>
            <Text style={[styles.ritualTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.ritualSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
          </View>
        </View>
        <View style={[styles.ritualCTA, { backgroundColor: accentColor }]}>
          <Text style={styles.ritualCTAText}>Почати</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Weekly check-in CTA */
function WeeklyCard({ colors }: { colors: ReturnType<typeof useTheme> }) {
  return (
    <Pressable
      onPress={() => router.push('/ritual/weekly' as any)}
      style={({ pressed }) => [
        styles.weeklyCard,
        { backgroundColor: colors.surface2, borderColor: colors.primary + '50' },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.weeklyIcon}>📊</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.weeklyTitle, { color: colors.text }]}>Тижневий підсумок</Text>
        <Text style={[styles.weeklySub, { color: colors.textTertiary }]}>
          Підбийте підсумки тижня
        </Text>
      </View>
      <Text style={[styles.weeklyArrow, { color: colors.primary }]}>→</Text>
    </Pressable>
  );
}

/** Single task row with checkbox */
function TaskRow({
  task,
  onToggle,
  colors,
}: {
  task: Task;
  onToggle: (id: string) => void;
  colors: ReturnType<typeof useTheme>;
}) {
  const checkAnim = useRef(new Animated.Value(task.is_completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(checkAnim, {
      toValue: task.is_completed ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [task.is_completed]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(task.id);
  };

  const checkBg = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface3, colors.primary],
  });

  const hasBelief = !!task.user_belief_id;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.taskRow,
        { borderBottomColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      {/* Checkbox */}
      <Animated.View style={[styles.checkbox, { backgroundColor: checkBg, borderColor: task.is_completed ? colors.primary : colors.borderMedium }]}>
        {task.is_completed && <Text style={styles.checkMark}>✓</Text>}
      </Animated.View>

      {/* Title */}
      <View style={styles.taskContent}>
        <View style={styles.taskTitleRow}>
          {task.is_focus && <Text style={[styles.focusStar, { color: colors.primary }]}>★ </Text>}
          <Text
            style={[
              styles.taskTitle,
              { color: colors.text },
              task.is_completed && { textDecorationLine: 'line-through', color: colors.textTertiary },
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
        </View>
        {hasBelief && (
          <Text style={[styles.beliefBadge, { color: colors.primary }]}>🧠 Пов'язана установка</Text>
        )}
      </View>
    </Pressable>
  );
}

/** Compact belief card for home screen */
function BeliefHomeCard({
  belief,
  colors,
}: {
  belief: import('@/types').UserBelief;
  colors: ReturnType<typeof useTheme>;
}) {
  const completed = getCompletedStages(belief);
  const category = getBeliefCategory(belief);
  const cat = category ? CATEGORY_MAP[category] : null;
  const color = category ? CATEGORY_COLORS[category] : colors.primary;
  const title = getBeliefTitle(belief);

  return (
    <Pressable
      onPress={() => router.push(`/belief/${belief.id}` as any)}
      style={({ pressed }) => [
        styles.beliefCard,
        { backgroundColor: colors.surface1, borderColor: colors.border },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.beliefRing}>
        <RingProgress progress={completed} color={color} size={52} strokeWidth={4} />
        <View style={styles.beliefRingCenter}>
          <Text style={styles.beliefCatIcon}>{cat?.icon ?? '🧠'}</Text>
        </View>
      </View>

      <View style={styles.beliefInfo}>
        <Text style={[styles.beliefCatName, { color }]} numberOfLines={1}>
          {cat?.nameUk?.toUpperCase() ?? 'УСТАНОВКА'}
        </Text>
        <Text style={[styles.beliefTitle, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.beliefStage, { color: colors.textTertiary }]}>
          Етап {belief.current_stage} з 6
        </Text>
      </View>

      <Text style={[styles.beliefArrow, { color: colors.textTertiary }]}>›</Text>
    </Pressable>
  );
}

/** Quick stats row */
function QuickStats({
  beliefsProgress,
  streak,
  focusDone,
  focusTotal,
  colors,
}: {
  beliefsProgress: number;
  streak: number;
  focusDone: number;
  focusTotal: number;
  colors: ReturnType<typeof useTheme>;
}) {
  const stats = [
    { label: 'Установки', value: `${beliefsProgress}%`, icon: '🧠' },
    { label: 'Ритуалів', value: `${streak}`, icon: '🔥' },
    { label: 'Фокус', value: `${focusDone}/${focusTotal}`, icon: '⭐' },
  ];

  return (
    <View style={[styles.statsRow, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
          <Text style={styles.statIcon}>{s.icon}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Section header */
function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof useTheme> }) {
  return <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useTheme();

  const { profile, streak, fetchProfile, fetchStreak } = useProfile();
  const { beliefs, fetchBeliefs } = useBeliefs();
  const { tasks, fetchTasks, toggleTask, focusTasks, regularTasks } = useTasks();
  const { todayMorningDone, todayEveningDone, fetchTodayRituals } = useJournal();

  const period = getDayPeriod();
  const greeting = getGreeting(profile?.name ?? null, period);
  const displayDate = formatDisplayDate();
  const dayName = formatDayName();

  const today = new Date();
  const isWeeklyDay = profile
    ? today.getDay() === profile.weekly_checkin_day
    : today.getDay() === 0;

  // Load all data on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchStreak();
      fetchBeliefs();
      fetchTasks(todayISO());
      fetchTodayRituals();
    }, []),
  );

  // Stats computations
  const activeFocus = focusTasks();
  const focusDone = activeFocus.filter((t) => t.is_completed).length;
  const focusTotal = activeFocus.length;
  const allRegular = regularTasks();

  const beliefsProgress =
    beliefs.length > 0
      ? Math.round((beliefs.reduce((sum, b) => sum + getCompletedStages(b), 0) / (beliefs.length * 6)) * 100)
      : 0;

  // Show max 2 beliefs on home
  const visibleBeliefs = beliefs.slice(0, 2);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
              <Text style={[styles.dateLabel, { color: colors.textTertiary }]}>
                {dayName}, {displayDate}
              </Text>
            </View>
            {/* Avatar → Profile */}
            <Pressable
              onPress={() => router.push('/(tabs)/profile' as any)}
              style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </Pressable>
          </View>

          {/* ── Weekly check-in CTA (Sunday) ── */}
          {isWeeklyDay && <WeeklyCard colors={colors} />}

          {/* ── Ritual CTA ── */}
          {(period === 'morning' || period === 'evening') && (
            <RitualCard
              period={period}
              done={period === 'morning' ? todayMorningDone : todayEveningDone}
              colors={colors}
            />
          )}

          {/* ── Focus tasks ── */}
          {activeFocus.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Фокус на сьогодні" colors={colors} />
              <View style={[styles.taskCard, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
                {activeFocus.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} colors={colors} />
                ))}
              </View>
            </View>
          )}

          {/* ── Other tasks ── */}
          {allRegular.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Задачі" colors={colors} />
              <View style={[styles.taskCard, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
                {allRegular.slice(0, 4).map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} colors={colors} />
                ))}
                {allRegular.length > 4 && (
                  <Pressable
                    onPress={() => router.push('/(tabs)/plans' as any)}
                    style={styles.showMoreBtn}
                  >
                    <Text style={[styles.showMoreText, { color: colors.primary }]}>
                      Ще {allRegular.length - 4} задач →
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* ── Active beliefs ── */}
          {visibleBeliefs.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Активні установки" colors={colors} />
              <View style={styles.beliefsColumn}>
                {visibleBeliefs.map((b) => (
                  <BeliefHomeCard key={b.id} belief={b} colors={colors} />
                ))}
              </View>
            </View>
          )}

          {/* ── Quick stats ── */}
          <QuickStats
            beliefsProgress={beliefsProgress}
            streak={streak}
            focusDone={focusDone}
            focusTotal={Math.max(focusTotal, 1)}
            colors={colors}
          />

          {/* Bottom pad for FAB */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── FAB: AI coach ── */}
      <FABButton colors={colors} />
    </View>
  );
}

function FABButton({ colors }: { colors: ReturnType<typeof useTheme> }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[styles.fabWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => router.push('/ai-coach' as any)}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50, bounciness: 0 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
        }
        style={[styles.fab, { backgroundColor: colors.primary, ...Shadow.lg }]}
      >
        <Text style={styles.fabIcon}>🤖</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.base,
    gap: Spacing.base,
    paddingBottom: Spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontFamily: FontFamily.serifBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  dateLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
    lineHeight: 20,
  },

  // Weekly CTA
  weeklyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
  },
  weeklyIcon: { fontSize: 20 },
  weeklyTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  weeklySub: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  weeklyArrow: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 18,
  },

  // Ritual card
  ritualCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  ritualGlow: {
    position: 'absolute',
    inset: 0,
  },
  ritualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  ritualLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  ritualIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualIcon: { fontSize: 22 },
  ritualText: { flex: 1 },
  ritualTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  ritualSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  ritualCTA: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ritualCTAText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 13,
    color: '#1A1208',
  },
  ritualDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
  },
  ritualDoneIcon: { fontSize: 18 },
  ritualDoneText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
  },

  // Section
  section: { gap: Spacing.xs },
  sectionHeader: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 2,
    marginBottom: 2,
  },

  // Tasks
  taskCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkMark: {
    fontFamily: FontFamily.sansBold,
    fontSize: 11,
    color: '#1A1208',
    lineHeight: 14,
  },
  taskContent: { flex: 1, gap: 2 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center' },
  focusStar: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13,
  },
  taskTitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    flex: 1,
  },
  beliefBadge: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
  },
  showMoreBtn: {
    padding: Spacing.base,
    alignItems: 'center',
  },
  showMoreText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
  },

  // Beliefs
  beliefsColumn: { gap: Spacing.sm },
  beliefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
  },
  beliefRing: {
    position: 'relative',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  beliefRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beliefCatIcon: { fontSize: 18 },
  beliefInfo: { flex: 1, gap: 2 },
  beliefCatName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  beliefTitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  beliefStage: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
  },
  beliefArrow: {
    fontFamily: FontFamily.sansBold,
    fontSize: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
    gap: 3,
  },
  statIcon: { fontSize: 16 },
  statValue: {
    fontFamily: FontFamily.serifBold,
    fontSize: 20,
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.screen,
    zIndex: 20,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 24 },
});
