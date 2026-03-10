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
  KeyboardAvoidingView,
  Platform,
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
import { useBeliefs, getBeliefTitle } from '@/hooks/useBeliefs';
import { SPHERES, SPHERE_MAP } from '@/constants/spheres';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import {
  todayISO,
  dateISO,
  formatDisplayDate,
  getWeekDates,
  DAY_LABELS_SHORT,
} from '@/utils/dates';
import { Task, Goal } from '@/types';

// ─── Tab Switcher ─────────────────────────────────────────────────────────────

type TabKey = 'tasks' | 'goals';

function TabSwitcher({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const C = useTheme();
  return (
    <View style={[switcherStyles.wrap, { backgroundColor: C.surface2 }]}>
      {(['tasks', 'goals'] as TabKey[]).map((tab) => {
        const isActive = active === tab;
        return (
          <Pressable
            key={tab}
            style={[
              switcherStyles.btn,
              isActive && { backgroundColor: C.primary },
            ]}
            onPress={() => onChange(tab)}
          >
            <Text
              style={[
                switcherStyles.label,
                { color: isActive ? '#060810' : C.textSecondary },
              ]}
            >
              {tab === 'tasks' ? 'Задачі' : 'Цілі'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const switcherStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 14,
  },
});

// ─── Week Bar ─────────────────────────────────────────────────────────────────

function WeekBar({
  selectedDate,
  weekDates,
  weekCounts,
  onSelectDate,
}: {
  selectedDate: string;
  weekDates: string[];
  weekCounts: Record<string, number>;
  onSelectDate: (date: string) => void;
}) {
  const C = useTheme();

  return (
    <View style={weekBarStyles.row}>
      {weekDates.map((d, i) => {
        const isSelected = d === selectedDate;
        const count = weekCounts[d] ?? 0;
        const hasTasks = count > 0;

        return (
          <Pressable
            key={d}
            style={weekBarStyles.dayCol}
            onPress={() => onSelectDate(d)}
          >
            <Text
              style={[
                weekBarStyles.dayLetter,
                { color: isSelected ? C.text : C.textSecondary },
              ]}
            >
              {DAY_LABELS_SHORT[i]}
            </Text>
            <View
              style={[
                weekBarStyles.dot,
                { backgroundColor: hasTasks ? C.primary : C.surface3 },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const weekBarStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayLetter: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  isFocus,
  onToggle,
}: {
  task: Task;
  isFocus?: boolean;
  onToggle: (id: string) => void;
}) {
  const C = useTheme();

  return (
    <Pressable
      style={[taskCardStyles.card, { backgroundColor: C.surface2 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(task.id);
      }}
    >
      <View
        style={[
          taskCardStyles.checkbox,
          {
            borderColor: task.is_completed ? C.primary : C.border,
            backgroundColor: task.is_completed ? C.primary : 'transparent',
          },
        ]}
      >
        {task.is_completed && (
          <Icon name="Check" size={11} color="#060810" strokeWidth={2.5} />
        )}
      </View>

      <Text
        style={[
          taskCardStyles.title,
          { color: C.text },
          task.is_completed && taskCardStyles.titleDone,
        ]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {task.user_belief_id && (
        <View style={[taskCardStyles.beliefBadge, { backgroundColor: C.primaryMuted }]}>
          <Icon name="Brain" size={12} color={C.primary} />
        </View>
      )}

      {isFocus && (
        <Icon
          name="Star"
          size={16}
          color={C.primary}
          strokeWidth={0}
          fill={C.primary}
        />
      )}
    </Pressable>
  );
}

const taskCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
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
  title: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  titleDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  beliefBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
});

// ─── Tasks View ───────────────────────────────────────────────────────────────

function TasksView() {
  const C = useTheme();
  const {
    tasks,
    date,
    loading,
    weekCounts,
    fetchTasks,
    fetchWeekCounts,
    toggleTask,
    addTask,
    focusTasks,
    regularTasks,
  } = useTasks();
  const { goals, fetchGoals } = useGoals();
  const { beliefs, fetchBeliefs } = useBeliefs();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<TextInput>(null);

  const weekDates = getWeekDates(new Date(date + 'T00:00:00'));

  const loadDate = useCallback((d: string) => {
    fetchTasks(d);
    fetchWeekCounts(weekDates);
  }, [fetchTasks, fetchWeekCounts, weekDates]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks(date);
      fetchWeekCounts(weekDates);
      fetchGoals();
      fetchBeliefs();
    }, []),
  );

  const navigateDay = (offset: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    loadDate(dateISO(d));
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -60) runOnJS(navigateDay)(1);
      else if (e.translationX > 60) runOnJS(navigateDay)(-1);
    });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle.trim());
    setNewTaskTitle('');
  };

  const handleToggle = async (id: string) => {
    await toggleTask(id);
  };

  const today = todayISO();
  const displayDate = new Date(date + 'T00:00:00');
  const isToday = date === today;
  const dateLabel = isToday
    ? `Сьогодні, ${formatDisplayDate(displayDate)}`
    : formatDisplayDate(displayDate);

  const focus = focusTasks();
  const regular = regularTasks();

  return (
    <View style={{ flex: 1 }}>
      <WeekBar
        selectedDate={date}
        weekDates={weekDates}
        weekCounts={weekCounts}
        onSelectDate={loadDate}
      />

      <GestureDetector gesture={pan}>
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: Spacing.base }}
          >
            {/* Date nav */}
            <View style={tasksStyles.dateNav}>
              <Pressable onPress={() => navigateDay(-1)} hitSlop={12}>
                <Icon name="ChevronLeft" size={20} color={C.textSecondary} />
              </Pressable>
              <Text style={[tasksStyles.dateLabel, { color: C.text }]}>{dateLabel}</Text>
              <Pressable onPress={() => navigateDay(1)} hitSlop={12}>
                <Icon name="ChevronRight" size={20} color={C.textSecondary} />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                {/* Focus tasks */}
                {focus.length > 0 && (
                  <View style={tasksStyles.section}>
                    <Text style={[tasksStyles.sectionLabel, { color: C.textSecondary }]}>
                      Фокус
                    </Text>
                    {focus.map((t) => (
                      <TaskCard key={t.id} task={t} isFocus onToggle={handleToggle} />
                    ))}
                  </View>
                )}

                {/* Regular tasks */}
                {regular.length > 0 && (
                  <View style={tasksStyles.section}>
                    <Text style={[tasksStyles.sectionLabel, { color: C.textSecondary }]}>
                      Задачі
                    </Text>
                    {regular.map((t) => (
                      <TaskCard key={t.id} task={t} onToggle={handleToggle} />
                    ))}
                  </View>
                )}

                {/* Quick add */}
                <View style={[tasksStyles.quickAddCard, { backgroundColor: C.surface2 }]}>
                  <Icon name="Plus" size={18} color={C.textSecondary} />
                  <TextInput
                    ref={inputRef}
                    style={[tasksStyles.quickInput, { color: C.text }]}
                    placeholder="Нова задача..."
                    placeholderTextColor={C.textTertiary}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </GestureDetector>
    </View>
  );
}

const tasksStyles = StyleSheet.create({
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateLabel: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    textAlign: 'center',
    flex: 1,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  quickAddCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  quickInput: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    padding: 0,
  },
});

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, beliefs }: { goal: Goal; beliefs: { id: string; title: string }[] }) {
  const C = useTheme();
  const progress = goal.progress ?? 0;
  const tasks = (goal as Goal & { tasks?: Task[] }).tasks ?? [];
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.is_completed).length;

  const linkedBelief = goal.user_belief_id
    ? beliefs.find((b) => b.id === goal.user_belief_id)
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        goalCardStyles.card,
        { backgroundColor: C.surface2 },
        pressed && { opacity: 0.87, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => router.push(`/goal/${goal.id}`)}
    >
      <Text style={[goalCardStyles.title, { color: C.text }]} numberOfLines={2}>
        {goal.title}
      </Text>

      {linkedBelief && (
        <Pressable
          style={[goalCardStyles.beliefTag, { backgroundColor: C.primaryMuted }]}
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/belief/${goal.user_belief_id}`);
          }}
        >
          <Icon name="Brain" size={12} color={C.primary} />
          <Text style={[goalCardStyles.beliefTagText, { color: C.primary }]} numberOfLines={1}>
            {linkedBelief.title}
          </Text>
        </Pressable>
      )}

      {/* Progress */}
      <View style={goalCardStyles.progressRow}>
        <Text style={[goalCardStyles.progressLabel, { color: C.textSecondary }]}>
          {totalTasks > 0 ? `${doneTasks}/${totalTasks} задач` : 'Немає задач'}
        </Text>
        <Text style={[goalCardStyles.progressPct, { color: C.primary }]}>
          {progress}%
        </Text>
      </View>
      <View style={[goalCardStyles.progressBg, { backgroundColor: C.surface3 }]}>
        <View
          style={[
            goalCardStyles.progressFill,
            { width: `${progress}%` as `${number}%`, backgroundColor: C.primary },
          ]}
        />
      </View>
    </Pressable>
  );
}

const goalCardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  beliefTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  beliefTagText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    maxWidth: 180,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
  },
  progressPct: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

// ─── Goals View ───────────────────────────────────────────────────────────────

function GoalsView() {
  const C = useTheme();
  const { goals, loading, fetchGoals } = useGoals();
  const { beliefs } = useBeliefs();

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals]),
  );

  const beliefList = beliefs.map((b) => ({
    id: b.id,
    title: getBeliefTitle(b),
  }));

  const grouped = SPHERES.reduce<Record<string, Goal[]>>((acc, s) => {
    const items = goals.filter((g) => g.sphere === s.key);
    if (items.length > 0) acc[s.key] = items;
    return acc;
  }, {});

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={goalsViewStyles.scroll}
    >
      {loading && goals.length === 0 ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
      ) : (
        <>
          {Object.entries(grouped).map(([sphereKey, items]) => {
            const sphere = SPHERE_MAP[sphereKey as keyof typeof SPHERE_MAP];
            return (
              <View key={sphereKey} style={goalsViewStyles.group}>
                <Text style={[goalsViewStyles.sphereLabel, { color: C.primary }]}>
                  {sphere.nameUk}
                </Text>
                {items.map((g) => (
                  <GoalCard key={g.id} goal={g} beliefs={beliefList} />
                ))}
              </View>
            );
          })}

          <Pressable
            style={({ pressed }) => [
              goalsViewStyles.addCard,
              { borderColor: C.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push('/goal/create')}
          >
            <Icon name="Plus" size={18} color={C.primary} />
            <Text style={[goalsViewStyles.addText, { color: C.textSecondary }]}>
              Нова ціль
            </Text>
          </Pressable>

          <View style={{ height: Spacing.xxxl }} />
        </>
      )}
    </ScrollView>
  );
}

const goalsViewStyles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  group: { marginBottom: Spacing.lg },
  sphereLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  addText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const C = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('tasks');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[rootStyles.root, { backgroundColor: C.surface1 }]}>
        <View style={{ paddingTop: Spacing.base }}>
          <TabSwitcher active={activeTab} onChange={setActiveTab} />
        </View>
        {activeTab === 'tasks' ? <TasksView /> : <GoalsView />}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const rootStyles = StyleSheet.create({
  root: { flex: 1 },
});
