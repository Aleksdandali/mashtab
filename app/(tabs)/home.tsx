import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { Flame, ChevronRight, Brain, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { useBeliefs, getBeliefTitle, getCompletedStages } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';

export default function HomeScreen() {
  const { profile, fetchProfile } = useProfile();
  const { beliefs, fetchBeliefs } = useBeliefs();
  const { tasks, fetchTasks, toggleTask } = useTasks();
  const { todayMorningDone, todayEveningDone, fetchTodayRituals } = useJournal();

  useEffect(() => {
    fetchProfile();
    fetchBeliefs();
    fetchTasks();
    fetchTodayRituals();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброго ранку' : hour < 18 ? 'Добрий день' : 'Добрий вечір';
  const name = profile?.name ? `, ${profile.name}` : '';

  const now = new Date();
  const dateStr = now.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const activeBeliefs = beliefs.filter((b) => !b.completed_at);
  const firstBelief = activeBeliefs[0];
  const beliefProgress = firstBelief ? Math.round((getCompletedStages(firstBelief) / 6) * 100) : 0;

  const focusTasks = tasks.filter((t) => t.is_focus && !t.is_completed);
  const firstFocusTask = focusTasks[0];

  const rituals = [
    {
      time: '06:00',
      title: 'Ранковий ритуал',
      completed: todayMorningDone ? 1 : 0,
      total: 1,
      route: '/ritual/morning' as const,
    },
    {
      time: '21:00',
      title: 'Вечірній ритуал',
      completed: todayEveningDone ? 1 : 0,
      total: 1,
      route: '/ritual/evening' as const,
    },
  ];

  return (
    <SafeAreaView style={S.container}>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
        <View style={S.header}>
          <Text style={S.greeting}>{greeting}{name}</Text>
          <Text style={S.date}>{dateCapitalized}</Text>
        </View>

        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.iconContainer}>
              <Flame color="#C8FF00" size={20} strokeWidth={1.5} />
            </View>
            <Text style={S.label}>РИТУАЛИ</Text>
          </View>

          {rituals.map((ritual, index) => (
            <Pressable
              key={index}
              style={[S.ritualItem, index === 0 && S.ritualItemFirst]}
              onPress={() => router.push(ritual.route)}
            >
              <View style={S.ritualLeft}>
                <Text style={S.ritualTime}>{ritual.time}</Text>
                <Text style={S.ritualTitle}>{ritual.title}</Text>
              </View>
              <View style={S.ritualRight}>
                <Text style={S.ritualProgress}>{ritual.completed}/{ritual.total}</Text>
                <ChevronRight color="#A3AEC4" size={20} strokeWidth={1.5} />
              </View>
            </Pressable>
          ))}
        </View>

        {firstBelief && (
          <View style={S.card}>
            <View style={S.cardHeader}>
              <View style={S.iconContainer}>
                <Brain color="#C8FF00" size={20} strokeWidth={1.5} />
              </View>
              <Text style={S.label}>УСТАНОВКИ</Text>
            </View>

            <Text style={S.beliefTitle}>{getBeliefTitle(firstBelief)}</Text>
            <View style={S.progressBar}>
              <View style={[S.progressFill, { width: `${beliefProgress}%` as `${number}%` }]} />
            </View>
            <Text style={S.progressLabel}>Етап {firstBelief.current_stage} з 6</Text>

            <Pressable style={S.linkButton} onPress={() => router.push('/(tabs)/mindset')}>
              <Text style={S.linkText}>Переглянути всі установки</Text>
              <ArrowRight color="#C8FF00" size={16} strokeWidth={1.5} />
            </Pressable>
          </View>
        )}

        {firstFocusTask && (
          <View style={S.card}>
            <Text style={S.label}>ДІЯ ДНЯ</Text>
            <Text style={S.actionTitle}>{firstFocusTask.title}</Text>
            {firstFocusTask.notes ? (
              <Text style={S.actionDescription}>{firstFocusTask.notes}</Text>
            ) : null}
            <Pressable style={S.ctaButton} onPress={() => toggleTask(firstFocusTask.id)}>
              <Text style={S.ctaButtonText}>Відмітити виконаним</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={S.coachChip} onPress={() => router.push('/ai-coach')}>
          <View style={S.coachDot} />
          <Text style={S.coachText}>Твій коуч онлайн</Text>
        </Pressable>
      </ScrollView>
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
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.5,
    color: '#F9FAFF',
    marginBottom: 4,
  },
  date: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
  },
  card: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#A3AEC4',
  },
  ritualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 174, 196, 0.12)',
  },
  ritualItemFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  ritualLeft: {
    flex: 1,
  },
  ritualTime: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#C8FF00',
    marginBottom: 4,
  },
  ritualTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#F9FAFF',
  },
  ritualRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ritualProgress: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#A3AEC4',
  },
  beliefTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#F9FAFF',
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(163, 174, 196, 0.12)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#C8FF00',
  },
  progressLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A3AEC4',
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#C8FF00',
  },
  actionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#F9FAFF',
    marginBottom: 12,
    marginTop: 12,
  },
  actionDescription: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
    marginBottom: 20,
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
  coachChip: {
    backgroundColor: '#0B0F18',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
  },
  coachDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8FF00',
  },
  coachText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#F9FAFF',
  },
});
