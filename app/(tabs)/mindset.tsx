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
import { Plus, X } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useBeliefs, getBeliefTitle, getCompletedStages } from '@/hooks/useBeliefs';
import { STAGES } from '@/constants/stages';

export default function MindsetScreen() {
  const { beliefs, loading, fetchBeliefs, createCustomBelief } = useBeliefs();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBeliefs();
  }, []);

  const activeBeliefs = beliefs.filter((b) => !b.completed_at);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await createCustomBelief({ belief: text.trim(), conviction: text.trim(), score: 7 });
      setText('');
      setAdding(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <Text style={S.title}>Установки</Text>
        <Pressable style={S.addCircle} onPress={() => setAdding(true)}>
          <Plus size={22} color="#060810" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
        <Text style={S.subtitle}>
          Це не афірмації. Це база твоєї нової реальності. Кожна установка проходить 6 етапів трансформації.
        </Text>

        {adding && (
          <View style={S.addCard}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Нова установка..."
              placeholderTextColor="rgba(163, 174, 196, 0.4)"
              style={S.addInput}
              autoFocus
            />
            <View style={S.addActions}>
              <Pressable
                style={[S.addConfirmBtn, !text.trim() && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={!text.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#060810" size="small" />
                ) : (
                  <Text style={S.addConfirmText}>Додати</Text>
                )}
              </Pressable>
              <Pressable
                style={S.addCancelBtn}
                onPress={() => { setText(''); setAdding(false); }}
              >
                <Text style={S.addCancelText}>Скасувати</Text>
              </Pressable>
            </View>
          </View>
        )}

        {activeBeliefs.length === 0 && !adding && (
          <Pressable style={S.emptyCard} onPress={() => setAdding(true)}>
            <Plus size={28} color="rgba(255,255,255,0.15)" strokeWidth={2} />
            <Text style={S.emptyText}>Додати нову установку</Text>
          </Pressable>
        )}

        {activeBeliefs.map((belief) => {
          const completedCount = getCompletedStages(belief);
          const stageInfo = STAGES.find((s) => s.index === belief.current_stage);
          const stageName = stageInfo?.nameUk ?? '';

          return (
            <Pressable
              key={belief.id}
              style={S.card}
              onPress={() => router.push(`/belief/${belief.id}`)}
            >
              <View style={S.cardTop}>
                <Text style={S.beliefText} numberOfLines={2}>
                  {getBeliefTitle(belief)}
                </Text>
                <Pressable
                  style={S.removeBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    router.push(`/belief/${belief.id}`);
                  }}
                  hitSlop={8}
                >
                  <X size={16} color="rgba(255,255,255,0.2)" strokeWidth={2} />
                </Pressable>
              </View>

              <View style={S.stageRow}>
                <Text style={S.stageName}>{stageName}</Text>
                <Text style={S.stageNum}>Етап {belief.current_stage}/6</Text>
              </View>

              <View style={S.segBar}>
                {STAGES.map((stage, si) => (
                  <View
                    key={si}
                    style={[
                      S.seg,
                      si < completedCount
                        ? S.segDone
                        : si === completedCount && belief.current_stage === stage.index
                        ? S.segCurrent
                        : S.segEmpty,
                    ]}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
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
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  subtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22,
    color: '#A3AEC4', marginBottom: 20,
  },

  addCard: {
    backgroundColor: '#0B0F18', borderRadius: 16, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(200,255,0,0.2)',
  },
  addInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, padding: 12,
    fontFamily: 'Inter_500Medium', fontSize: 15, color: '#F9FAFF',
  },
  addActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  addConfirmBtn: {
    flex: 1, paddingVertical: 11, backgroundColor: '#C8FF00',
    borderRadius: 10, alignItems: 'center',
  },
  addConfirmText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#060810' },
  addCancelBtn: {
    paddingVertical: 11, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, alignItems: 'center',
  },
  addCancelText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#F9FAFF' },

  emptyCard: {
    marginTop: 24,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, paddingVertical: 44, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: 'rgba(255,255,255,0.25)', marginTop: 10 },

  card: {
    backgroundColor: '#0B0F18', borderRadius: 16, padding: 18,
    marginTop: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  beliefText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#F9FAFF', flex: 1, lineHeight: 22 },
  removeBtn: { paddingLeft: 12 },

  stageRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  stageName: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#C8FF00' },
  stageNum: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.25)' },

  segBar: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 5, borderRadius: 3 },
  segDone: { backgroundColor: '#C8FF00' },
  segCurrent: { backgroundColor: 'rgba(200,255,0,0.4)' },
  segEmpty: { backgroundColor: 'rgba(255,255,255,0.08)' },
});
