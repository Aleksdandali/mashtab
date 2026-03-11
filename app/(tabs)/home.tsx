import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Flame, ChevronRight, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { useBeliefs, getBeliefTitle, getBeliefCategory, getCompletedStages } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';
import { STAGES } from '@/constants/stages';
import { CATEGORIES } from '@/constants/categories';

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ current, total, size = 56 }: { current: number; total: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (total > 0 ? current / total : 0));
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <SvgCircle
        cx={size / 2} cy={size / 2} r={r}
        stroke="rgba(163,174,196,0.15)" strokeWidth="4" fill="none"
      />
      <SvgCircle
        cx={size / 2} cy={size / 2} r={r}
        stroke="#C8FF00" strokeWidth="4" fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile, fetchProfile, streak, fetchStreak } = useProfile();
  const { beliefs, fetchBeliefs } = useBeliefs();
  const { tasks, fetchTasks, toggleTask } = useTasks();
  const { todayMorningDone, todayEveningDone, fetchTodayRituals } = useJournal();

  useEffect(() => {
    fetchProfile();
    fetchStreak();
    fetchBeliefs();
    fetchTasks();
    fetchTodayRituals();
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour >= 5 && hour < 12 ? 'Доброго ранку' : hour >= 12 && hour < 18 ? 'Доброго дня' : 'Доброго вечора';

  const name = profile?.name ?? '';
  const initial = name.charAt(0).toUpperCase() || 'М';

  const DAY_NAMES = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'];
  const MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
  const dateStr = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  const activeBeliefs = beliefs.filter((b) => !b.completed_at);
  const firstBelief = activeBeliefs[0];
  const completedStages = firstBelief ? getCompletedStages(firstBelief) : 0;
  const beliefCategoryKey = firstBelief ? getBeliefCategory(firstBelief) : null;
  const categoryInfo = beliefCategoryKey ? CATEGORIES.find((c) => c.key === beliefCategoryKey) : null;
  const stageInfo = firstBelief ? STAGES.find((s) => s.index === firstBelief.current_stage) : null;
  const convWidth = completedStages > 0 ? `${Math.round(completedStages / 6 * 100)}%` : '2%';
  const convValue = Math.round(completedStages / 6 * 200 - 100);
  const convLabel = convValue > 0 ? `+${convValue}` : `${convValue}`;

  const focusTasks = tasks.filter((t) => t.is_focus);
  const firstPendingTask = focusTasks.find((t) => !t.is_completed);
  const completedFocusCount = focusTasks.filter((t) => t.is_completed).length;

  const isMorning = hour < 14;
  const ritualDone = isMorning ? todayMorningDone : todayEveningDone;
  const ritualName = isMorning ? 'Ранковий ритуал' : 'Вечірній ритуал';
  const ritualRoute = isMorning ? '/ritual/morning' : '/ritual/evening';

  return (
    <SafeAreaView style={S.container}>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerText}>
            <Text style={S.greeting}>
              {greeting},{'\n'}{name}
            </Text>
            <Text style={S.date}>{dateStr}</Text>
          </View>
          <View style={S.avatar}>
            <Text style={S.avatarText}>{initial}</Text>
          </View>
        </View>

        {/* Focus chip */}
        {categoryInfo && (
          <View style={S.focusChipRow}>
            <View style={S.focusChip}>
              <Text style={S.focusChipText}>Фокус тижня: {categoryInfo.nameUk}</Text>
            </View>
          </View>
        )}

        {/* Ritual card */}
        {!ritualDone ? (
          <View style={[S.card, S.cardMb]}>
            <View style={S.ritualTop}>
              <View style={S.ritualInfo}>
                <Text style={S.ritualTitle}>{ritualName}</Text>
                <Text style={S.ritualSubtitle}>Намір • Вдячність • Фокус</Text>
              </View>
              <View style={S.streakBadge}>
                <Flame size={16} color="#C8FF00" strokeWidth={2} />
                <Text style={S.streakText}>{streak} днів</Text>
              </View>
            </View>
            <Pressable style={S.ritualBtn} onPress={() => router.push(ritualRoute)}>
              <Text style={S.ritualBtnText}>Почати</Text>
              <Text style={S.ritualBtnTime}>  3 хв</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[S.ritualDoneCard, S.cardMb]}>
            <Check size={20} color="#C8FF00" strokeWidth={2.5} />
            <Text style={S.ritualDoneText}>Ритуал виконано на сьогодні</Text>
          </View>
        )}

        {/* Money action */}
        {firstPendingTask && (
          <View style={S.sectionBlock}>
            <Text style={S.sectionLabel}>Грошова дія</Text>
            <View style={S.card}>
              <View style={S.moneyRow}>
                <Pressable
                  style={[S.moneyCheckbox, firstPendingTask.is_completed && S.moneyCheckboxDone]}
                  onPress={() => toggleTask(firstPendingTask.id)}
                >
                  {firstPendingTask.is_completed && (
                    <Check size={14} color="#060810" strokeWidth={3} />
                  )}
                </Pressable>
                <Text
                  style={[
                    S.moneyTaskText,
                    firstPendingTask.is_completed && S.moneyTaskTextDone,
                  ]}
                >
                  {firstPendingTask.title}
                </Text>
              </View>
              <View style={S.moneyDivider}>
                <Text style={S.moneyCounterText}>
                  Цього тижня:{' '}
                  <Text style={S.moneyCounterAccent}>
                    {completedFocusCount} грошових дій
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Active belief */}
        {firstBelief && (
          <View style={S.sectionBlock}>
            <Text style={S.sectionLabel}>Активна установка</Text>
            <Pressable style={S.card} onPress={() => router.push(`/belief/${firstBelief.id}`)}>
              <View style={S.beliefRow}>
                <View style={S.ringWrap}>
                  <ProgressRing current={completedStages} total={6} size={56} />
                  <View style={S.ringCenter}>
                    <Text style={S.ringLabel}>{completedStages}/6</Text>
                  </View>
                </View>
                <View style={S.beliefMeta}>
                  {categoryInfo && (
                    <View style={S.catBadge}>
                      <Text style={S.catBadgeText}>{categoryInfo.nameUk.toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={S.beliefTitle} numberOfLines={2}>
                    {getBeliefTitle(firstBelief)}
                  </Text>
                </View>
              </View>

              {stageInfo && (
                <Text style={S.stageLine}>
                  Етап:{' '}
                  <Text style={S.stageLineValue}>{stageInfo.nameUk}</Text>
                </Text>
              )}

              <View style={S.convTrack}>
                <View style={[S.convFill, { width: convWidth as `${number}%` }]} />
              </View>
              <View style={S.convLabels}>
                <Text style={S.convLabelMuted}>-100</Text>
                <Text style={S.convLabelAccent}>{convLabel}</Text>
                <Text style={S.convLabelMuted}>+100</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Coach button */}
        <Pressable style={S.coachBtn} onPress={() => router.push('/ai-coach')}>
          <Text style={S.coachBtnText}>Запитати коуча</Text>
          <ChevronRight size={18} color="#A3AEC4" strokeWidth={2} />
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 16, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerText: { flex: 1 },
  greeting: { fontFamily: 'Inter_800ExtraBold', fontSize: 32, color: '#F9FAFF', letterSpacing: -0.5, lineHeight: 38 },
  date: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#A3AEC4', marginTop: 8 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#111622',
    borderWidth: 1, borderColor: 'rgba(200,255,0,0.2)',
    alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0,
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#C8FF00' },

  focusChipRow: { marginBottom: 24 },
  focusChip: {
    alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 9999, borderWidth: 1, borderColor: '#C8FF00',
  },
  focusChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#C8FF00' },

  card: { backgroundColor: '#0B0F18', borderRadius: 16, padding: 24 },
  cardMb: { marginBottom: 16 },
  sectionBlock: { marginBottom: 16 },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 12,
    letterSpacing: 0.96, textTransform: 'uppercase', color: '#A3AEC4', marginBottom: 12,
  },

  ritualTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ritualInfo: { flex: 1 },
  ritualTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#F9FAFF', marginBottom: 4 },
  ritualSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A3AEC4' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#111622', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10,
  },
  streakText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#A3AEC4' },
  ritualBtn: {
    marginTop: 20, height: 52, borderRadius: 12, backgroundColor: '#C8FF00',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  ritualBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#060810' },
  ritualBtnTime: { fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(6,8,16,0.65)' },

  ritualDoneCard: {
    backgroundColor: 'rgba(200,255,0,0.09)',
    borderWidth: 1, borderColor: 'rgba(200,255,0,0.2)', borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  ritualDoneText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#C8FF00' },

  moneyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  moneyCheckbox: {
    width: 20, height: 20, borderRadius: 4, marginTop: 2, flexShrink: 0,
    borderWidth: 2, borderColor: 'rgba(163,174,196,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  moneyCheckboxDone: { backgroundColor: '#C8FF00', borderColor: '#C8FF00' },
  moneyTaskText: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22, color: '#F9FAFF', flex: 1 },
  moneyTaskTextDone: { textDecorationLine: 'line-through', opacity: 0.4 },
  moneyDivider: {
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  moneyCounterText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A3AEC4' },
  moneyCounterAccent: { fontFamily: 'Inter_700Bold', color: '#C8FF00' },

  beliefRow: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 14 },
  ringWrap: { position: 'relative', flexShrink: 0 },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringLabel: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#F9FAFF' },
  beliefMeta: { flex: 1 },
  catBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(200,255,0,0.09)',
    paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6, marginBottom: 6,
  },
  catBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.55, color: '#C8FF00' },
  beliefTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#F9FAFF', lineHeight: 22 },

  stageLine: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A3AEC4', marginBottom: 12 },
  stageLineValue: { fontFamily: 'Inter_500Medium', color: '#F9FAFF' },

  convTrack: {
    backgroundColor: '#111622', borderRadius: 4, height: 6,
    overflow: 'hidden', marginBottom: 8,
  },
  convFill: { backgroundColor: '#C8FF00', borderRadius: 4, height: 6 },
  convLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  convLabelMuted: { fontFamily: 'Inter_500Medium', fontSize: 11, color: '#A3AEC4' },
  convLabelAccent: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#C8FF00' },

  coachBtn: {
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(163,174,196,0.2)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  coachBtnText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: '#A3AEC4' },
});
