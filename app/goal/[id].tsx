import { useState, useRef, useEffect, useCallback } from 'react';
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
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useGoals } from '@/hooks/useGoals';
import { useBeliefs, getBeliefTitle } from '@/hooks/useBeliefs';
import { supabase } from '@/lib/supabase';
import { SPHERE_MAP } from '@/constants/spheres';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { todayISO } from '@/utils/dates';
import { Goal, Task } from '@/types';

// ─── Task Row ─────────────────────────────────────────────────────────────────

function GoalTaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const C = useTheme();
  const swipeRef = useRef<Swipeable>(null);

  const handleToggle = () => {
    swipeRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(task.id);
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onDelete(task.id);
  };

  const renderLeftActions = () => (
    <Pressable
      style={[itemStyles.doneAction, { backgroundColor: '#7CB392' }]}
      onPress={handleToggle}
    >
      <Icon name="Check" size={20} color="#fff" strokeWidth={2.5} />
    </Pressable>
  );

  const renderRightActions = () => (
    <Pressable
      style={[itemStyles.deleteAction, { backgroundColor: '#C47B8A' }]}
      onPress={handleDelete}
    >
      <Text style={itemStyles.actionText}>Видалити</Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <View
        style={[
          itemStyles.row,
          { backgroundColor: C.surface2 },
          task.is_completed && { opacity: 0.5 },
        ]}
      >
        <Pressable
          style={[
            itemStyles.checkbox,
            {
              borderColor: task.is_completed ? C.primary : C.border,
              backgroundColor: task.is_completed ? C.primary : 'transparent',
            },
          ]}
          onPress={() => onToggle(task.id)}
        >
          {task.is_completed && <Icon name="Check" size={11} color="#050608" strokeWidth={2.5} />}
        </Pressable>
        <Text
          style={[
            itemStyles.title,
            { color: C.text },
            task.is_completed && itemStyles.titleDone,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        {task.is_focus && <Icon name="Zap" size={14} color={C.primary} />}
      </View>
    </Swipeable>
  );
}

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#1A1714', fontSize: 12, fontWeight: '700' },
  title: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  titleDone: { textDecorationLine: 'line-through' },
  star: { fontSize: 13 },
  doneAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  actionText: { fontFamily: FontFamily.sans, fontSize: 13, fontWeight: '600', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const C = useTheme();
  const { goals } = useGoals();
  const { beliefs } = useBeliefs();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const linkedBelief = goal?.user_belief_id
    ? beliefs.find((b) => b.id === goal.user_belief_id)
    : null;

  const fetchGoalData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    // Try store first
    const cached = goals.find((g) => g.id === id);

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', id)
      .order('sort_order', { ascending: true });

    if (cached) {
      setGoal({ ...cached, tasks: taskData ?? [] });
    } else {
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single();
      if (goalData) setGoal({ ...goalData, tasks: taskData ?? [] });
    }

    setTasks(taskData ?? []);
    setLoading(false);
  }, [id, goals]);

  useFocusEffect(
    useCallback(() => {
      fetchGoalData();
    }, [fetchGoalData]),
  );

  const handleToggle = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newCompleted = !task.is_completed;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : t,
      ),
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await supabase
      .from('tasks')
      .update({ is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null })
      .eq('id', taskId);
  };

  const handleDelete = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        goal_id: id,
        title: newTaskTitle.trim(),
        date: todayISO(),
        is_focus: false,
        sort_order: tasks.length,
      })
      .select()
      .single();

    if (data) {
      setTasks((prev) => [...prev, data]);
      setNewTaskTitle('');
    }
  };

  if (loading && !goal) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
        <ActivityIndicator color={C.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: C.textSecondary }]}>← Назад</Text>
        </Pressable>
        <Text style={[styles.notFound, { color: C.textSecondary }]}>Ціль не знайдено</Text>
      </SafeAreaView>
    );
  }

  const sphere = SPHERE_MAP[goal.sphere];
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.is_completed).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* Back */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: C.textSecondary }]}>← Назад</Text>
          </Pressable>

          {/* Header */}
          <View style={[styles.header, { backgroundColor: C.surface2, ...Shadow.sm }]}>
            {/* Sphere + period */}
            <View style={styles.headerMeta}>
              <View style={[styles.sphereIcon, { backgroundColor: sphere?.color + '22' }]}>
                {sphere && <Icon name={sphere.icon} size={18} color={sphere.color} />}
              </View>
              <View style={[styles.periodBadge, { backgroundColor: C.surface3 }]}>
                <Text style={[styles.periodText, { color: C.textSecondary }]}>
                  {goal.period === 'year' ? 'Рік' : 'Квартал'}
                </Text>
              </View>
              {goal.due_date && (
                <Text style={[styles.dueDate, { color: C.textTertiary }]}>
                  до {new Date(goal.due_date + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                </Text>
              )}
            </View>

            {/* Title */}
            <Text style={[styles.goalTitle, { color: C.text }]}>{goal.title}</Text>

            {/* Belief link */}
            {linkedBelief && (
              <Pressable
                style={[styles.beliefLink, { backgroundColor: C.primary + '18', borderColor: C.primary + '40', flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                onPress={() => router.push(`/belief/${linkedBelief.id}`)}
              >
                <Icon name="Brain" size={14} color={C.primary} />
                <Text style={[styles.beliefLinkText, { color: C.primary }]}>
                  Пов'язана установка: «{getBeliefTitle(linkedBelief)}»
                </Text>
              </Pressable>
            )}

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: C.textSecondary }]}>
                  Прогрес
                </Text>
                <Text style={[styles.progressPct, { color: sphere?.color ?? C.primary }]}>
                  {progress}%
                </Text>
              </View>
              <View style={[styles.progressBg, { backgroundColor: C.surface3 }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%` as `${number}%`,
                      backgroundColor: sphere?.color ?? C.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.taskCountText, { color: C.textTertiary }]}>
                {doneTasks}/{totalTasks} задач виконано
              </Text>
            </View>
          </View>

          {/* Tasks section */}
          <View style={styles.tasksSection}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Задачі</Text>

            {tasks.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: C.surface2, borderColor: C.border }]}>
                <Icon name="Plus" size={28} color={C.textTertiary} />
                <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                  Декомпозуйте: додайте конкретні кроки до цієї цілі.
                </Text>
              </View>
            ) : (
              <View style={[styles.taskList, { backgroundColor: C.surface2, ...Shadow.sm }]}>
                {tasks.map((t) => (
                  <GoalTaskItem
                    key={t.id}
                    task={t}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Quick add */}
        <View style={[styles.quickAdd, { backgroundColor: C.surface2, borderTopColor: C.border }]}>
          <TextInput
            style={[styles.quickInput, { backgroundColor: C.surface3, color: C.text }]}
            placeholder="Додати задачу до цілі..."
            placeholderTextColor={C.textTertiary}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <Pressable
            style={({ pressed }) => [
              styles.quickBtn,
              { backgroundColor: C.primary },
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleAddTask}
          >
            <Text style={[styles.quickBtnText, { color: C.surface1 }]}>+</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  backBtn: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  backText: { fontFamily: FontFamily.sans, fontSize: 14, fontWeight: '500' },

  notFound: { fontFamily: FontFamily.sans, fontSize: 15, textAlign: 'center', marginTop: 60 },

  header: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },

  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sphereIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereEmoji: { fontSize: 18 },
  periodBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  periodText: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  dueDate: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
  },

  goalTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: Spacing.md,
  },

  beliefLink: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  beliefLinkText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  progressSection: { gap: 6 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressPct: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    fontWeight: '700',
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  taskCountText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    marginTop: 2,
  },

  tasksSection: { paddingHorizontal: Spacing.base },
  sectionTitle: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },

  emptyCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  taskList: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  quickAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  quickInput: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: FontFamily.sans,
    fontSize: 14,
  },
  quickBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: { fontSize: 22, fontWeight: '300' },
});
