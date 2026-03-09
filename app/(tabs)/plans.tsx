import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Modal,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useBeliefs, getBeliefTitle } from '@/hooks/useBeliefs';
import { SPHERES, SPHERE_MAP } from '@/constants/spheres';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
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
    <View style={[switcherStyles.wrap, { backgroundColor: C.surface3 }]}>
      {(['tasks', 'goals'] as TabKey[]).map((tab) => (
        <Pressable
          key={tab}
          style={[
            switcherStyles.btn,
            active === tab && { backgroundColor: C.surface1, ...Shadow.sm },
          ]}
          onPress={() => onChange(tab)}
        >
          <Text
            style={[
              switcherStyles.label,
              { color: active === tab ? C.primary : C.textSecondary },
            ]}
          >
            {tab === 'tasks' ? 'Задачі' : 'Цілі'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const switcherStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    padding: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
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
  const today = todayISO();

  return (
    <View style={weekStyles.row}>
      {weekDates.map((d, i) => {
        const isSelected = d === selectedDate;
        const isToday = d === today;
        const count = weekCounts[d] ?? 0;
        const dayNum = new Date(d + 'T00:00:00').getDate();

        return (
          <Pressable
            key={d}
            style={weekStyles.dayCol}
            onPress={() => onSelectDate(d)}
          >
            <Text style={[weekStyles.dayLabel, { color: isSelected ? C.primary : C.textTertiary }]}>
              {DAY_LABELS_SHORT[i]}
            </Text>
            <View
              style={[
                weekStyles.dayCircle,
                isSelected && { backgroundColor: C.primary },
                !isSelected && isToday && { borderWidth: 1.5, borderColor: C.primary },
              ]}
            >
              <Text
                style={[
                  weekStyles.dayNum,
                  { color: isSelected ? '#1A1714' : isToday ? C.primary : C.text },
                ]}
              >
                {dayNum}
              </Text>
            </View>
            <View style={weekStyles.dotRow}>
              {count > 0 && Array.from({ length: Math.min(count, 3) }).map((_, di) => (
                <View
                  key={di}
                  style={[weekStyles.dot, { backgroundColor: isSelected ? C.primary : C.textTertiary }]}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const weekStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dayLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

// ─── Swipeable Task Item ──────────────────────────────────────────────────────

interface TaskItemProps {
  task: Task;
  isFocusSection?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string) => void;
  onLongPress: (task: Task) => void;
}

function SwipeableTaskItem({
  task,
  isFocusSection,
  onToggle,
  onDelete,
  onMove,
  onLongPress,
}: TaskItemProps) {
  const C = useTheme();
  const swipeRef = useRef<Swipeable>(null);

  const handleDone = () => {
    swipeRef.current?.close();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onToggle(task.id);
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onDelete(task.id);
  };

  const handleMove = () => {
    swipeRef.current?.close();
    onMove(task.id);
  };

  // Swipe RIGHT reveals Done action (on the left)
  const renderLeftActions = () => (
    <Pressable style={[taskStyles.doneAction, { backgroundColor: '#7CB392' }]} onPress={handleDone}>
      <Text style={taskStyles.actionText}>✓ Виконано</Text>
    </Pressable>
  );

  // Swipe LEFT reveals Delete/Move menu (on the right)
  const renderRightActions = () => (
    <View style={taskStyles.rightActions}>
      <Pressable style={[taskStyles.rightActionBtn, { backgroundColor: '#7BB8C9' }]} onPress={handleMove}>
        <Text style={taskStyles.actionText}>Завтра</Text>
      </Pressable>
      <Pressable style={[taskStyles.rightActionBtn, { backgroundColor: '#C47B8A' }]} onPress={handleDelete}>
        <Text style={taskStyles.actionText}>Видалити</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <Pressable
        style={[
          taskStyles.row,
          { backgroundColor: C.surface2 },
          task.is_completed && { opacity: 0.5 },
        ]}
        onLongPress={() => onLongPress(task)}
        delayLongPress={400}
      >
        {/* Focus star */}
        {isFocusSection && (
          <Text style={[taskStyles.star, { color: C.primary }]}>★</Text>
        )}

        {/* Checkbox */}
        <Pressable
          style={[
            taskStyles.checkbox,
            {
              borderColor: task.is_completed ? C.primary : C.border,
              backgroundColor: task.is_completed ? C.primary : 'transparent',
            },
          ]}
          onPress={() => onToggle(task.id)}
        >
          {task.is_completed && <Text style={taskStyles.checkmark}>✓</Text>}
        </Pressable>

        {/* Title */}
        <Text
          style={[
            taskStyles.title,
            { color: C.text },
            task.is_completed && taskStyles.titleDone,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Belief badge */}
        {task.user_belief_id && (
          <View style={[taskStyles.beliefBadge, { backgroundColor: C.primary + '20' }]}>
            <Text style={taskStyles.beliefBadgeText}>🧠</Text>
          </View>
        )}
      </Pressable>
    </Swipeable>
  );
}

const taskStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: Spacing.sm,
    borderBottomColor: 'transparent',
  },
  star: { fontSize: 14, width: 18 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#1A1714', fontSize: 12, fontWeight: '700' },
  title: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  titleDone: { textDecorationLine: 'line-through' },
  beliefBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  beliefBadgeText: { fontSize: 12 },

  doneAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  rightActions: { flexDirection: 'row' },
  rightActionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  actionText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

// ─── Edit Task Modal ──────────────────────────────────────────────────────────

function EditTaskModal({
  task,
  visible,
  onClose,
  onSave,
  goals,
  beliefs,
}: {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, data: { title: string; notes: string; is_focus: boolean; goal_id: string | null; user_belief_id: string | null }) => void;
  goals: Goal[];
  beliefs: ReturnType<typeof useBeliefs>['beliefs'];
}) {
  const C = useTheme();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isFocus, setIsFocus] = useState(false);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [beliefId, setBeliefId] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? '');
      setIsFocus(task.is_focus);
      setGoalId(task.goal_id);
      setBeliefId(task.user_belief_id);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onSave(task.id, { title, notes, is_focus: isFocus, goal_id: goalId, user_belief_id: beliefId });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={editStyles.backdrop} onPress={onClose} />
        <View style={[editStyles.sheet, { backgroundColor: C.surface2 }]}>
          <View style={[editStyles.handle, { backgroundColor: C.border }]} />
          <Text style={[editStyles.sheetTitle, { color: C.text }]}>Редагувати задачу</Text>

          <TextInput
            style={[editStyles.input, { backgroundColor: C.surface3, color: C.text, borderColor: C.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Назва задачі"
            placeholderTextColor={C.textTertiary}
          />

          <TextInput
            style={[editStyles.input, { backgroundColor: C.surface3, color: C.text, borderColor: C.border, minHeight: 70 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Нотатки..."
            placeholderTextColor={C.textTertiary}
            multiline
            textAlignVertical="top"
          />

          {/* Focus toggle */}
          <View style={[editStyles.toggleRow, { borderColor: C.border }]}>
            <Text style={[editStyles.toggleLabel, { color: C.text }]}>★ Фокус-задача</Text>
            <Switch
              value={isFocus}
              onValueChange={setIsFocus}
              trackColor={{ true: C.primary }}
              thumbColor={isFocus ? '#fff' : C.textTertiary}
            />
          </View>

          {/* Goal select */}
          <Text style={[editStyles.sectionLabel, { color: C.textSecondary }]}>Прив'язати до цілі</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={editStyles.chipScroll}>
            <Pressable
              style={[editStyles.chip, goalId === null && { borderColor: C.primary, backgroundColor: C.primary + '18' }]}
              onPress={() => setGoalId(null)}
            >
              <Text style={[editStyles.chipText, { color: goalId === null ? C.primary : C.textSecondary }]}>
                Без цілі
              </Text>
            </Pressable>
            {goals.map((g) => (
              <Pressable
                key={g.id}
                style={[editStyles.chip, goalId === g.id && { borderColor: C.primary, backgroundColor: C.primary + '18' }]}
                onPress={() => setGoalId(g.id)}
              >
                <Text style={[editStyles.chipText, { color: goalId === g.id ? C.primary : C.textSecondary }]} numberOfLines={1}>
                  {SPHERE_MAP[g.sphere]?.icon} {g.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Belief select */}
          <Text style={[editStyles.sectionLabel, { color: C.textSecondary }]}>Прив'язати до установки 🧠</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={editStyles.chipScroll}>
            <Pressable
              style={[editStyles.chip, beliefId === null && { borderColor: C.primary, backgroundColor: C.primary + '18' }]}
              onPress={() => setBeliefId(null)}
            >
              <Text style={[editStyles.chipText, { color: beliefId === null ? C.primary : C.textSecondary }]}>
                Без установки
              </Text>
            </Pressable>
            {beliefs.map((b) => (
              <Pressable
                key={b.id}
                style={[editStyles.chip, beliefId === b.id && { borderColor: C.primary, backgroundColor: C.primary + '18' }]}
                onPress={() => setBeliefId(b.id)}
              >
                <Text style={[editStyles.chipText, { color: beliefId === b.id ? C.primary : C.textSecondary }]} numberOfLines={1}>
                  🧠 {getBeliefTitle(b)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [
              editStyles.saveBtn,
              { backgroundColor: C.primary },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleSave}
          >
            <Text style={[editStyles.saveBtnText, { color: C.surface1 }]}>Зберегти</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const editStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.base,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  input: {
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    padding: Spacing.md,
    fontFamily: FontFamily.sans,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  toggleLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginRight: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  chipText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 150,
  },
  saveBtn: {
    paddingVertical: 13,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  saveBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    fontWeight: '700',
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
    updateTask,
    deleteTask,
    moveToTomorrow,
    focusTasks,
    regularTasks,
    overdueTasks,
  } = useTasks();
  const { goals, fetchGoals } = useGoals();
  const { beliefs, fetchBeliefs } = useBeliefs();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Current week dates
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

  // PanGesture for day swipe
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

  const handleEditSave = (id: string, data: Parameters<typeof updateTask>[1]) => {
    updateTask(id, data);
  };

  const today = todayISO();
  const displayDate = new Date(date + 'T00:00:00');
  const isToday = date === today;
  const dateLabel = isToday
    ? `Сьогодні, ${formatDisplayDate(displayDate)}`
    : formatDisplayDate(displayDate);

  const focus = focusTasks();
  const regular = regularTasks();
  const overdue = overdueTasks();

  return (
    <View style={{ flex: 1 }}>
      {/* Week Bar */}
      <WeekBar
        selectedDate={date}
        weekDates={weekDates}
        weekCounts={weekCounts}
        onSelectDate={loadDate}
      />

      {/* Edit modal */}
      <EditTaskModal
        task={editTask}
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        onSave={handleEditSave}
        goals={goals}
        beliefs={beliefs}
      />

      <GestureDetector gesture={pan}>
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {/* Date header */}
            <View style={tasksStyles.dateHeader}>
              <Pressable style={tasksStyles.arrowBtn} onPress={() => navigateDay(-1)}>
                <Text style={[tasksStyles.arrow, { color: C.textSecondary }]}>‹</Text>
              </Pressable>
              <Text style={[tasksStyles.dateLabel, { color: C.text }]}>{dateLabel}</Text>
              <Pressable style={tasksStyles.arrowBtn} onPress={() => navigateDay(1)}>
                <Text style={[tasksStyles.arrow, { color: C.textSecondary }]}>›</Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                {/* Overdue */}
                {overdue.length > 0 && (
                  <View style={tasksStyles.section}>
                    <View style={tasksStyles.sectionHeader}>
                      <View style={[tasksStyles.overdueTag, { backgroundColor: '#C47B8A22' }]}>
                        <Text style={[tasksStyles.overdueTagText, { color: '#C47B8A' }]}>
                          Прострочено
                        </Text>
                      </View>
                    </View>
                    {overdue.map((t) => (
                      <SwipeableTaskItem
                        key={t.id}
                        task={t}
                        onToggle={handleToggle}
                        onDelete={deleteTask}
                        onMove={moveToTomorrow}
                        onLongPress={(task) => { setEditTask(task); setShowEdit(true); }}
                      />
                    ))}
                  </View>
                )}

                {/* Focus */}
                {focus.length > 0 && (
                  <View style={tasksStyles.section}>
                    <View style={tasksStyles.sectionHeader}>
                      <Text style={[tasksStyles.sectionTitle, { color: C.textSecondary }]}>
                        Фокус
                      </Text>
                      <Text style={[tasksStyles.sectionCount, { color: C.textTertiary }]}>
                        {focus.filter((t) => t.is_completed).length}/{focus.length}
                      </Text>
                    </View>
                    <View style={[tasksStyles.sectionCard, { backgroundColor: C.surface2, ...Shadow.sm }]}>
                      {focus.map((t) => (
                        <SwipeableTaskItem
                          key={t.id}
                          task={t}
                          isFocusSection
                          onToggle={handleToggle}
                          onDelete={deleteTask}
                          onMove={moveToTomorrow}
                          onLongPress={(task) => { setEditTask(task); setShowEdit(true); }}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Regular */}
                {regular.length > 0 && (
                  <View style={tasksStyles.section}>
                    <View style={tasksStyles.sectionHeader}>
                      <Text style={[tasksStyles.sectionTitle, { color: C.textSecondary }]}>
                        Задачі
                      </Text>
                    </View>
                    <View style={[tasksStyles.sectionCard, { backgroundColor: C.surface2, ...Shadow.sm }]}>
                      {regular.map((t) => (
                        <SwipeableTaskItem
                          key={t.id}
                          task={t}
                          onToggle={handleToggle}
                          onDelete={deleteTask}
                          onMove={moveToTomorrow}
                          onLongPress={(task) => { setEditTask(task); setShowEdit(true); }}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {focus.length === 0 && regular.length === 0 && overdue.length === 0 && (
                  <View style={tasksStyles.emptyWrap}>
                    <Text style={tasksStyles.emptyEmoji}>📋</Text>
                    <Text style={[tasksStyles.emptyText, { color: C.textSecondary }]}>
                      Задач немає. Додайте першу!
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </GestureDetector>

      {/* Quick add — always visible */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[tasksStyles.quickAdd, { backgroundColor: C.surface2, borderTopColor: C.border }]}>
          <TextInput
            ref={inputRef}
            style={[tasksStyles.quickInput, { backgroundColor: C.surface3, color: C.text }]}
            placeholder="Нова задача..."
            placeholderTextColor={C.textTertiary}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <Pressable
            style={({ pressed }) => [
              tasksStyles.quickBtn,
              { backgroundColor: C.primary },
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleAddTask}
          >
            <Text style={[tasksStyles.quickBtnText, { color: C.surface1 }]}>+</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const tasksStyles = StyleSheet.create({
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  arrowBtn: { padding: Spacing.sm },
  arrow: { fontFamily: FontFamily.sans, fontSize: 24, fontWeight: '300' },
  dateLabel: {
    fontFamily: FontFamily.serif,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },

  section: { marginBottom: Spacing.base },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '500',
  },
  sectionCard: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  overdueTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  overdueTagText: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { fontFamily: FontFamily.sans, fontSize: 15 },

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
  quickBtnText: {
    fontSize: 22,
    fontWeight: '300',
  },
});

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal }: { goal: Goal }) {
  const C = useTheme();
  const sphere = SPHERE_MAP[goal.sphere];
  const progress = goal.progress ?? 0;
  const tasks = (goal as Goal & { tasks?: Task[] }).tasks ?? [];
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.is_completed).length;

  return (
    <Pressable
      style={({ pressed }) => [
        goalCardStyles.card,
        { backgroundColor: C.surface2, shadowColor: C.shadow },
        pressed && { opacity: 0.87, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => router.push(`/goal/${goal.id}`)}
    >
      {/* Top row */}
      <View style={goalCardStyles.topRow}>
        <View style={[goalCardStyles.sphereIcon, { backgroundColor: sphere?.color + '22' }]}>
          <Text style={goalCardStyles.sphereEmoji}>{sphere?.icon}</Text>
        </View>
        <Text style={[goalCardStyles.title, { color: C.text }]} numberOfLines={2}>
          {goal.title}
        </Text>

        {/* Belief badge */}
        {goal.user_belief_id && (
          <Pressable
            style={[goalCardStyles.beliefBtn, { backgroundColor: C.primary + '18' }]}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/belief/${goal.user_belief_id}`);
            }}
          >
            <Text style={[goalCardStyles.beliefBtnText, { color: C.primary }]}>🧠</Text>
          </Pressable>
        )}
      </View>

      {/* Progress bar */}
      <View style={[goalCardStyles.progressBg, { backgroundColor: C.surface3 }]}>
        <View
          style={[
            goalCardStyles.progressFill,
            { width: `${progress}%` as `${number}%`, backgroundColor: sphere?.color ?? C.primary },
          ]}
        />
      </View>

      {/* Footer */}
      <View style={goalCardStyles.footer}>
        <Text style={[goalCardStyles.footerText, { color: C.textSecondary }]}>
          {totalTasks > 0 ? `${doneTasks}/${totalTasks} задач` : 'Немає задач'}
        </Text>
        <Text style={[goalCardStyles.progressPct, { color: sphere?.color ?? C.primary }]}>
          {progress}%
        </Text>
      </View>
    </Pressable>
  );
}

const goalCardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sphereIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereEmoji: { fontSize: 20 },
  title: {
    flex: 1,
    fontFamily: FontFamily.serif,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  beliefBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  beliefBtnText: { fontSize: 14 },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
  },
  progressPct: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
  },
});

// ─── Goals View ───────────────────────────────────────────────────────────────

function GoalsView() {
  const C = useTheme();
  const { goals, loading, fetchGoals } = useGoals();

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals]),
  );

  // Group by sphere
  const grouped = SPHERES.reduce<Record<string, Goal[]>>((acc, s) => {
    const items = goals.filter((g) => g.sphere === s.key);
    if (items.length > 0) acc[s.key] = items;
    return acc;
  }, {});

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={goalsStyles.scroll}>
      {loading && goals.length === 0 ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
      ) : (
        <>
          {Object.entries(grouped).map(([sphereKey, items]) => {
            const sphere = SPHERE_MAP[sphereKey as keyof typeof SPHERE_MAP];
            return (
              <View key={sphereKey} style={goalsStyles.group}>
                <View style={goalsStyles.groupHeader}>
                  <Text style={goalsStyles.groupEmoji}>{sphere.icon}</Text>
                  <Text style={[goalsStyles.groupName, { color: C.textSecondary }]}>
                    {sphere.nameUk}
                  </Text>
                </View>
                {items.map((g) => <GoalCard key={g.id} goal={g} />)}
              </View>
            );
          })}

          {/* Add goal card */}
          <Pressable
            style={({ pressed }) => [
              goalsStyles.addCard,
              { borderColor: C.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push('/goal/create')}
          >
            <Text style={[goalsStyles.addPlus, { color: C.primary }]}>＋</Text>
            <Text style={[goalsStyles.addText, { color: C.textSecondary }]}>Нова ціль</Text>
          </Pressable>

          {goals.length === 0 && (
            <View style={goalsStyles.emptyWrap}>
              <Text style={goalsStyles.emptyEmoji}>🎯</Text>
              <Text style={[goalsStyles.emptyTitle, { color: C.text }]}>
                Ще немає цілей
              </Text>
              <Text style={[goalsStyles.emptyBody, { color: C.textSecondary }]}>
                Додайте перший великий контейнер і декомпозуйте його на задачі.
              </Text>
            </View>
          )}

          <View style={{ height: Spacing.xxxl }} />
        </>
      )}
    </ScrollView>
  );
}

const goalsStyles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  group: { marginBottom: Spacing.base },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  groupEmoji: { fontSize: 16 },
  groupName: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
  addPlus: { fontFamily: FontFamily.serif, fontSize: 22 },
  addText: { fontFamily: FontFamily.sans, fontSize: 14, fontWeight: '500' },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.base },
  emptyTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const C = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('tasks');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Plans</Text>
          {activeTab === 'goals' && (
            <Pressable
              style={({ pressed }) => [
                styles.headerAddBtn,
                { backgroundColor: C.primary + '18' },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => router.push('/goal/create')}
            >
              <Text style={[styles.headerAddText, { color: C.primary }]}>＋ Ціль</Text>
            </Pressable>
          )}
        </View>

        <TabSwitcher active={activeTab} onChange={setActiveTab} />

        {activeTab === 'tasks' ? <TasksView /> : <GoalsView />}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerAddBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  headerAddText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
  },
});
