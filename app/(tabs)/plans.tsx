import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useBeliefs } from '@/hooks/useBeliefs';
import { SPHERES, SPHERE_MAP } from '@/constants/spheres';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import {
  todayISO,
  dateISO,
  formatDisplayDate,
  getWeekDates,
} from '@/utils/dates';
import { Task, Goal } from '@/types';

type TabKey = 'tasks' | 'goals';

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string) => void;
}) {
  const C = useTheme();
  return (
    <Pressable
      style={[S.taskCard, { backgroundColor: C.surface1 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(task.id);
      }}
    >
      <View
        style={[
          S.checkbox,
          {
            borderColor: task.is_completed ? C.primary : 'rgba(163,174,196,0.4)',
            backgroundColor: task.is_completed ? C.primary : 'transparent',
          },
        ]}
      >
        {task.is_completed && (
          <Icon name="Check" size={16} color="#060810" strokeWidth={2} />
        )}
      </View>

      <Text
        style={[
          S.taskText,
          { color: task.is_completed ? C.textSecondary : C.text },
          task.is_completed && S.taskTextDone,
        ]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {task.is_focus && !task.is_completed && (
        <View style={[S.priorityDot, { backgroundColor: C.primary }]} />
      )}
    </Pressable>
  );
}

// ─── Tasks View ───────────────────────────────────────────────────────────────

function TasksView() {
  const C = useTheme();
  const {
    date,
    loading,
    fetchTasks,
    fetchWeekCounts,
    toggleTask,
    addTask,
    focusTasks,
    regularTasks,
  } = useTasks();
  const { fetchGoals } = useGoals();
  const { fetchBeliefs } = useBeliefs();

  const [showAddInput, setShowAddInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<TextInput>(null);

  const getWeekDatesForDate = (d: string) => getWeekDates(new Date(d + 'T00:00:00'));

  useFocusEffect(
    useCallback(() => {
      fetchTasks(date);
      fetchWeekCounts(getWeekDatesForDate(date));
      fetchGoals();
      fetchBeliefs();
    }, []),
  );

  const navigateDay = (offset: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const newDate = dateISO(d);
    fetchTasks(newDate);
    fetchWeekCounts(getWeekDates(d));
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -60) runOnJS(navigateDay)(1);
      else if (e.translationX > 60) runOnJS(navigateDay)(-1);
    });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      setShowAddInput(false);
      return;
    }
    addTask(newTaskTitle.trim());
    setNewTaskTitle('');
    setShowAddInput(false);
  };

  const today = todayISO();
  const displayDate = new Date(date + 'T00:00:00');
  const isToday = date === today;
  const dateLabel = isToday
    ? `Сьогодні, ${formatDisplayDate(displayDate)}`
    : formatDisplayDate(displayDate);

  const focus = focusTasks();
  const regular = regularTasks();
  const allTasks = [...focus, ...regular];

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={S.scrollContent}
        >
          {/* Date nav */}
          <View style={S.dateNav}>
            <Pressable onPress={() => navigateDay(-1)} hitSlop={12} style={S.navBtn}>
              <Icon name="ChevronLeft" size={20} color={C.textSecondary} />
            </Pressable>
            <Text style={[S.dateLabel, { color: C.text }]}>{dateLabel}</Text>
            <Pressable onPress={() => navigateDay(1)} hitSlop={12} style={S.navBtn}>
              <Icon name="ChevronRight" size={20} color={C.textSecondary} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {allTasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={toggleTask} />
              ))}

              {showAddInput ? (
                <View
                  style={[
                    S.addTaskCard,
                    { backgroundColor: C.surface1, borderColor: C.border },
                  ]}
                >
                  <Icon name="Plus" size={20} color={C.textSecondary} />
                  <TextInput
                    ref={inputRef}
                    style={[S.addTaskInput, { color: C.text }]}
                    placeholder="Назва задачі..."
                    placeholderTextColor={C.textSecondary}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    onSubmitEditing={handleAddTask}
                    onBlur={() => {
                      if (!newTaskTitle.trim()) setShowAddInput(false);
                    }}
                    returnKeyType="done"
                    autoFocus
                  />
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    S.addTaskCard,
                    { backgroundColor: C.surface1, borderColor: C.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => setShowAddInput(true)}
                >
                  <Icon name="Plus" size={20} color={C.textSecondary} />
                  <Text style={[S.addTaskText, { color: C.textSecondary }]}>
                    Додати задачу
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </GestureDetector>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal }: { goal: Goal }) {
  const C = useTheme();
  const progress = goal.progress ?? 0;
  const tasks = (goal as Goal & { tasks?: Task[] }).tasks ?? [];
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.is_completed).length;

  const deadlineText = goal.due_date
    ? `Дедлайн: ${new Date(goal.due_date + 'T00:00:00').toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
      })}`
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        S.goalCard,
        { backgroundColor: C.surface1 },
        pressed && { opacity: 0.87, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => router.push(`/goal/${goal.id}`)}
    >
      <View style={S.goalHeader}>
        <View style={[S.goalIconWrap, { backgroundColor: C.primaryMuted }]}>
          <Icon name="Target" size={20} color={C.primary} />
        </View>
        <View style={S.goalContent}>
          <Text style={[S.goalTitle, { color: C.text }]} numberOfLines={2}>
            {goal.title}
          </Text>
          {deadlineText && (
            <Text style={[S.goalDeadline, { color: C.textSecondary }]}>
              {deadlineText}
            </Text>
          )}
        </View>
      </View>

      <View style={S.progressSection}>
        <View style={[S.progressBar, { backgroundColor: C.border }]}>
          <View
            style={[
              S.progressFill,
              {
                width: `${progress}%` as `${number}%`,
                backgroundColor: C.primary,
              },
            ]}
          />
        </View>
        <Text style={[S.progressText, { color: C.textSecondary }]}>
          {doneTasks}/{totalTasks} задач • {progress}%
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Goals View ───────────────────────────────────────────────────────────────

function GoalsView() {
  const C = useTheme();
  const { goals, loading, fetchGoals } = useGoals();

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals]),
  );

  const grouped = SPHERES.reduce<Record<string, Goal[]>>((acc, s) => {
    const items = goals.filter((g) => g.sphere === s.key);
    if (items.length > 0) acc[s.key] = items;
    return acc;
  }, {});

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={S.scrollContent}
    >
      {loading && goals.length === 0 ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
      ) : (
        <>
          {Object.entries(grouped).map(([sphereKey, items]) => {
            const sphere = SPHERE_MAP[sphereKey as keyof typeof SPHERE_MAP];
            return (
              <View key={sphereKey} style={S.sphereGroup}>
                <Text style={[S.sphereLabel, { color: C.textSecondary }]}>
                  {sphere.nameUk}
                </Text>
                {items.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </View>
            );
          })}

          <Pressable
            style={({ pressed }) => [
              S.addGoalCard,
              { borderColor: C.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push('/goal/create')}
          >
            <Icon name="Plus" size={24} color={C.textSecondary} />
            <Text style={[S.addGoalText, { color: C.textSecondary }]}>Нова ціль</Text>
          </Pressable>

          <View style={{ height: Spacing.xxxl }} />
        </>
      )}
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const C = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('tasks');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[S.root, { backgroundColor: C.bg }]}>
        {/* Header */}
        <View style={[S.header, { borderBottomColor: C.border }]}>
          <Text style={[S.headerTitle, { color: C.text }]}>Плани</Text>
          <Pressable
            style={({ pressed }) => [
              S.addButton,
              { backgroundColor: C.primary },
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
            onPress={() =>
              activeTab === 'tasks'
                ? router.push('/task/create')
                : router.push('/goal/create')
            }
          >
            <Icon name="Plus" size={20} color="#060810" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={S.tabs}>
          {(['tasks', 'goals'] as TabKey[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                style={[S.tab, isActive && S.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    S.tabText,
                    { color: isActive ? C.primary : C.textSecondary },
                  ]}
                >
                  {tab === 'tasks' ? 'Задачі' : 'Цілі'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'tasks' ? <TasksView /> : <GoalsView />}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(200,255,0,0.09)',
  },
  tabText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
  },

  // Scroll
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // Date nav
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: { padding: 4 },
  dateLabel: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    textAlign: 'center',
    flex: 1,
  },

  // Task card
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskText: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },

  // Add task dashed card
  addTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addTaskText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
  },
  addTaskInput: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    padding: 0,
  },

  // Goal card
  goalCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  goalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  goalContent: {
    flex: 1,
    gap: 2,
  },
  goalTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    lineHeight: 24,
  },
  goalDeadline: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
  },
  progressText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },

  // Sphere group
  sphereGroup: {
    marginBottom: 8,
  },
  sphereLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Add goal dashed card
  addGoalCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: Spacing.base,
  },
  addGoalText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    marginTop: 12,
  },
});
