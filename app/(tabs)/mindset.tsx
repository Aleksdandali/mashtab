import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import {
  useBeliefs,
  getBeliefTitle,
  getBeliefCategory,
  getCompletedStages,
} from '@/hooks/useBeliefs';
import { Icon } from '@/components/ui/Icon';
import { FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { UserBelief } from '@/types';

// ─── Stage name map ────────────────────────────────────────────────────────────

const STAGE_NAMES: Record<number, string> = {
  1: 'Усвідомлення',
  2: 'Розуміння',
  3: 'Прийняття',
  4: 'Інтеграція',
  5: 'Практика',
  6: 'Ідентичність',
};

// ─── Belief Card ──────────────────────────────────────────────────────────────

function BeliefCard({ ub }: { ub: UserBelief }) {
  const C = useTheme();
  const title = getBeliefTitle(ub);
  const completed = getCompletedStages(ub);
  const progress = Math.round((completed / 6) * 100);
  const stageNum = ub.current_stage ?? 1;
  const stageName = STAGE_NAMES[stageNum] ?? 'Усвідомлення';

  return (
    <Pressable
      style={({ pressed }) => [
        S.card,
        { backgroundColor: C.surface1 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={() => router.push(`/belief/${ub.id}`)}
    >
      <View style={S.cardRow}>
        {/* Progress ring */}
        <View style={[S.progressRing, { borderColor: C.primary }]}>
          <Text style={[S.progressRingText, { color: C.primary }]}>{progress}%</Text>
        </View>

        {/* Content */}
        <View style={S.cardContent}>
          <Text style={[S.beliefTitle, { color: C.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[S.beliefStage, { color: C.textSecondary }]}>
            Етап {stageNum} · {stageName}
          </Text>
        </View>

        <Icon name="ChevronRight" size={20} color={C.textSecondary} />
      </View>
    </Pressable>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const C = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        S.emptyCard,
        { backgroundColor: C.surface1, borderColor: C.border },
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => router.push('/belief/create')}
    >
      <Icon name="Plus" size={32} color={C.textSecondary} />
      <Text style={[S.emptyText, { color: C.textSecondary }]}>Додати нову установку</Text>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MindsetScreen() {
  const C = useTheme();
  const { beliefs, loading, fetchBeliefs } = useBeliefs();

  useFocusEffect(
    useCallback(() => {
      fetchBeliefs();
    }, [fetchBeliefs]),
  );

  return (
    <SafeAreaView style={[S.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[S.header, { borderBottomColor: C.border }]}>
        <View style={S.headerLeft}>
          <Text style={[S.headerTitle, { color: C.text }]}>Установки</Text>
          <Text style={[S.headerSubtitle, { color: C.textSecondary }]}>
            Це не афірмації. Це база твоєї нової реальності.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/belief/create')}
          style={({ pressed }) => [
            S.addButton,
            { backgroundColor: C.primary },
            pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Icon name="Plus" size={24} color="#060810" />
        </Pressable>
      </View>

      {loading && beliefs.length === 0 ? (
        <View style={S.loader}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={S.scroll}
          showsVerticalScrollIndicator={false}
        >
          {beliefs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {beliefs.map((ub) => (
                <BeliefCard key={ub.id} ub={ub} />
              ))}

              <Pressable
                style={({ pressed }) => [
                  S.addCard,
                  { borderColor: C.border },
                  pressed && { opacity: 0.7, borderColor: 'rgba(200,255,0,0.3)' },
                ]}
                onPress={() => router.push('/belief/create')}
              >
                <Icon name="Plus" size={32} color={C.textSecondary} />
                <Text style={[S.addCardText, { color: C.textSecondary }]}>
                  Додати нову установку
                </Text>
              </Pressable>
            </>
          )}
          <View style={{ height: 16 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1, paddingRight: 16 },
  headerTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scroll: { paddingHorizontal: Spacing.screen, paddingTop: 16, gap: 12 },

  // Belief card
  card: {
    borderRadius: 16,
    padding: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  progressRingText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
  },
  cardContent: { flex: 1 },
  beliefTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    lineHeight: 23,
    marginBottom: 4,
  },
  beliefStage: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
  },

  // Add card (dashed)
  addCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    marginTop: 12,
  },

  // Empty state (same as addCard)
  emptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    marginTop: 12,
  },
});
