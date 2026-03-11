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
import { Plus, X, Check, Target } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';

export default function PlansScreen() {
  const [tab, setTab] = useState<'tasks' | 'goals'>('tasks');
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  const { tasks, loading: tasksLoading, fetchTasks, toggleTask, addTask, deleteTask } = useTasks();
  const { goals, loading: goalsLoading, fetchGoals } = useGoals();

  useEffect(() => {
    fetchTasks();
    fetchGoals();
  }, []);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSavingAdd(true);
    try {
      if (tab === 'tasks') {
        await addTask(text.trim());
      } else {
        router.push('/goal/create');
        return;
      }
      setText('');
      setAdding(false);
    } finally {
      setSavingAdd(false);
    }
  };

  const handleToggle = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleTask(id);
  };

  const handleDeleteTask = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteTask(id);
  };

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <Text style={S.title}>Плани</Text>
        <Pressable
          style={S.addCircle}
          onPress={() => tab === 'goals' ? router.push('/goal/create') : setAdding(true)}
        >
          <Plus size={22} color="#060810" strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={S.tabs}>
        {(['tasks', 'goals'] as const).map((key) => (
          <Pressable
            key={key}
            style={[S.tab, tab === key && S.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[S.tabText, tab === key && S.tabTextActive]}>
              {key === 'tasks' ? 'Задачі' : 'Цілі'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
        {tab === 'tasks' && (
          <>
            {tasksLoading ? (
              <ActivityIndicator color="#C8FF00" style={{ marginTop: 40 }} />
            ) : (
              <>
                {tasks.map((task) => (
                  <View key={task.id} style={S.item}>
                    <Pressable
                      style={[S.circleCheck, task.is_completed && S.circleCheckDone]}
                      onPress={() => handleToggle(task.id)}
                    >
                      {task.is_completed && <Check size={14} color="#060810" strokeWidth={3} />}
                    </Pressable>
                    <Text
                      style={[S.itemText, task.is_completed && S.itemTextDone]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>
                    <Pressable
                      style={S.removeBtn}
                      onPress={() => handleDeleteTask(task.id)}
                      hitSlop={8}
                    >
                      <X size={16} color="rgba(255,255,255,0.15)" strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}

                {adding ? (
                  <View style={S.inlineAdd}>
                    <TextInput
                      value={text}
                      onChangeText={setText}
                      onSubmitEditing={handleAdd}
                      placeholder="Нова задача..."
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      style={S.inlineInput}
                      autoFocus
                      returnKeyType="done"
                    />
                    <View style={S.inlineActions}>
                      <Pressable
                        style={[S.inlineConfirm, !text.trim() && { opacity: 0.5 }]}
                        onPress={handleAdd}
                        disabled={!text.trim() || savingAdd}
                      >
                        {savingAdd ? (
                          <ActivityIndicator color="#060810" size="small" />
                        ) : (
                          <Text style={S.inlineConfirmText}>Додати</Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={S.inlineCancel}
                        onPress={() => { setAdding(false); setText(''); }}
                      >
                        <Text style={S.inlineCancelText}>Скасувати</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable style={S.addRow} onPress={() => setAdding(true)}>
                    <Plus size={16} color="rgba(255,255,255,0.2)" strokeWidth={2} />
                    <Text style={S.addRowText}>Додати задачу</Text>
                  </Pressable>
                )}
              </>
            )}
          </>
        )}

        {tab === 'goals' && (
          <>
            {goalsLoading ? (
              <ActivityIndicator color="#C8FF00" style={{ marginTop: 40 }} />
            ) : (
              <>
                {goals.map((goal) => (
                  <Pressable
                    key={goal.id}
                    style={S.item}
                    onPress={() => router.push(`/goal/${goal.id}`)}
                  >
                    <View style={S.goalIconWrap}>
                      <Target size={14} color="#C8FF00" strokeWidth={2} />
                    </View>
                    <Text style={S.itemText} numberOfLines={2}>{goal.title}</Text>
                    <View style={S.removeBtn}>
                      <X size={16} color="rgba(255,255,255,0.12)" strokeWidth={2} />
                    </View>
                  </Pressable>
                ))}

                <Pressable style={S.addRow} onPress={() => router.push('/goal/create')}>
                  <Plus size={16} color="rgba(255,255,255,0.2)" strokeWidth={2} />
                  <Text style={S.addRowText}>Додати ціль</Text>
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
  container: { flex: 1, backgroundColor: '#060810' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(163, 174, 196, 0.12)',
  },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 32, letterSpacing: -0.5, color: '#F9FAFF' },
  addCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#C8FF00', alignItems: 'center', justifyContent: 'center',
  },

  tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 4 },
  tab: { paddingVertical: 9, paddingHorizontal: 22, borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(200,255,0,0.18)' },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: 'rgba(255,255,255,0.35)' },
  tabTextActive: { color: '#C8FF00' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },

  item: {
    backgroundColor: '#0B0F18', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  circleCheck: {
    width: 28, height: 28, borderRadius: 14, flexShrink: 0,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  circleCheckDone: { backgroundColor: '#C8FF00', borderColor: '#C8FF00' },
  goalIconWrap: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    backgroundColor: 'rgba(200,255,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  itemText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: '#F9FAFF', flex: 1 },
  itemTextDone: { color: 'rgba(255,255,255,0.25)', textDecorationLine: 'line-through' },
  removeBtn: { alignItems: 'center', justifyContent: 'center', padding: 4 },

  inlineAdd: {
    backgroundColor: '#0B0F18', borderRadius: 14, padding: 16,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(200,255,0,0.25)', marginTop: 4,
  },
  inlineInput: {
    fontFamily: 'Inter_500Medium', fontSize: 15, color: '#F9FAFF',
    paddingVertical: 0,
  },
  inlineActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  inlineConfirm: {
    paddingVertical: 9, paddingHorizontal: 20,
    backgroundColor: '#C8FF00', borderRadius: 9, alignItems: 'center',
  },
  inlineConfirmText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#060810' },
  inlineCancel: {
    paddingVertical: 9, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 9,
  },
  inlineCancelText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#F9FAFF' },

  addRow: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 4,
  },
  addRowText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.2)' },
});
