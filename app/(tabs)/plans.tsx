import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Check, Plus, Target } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { todayISO } from '@/utils/dates';

export default function PlansScreen() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'goals'>('tasks');
  const [newTaskText, setNewTaskText] = useState('');

  const { tasks, loading: tasksLoading, fetchTasks, toggleTask, addTask } = useTasks();
  const { goals, loading: goalsLoading, fetchGoals } = useGoals();

  useEffect(() => {
    fetchTasks();
    fetchGoals();
  }, []);

  const handleToggleTask = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleTask(id);
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    await addTask(newTaskText.trim());
    setNewTaskText('');
  };

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <Text style={S.title}>Плани</Text>
        <Pressable
          style={S.addButton}
          onPress={() => {
            if (activeTab === 'goals') router.push('/goal/create');
          }}
        >
          <Plus color="#060810" size={20} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={S.tabs}>
        <Pressable
          style={[S.tab, activeTab === 'tasks' && S.tabActive]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[S.tabText, activeTab === 'tasks' && S.tabTextActive]}>Задачі</Text>
        </Pressable>
        <Pressable
          style={[S.tab, activeTab === 'goals' && S.tabActive]}
          onPress={() => setActiveTab('goals')}
        >
          <Text style={[S.tabText, activeTab === 'goals' && S.tabTextActive]}>Цілі</Text>
        </Pressable>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
        {activeTab === 'tasks' && (
          <>
            {tasksLoading ? (
              <ActivityIndicator color="#C8FF00" style={{ marginTop: 40 }} />
            ) : (
              <>
                {tasks.map((task) => (
                  <Pressable
                    key={task.id}
                    style={S.taskCard}
                    onPress={() => handleToggleTask(task.id)}
                  >
                    <View style={[S.checkbox, task.is_completed && S.checkboxCompleted]}>
                      {task.is_completed && <Check color="#060810" size={16} strokeWidth={2} />}
                    </View>
                    <Text style={[S.taskText, task.is_completed && S.taskTextCompleted]}>
                      {task.title}
                    </Text>
                    {task.is_focus && !task.is_completed && <View style={S.priorityDot} />}
                  </Pressable>
                ))}

                <View style={S.addTaskCard}>
                  <Plus color="#A3AEC4" size={20} strokeWidth={1.5} />
                  <TextInput
                    style={S.addTaskInput}
                    placeholder="Додати задачу"
                    placeholderTextColor="#A3AEC4"
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                  />
                </View>
              </>
            )}
          </>
        )}

        {activeTab === 'goals' && (
          <>
            {goalsLoading ? (
              <ActivityIndicator color="#C8FF00" style={{ marginTop: 40 }} />
            ) : (
              <>
                {goals.map((goal) => {
                  const totalTasks = (goal.tasks ?? []).length;
                  const doneTasks = (goal.tasks ?? []).filter((t) => t.is_completed).length;
                  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                  return (
                    <Pressable
                      key={goal.id}
                      style={S.goalCard}
                      onPress={() => router.push(`/goal/${goal.id}`)}
                    >
                      <View style={S.goalHeader}>
                        <View style={S.goalIcon}>
                          <Target color="#C8FF00" size={20} strokeWidth={1.5} />
                        </View>
                        <View style={S.goalContent}>
                          <Text style={S.goalTitle}>{goal.title}</Text>
                          {goal.due_date && (
                            <Text style={S.goalDeadline}>
                              Дедлайн: {new Date(goal.due_date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={S.progressSection}>
                        <View style={S.progressBar}>
                          <View style={[S.progressFill, { width: `${progress}%` as `${number}%` }]} />
                        </View>
                        <Text style={S.progressText}>
                          {doneTasks}/{totalTasks} задач • {progress}%
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}

                <Pressable style={S.addGoalCard} onPress={() => router.push('/goal/create')}>
                  <Plus color="#A3AEC4" size={24} strokeWidth={1.5} />
                  <Text style={S.addGoalText}>Нова ціль</Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060810',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 174, 196, 0.12)',
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.5,
    color: '#F9FAFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C8FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#A3AEC4',
  },
  tabTextActive: {
    color: '#C8FF00',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(163, 174, 196, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#C8FF00',
    borderColor: '#C8FF00',
  },
  taskText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#F9FAFF',
  },
  taskTextCompleted: {
    color: '#A3AEC4',
    textDecorationLine: 'line-through',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8FF00',
  },
  addTaskCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(163, 174, 196, 0.12)',
    borderStyle: 'dashed',
  },
  addTaskInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#F9FAFF',
  },
  goalCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#F9FAFF',
    marginBottom: 4,
  },
  goalDeadline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A3AEC4',
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(163, 174, 196, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#C8FF00',
  },
  progressText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A3AEC4',
  },
  addGoalCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(163, 174, 196, 0.12)',
    borderStyle: 'dashed',
  },
  addGoalText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#A3AEC4',
    marginTop: 12,
  },
});
