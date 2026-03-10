import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { Plus, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useBeliefs, getBeliefTitle, getCompletedStages } from '@/hooks/useBeliefs';
import { STAGES } from '@/constants/stages';

export default function MindsetScreen() {
  const { beliefs, loading, fetchBeliefs } = useBeliefs();

  useEffect(() => {
    fetchBeliefs();
  }, []);

  const activeBeliefs = beliefs.filter((b) => !b.completed_at);

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <Text style={S.title}>Установки</Text>
        <Pressable style={S.addButton} onPress={() => router.push('/belief/create')}>
          <Plus color="#060810" size={24} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
        <Text style={S.subtitle}>
          Це не афірмації. Це база твоєї нової реальності. Кожна установка проходить 6 етапів трансформації.
        </Text>

        {activeBeliefs.map((belief) => {
          const completedCount = getCompletedStages(belief);
          const progress = Math.round((completedCount / 6) * 100);
          const stageName = STAGES[Math.max(0, belief.current_stage - 1)]?.nameUk ?? '';

          return (
            <Pressable
              key={belief.id}
              style={S.card}
              onPress={() => router.push(`/belief/${belief.id}`)}
            >
              <View style={S.cardTop}>
                <View style={S.progressRing}>
                  <Text style={S.progressPercent}>{progress}%</Text>
                </View>
                <View style={S.cardContent}>
                  <Text style={S.beliefTitle}>{getBeliefTitle(belief)}</Text>
                  <Text style={S.beliefStage}>Етап • {stageName}</Text>
                </View>
                <ChevronRight color="#A3AEC4" size={20} strokeWidth={1.5} />
              </View>
            </Pressable>
          );
        })}

        <Pressable style={S.emptyCard} onPress={() => router.push('/belief/create')}>
          <Plus color="#A3AEC4" size={32} strokeWidth={1.5} />
          <Text style={S.emptyText}>Додати нову установку</Text>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C8FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#C8FF00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressPercent: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#C8FF00',
  },
  cardContent: {
    flex: 1,
  },
  beliefTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#F9FAFF',
    marginBottom: 4,
  },
  beliefStage: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A3AEC4',
  },
  emptyCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(163, 174, 196, 0.12)',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#A3AEC4',
    marginTop: 12,
  },
});
