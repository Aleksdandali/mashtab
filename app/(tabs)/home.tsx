import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { useBeliefs, getBeliefTitle, getCompletedStages } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';
import { Icon } from '@/components/ui/Icon';
import { FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { getDayPeriod, getGreeting, formatDisplayDate, formatDayName, todayISO } from '@/utils/dates';

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
  const firstFocusTask = activeFocus[0] ?? regularTasks()[0] ?? null;
  const visibleBelief = beliefs[0] ?? null;
  const completedStages = visibleBelief ? getCompletedStages(visibleBelief) : 0;
  const beliefProgressPct = completedStages / 6;

  const morningCount = todayMorningDone ? 1 : 0;
  const eveningCount = todayEveningDone ? 1 : 0;

  return (
    <View style={[S.root, { backgroundColor: C.bg }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={S.header}>
            <Text style={[S.greeting, { color: C.text }]}>{greeting}</Text>
            <Text style={[S.dateText, { color: C.textSecondary }]}>
              {dayName}, {displayDate}
            </Text>
          </View>

          {/* ── РИТУАЛИ card ── */}
          <View style={[S.card, { backgroundColor: C.surface1 }]}>
            <View style={S.cardHeader}>
              <View style={[S.iconContainer, { backgroundColor: C.primaryMuted }]}>
                <Icon name="Sun" size={16} color={C.primary} />
              </View>
              <Text style={[S.cardLabel, { color: C.textSecondary }]}>РИТУАЛИ</Text>
            </View>

            {/* Morning ritual row */}
            <Pressable
              onPress={() => router.push('/ritual/morning' as any)}
              style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            >
              <View style={S.ritualRow}>
                <Text style={[S.ritualTime, { color: C.primary }]}>08:00</Text>
                <Text style={[S.ritualTitle, { color: C.text }]} numberOfLines={1}>
                  Ранковий ритуал
                </Text>
                <View style={S.ritualRight}>
                  <Text style={[S.ritualCount, { color: todayMorningDone ? C.primary : C.textSecondary }]}>
                    {morningCount}/1
                  </Text>
                  <Icon name="ChevronRight" size={16} color={C.textSecondary} />
                </View>
              </View>
            </Pressable>

            {/* Evening ritual row */}
            <Pressable
              onPress={() => router.push('/ritual/evening' as any)}
              style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            >
              <View style={[S.ritualRow, S.ritualRowBorder, { borderTopColor: C.border }]}>
                <Text style={[S.ritualTime, { color: C.primary }]}>20:00</Text>
                <Text style={[S.ritualTitle, { color: C.text }]} numberOfLines={1}>
                  Вечірній ритуал
                </Text>
                <View style={S.ritualRight}>
                  <Text style={[S.ritualCount, { color: todayEveningDone ? C.primary : C.textSecondary }]}>
                    {eveningCount}/1
                  </Text>
                  <Icon name="ChevronRight" size={16} color={C.textSecondary} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* ── УСТАНОВКИ card ── */}
          {visibleBelief && (
            <View style={[S.card, { backgroundColor: C.surface1 }]}>
              <View style={S.cardHeader}>
                <View style={[S.iconContainer, { backgroundColor: C.primaryMuted }]}>
                  <Icon name="Brain" size={16} color={C.primary} />
                </View>
                <Text style={[S.cardLabel, { color: C.textSecondary }]}>УСТАНОВКИ</Text>
              </View>

              <Text style={[S.beliefTitle, { color: C.text }]} numberOfLines={3}>
                {getBeliefTitle(visibleBelief)}
              </Text>

              <View style={[S.progressTrack, { backgroundColor: C.border }]}>
                <View
                  style={[
                    S.progressFill,
                    { backgroundColor: C.primary, width: `${Math.round(beliefProgressPct * 100)}%` as `${number}%` },
                  ]}
                />
              </View>

              <Pressable
                onPress={() => router.push('/(tabs)/mindset' as any)}
                style={({ pressed }) => [S.linkRow, pressed && { opacity: 0.7 }]}
              >
                <Text style={[S.linkText, { color: C.primary }]}>Переглянути всі установки</Text>
                <Icon name="ArrowRight" size={16} color={C.primary} />
              </Pressable>
            </View>
          )}

          {/* ── ДІЯ ДНЯ card ── */}
          <View style={[S.card, { backgroundColor: C.surface1 }]}>
            <View style={S.cardHeader}>
              <View style={[S.iconContainer, { backgroundColor: C.primaryMuted }]}>
                <Icon name="Zap" size={16} color={C.primary} />
              </View>
              <Text style={[S.cardLabel, { color: C.textSecondary }]}>ДІЯ ДНЯ</Text>
            </View>

            <Text style={[S.actionTitle, { color: C.text }]} numberOfLines={2}>
              {firstFocusTask?.title ?? 'Немає фокусних задач'}
            </Text>
            <Text style={[S.actionDescription, { color: C.textSecondary }]}>
              Виконай цю задачу сьогодні
            </Text>

            <Pressable
              onPress={() => router.push('/ai-coach' as any)}
              style={({ pressed }) => [S.ctaButton, { backgroundColor: C.primary }, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
            >
              <Text style={S.ctaButtonText}>Записати інсайт</Text>
            </Pressable>
          </View>

          {/* ── Coach chip ── */}
          <Pressable
            onPress={() => router.push('/ai-coach' as any)}
            style={({ pressed }) => [
              S.coachChip,
              { backgroundColor: C.surface1 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={[S.coachDot, { backgroundColor: C.primary }]} />
            <Text style={[S.coachChipText, { color: C.text }]}>Твій коуч онлайн</Text>
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
  header: { marginBottom: 24 },
  greeting: { fontFamily: FontFamily.sansExtraBold, fontSize: 32, letterSpacing: -0.5, marginBottom: 4 },
  dateText: { fontFamily: FontFamily.sansMedium, fontSize: 15 },

  // Card base
  card: { borderRadius: 16, padding: 24, marginBottom: 16 },

  // Card header row
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Ritual rows
  ritualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  ritualRowBorder: {
    borderTopWidth: 1,
  },
  ritualTime: { fontFamily: FontFamily.sansSemiBold, fontSize: 13, width: 44 },
  ritualTitle: { fontFamily: FontFamily.sansMedium, fontSize: 15, flex: 1 },
  ritualRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ritualCount: { fontFamily: FontFamily.sansSemiBold, fontSize: 13 },

  // Belief section
  beliefTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 16,
  },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15 },

  // Action day section
  actionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 8,
  },
  actionDescription: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  ctaButton: {
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    color: '#060810',
  },

  // Coach chip
  coachChip: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coachDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  coachChipText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15 },
});
