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
import { RingProgress } from '@/components/charts/RingProgress';
import { CATEGORY_MAP } from '@/constants/categories';
import { STAGE_COLORS } from '@/constants/stages';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { UserBelief } from '@/types';

// ─── Belief Card ─────────────────────────────────────────────────────────────

function BeliefCard({ ub }: { ub: UserBelief }) {
  const C = useTheme();
  const title = getBeliefTitle(ub);
  const catKey = getBeliefCategory(ub);
  const cat = catKey ? CATEGORY_MAP[catKey] : null;
  const completed = getCompletedStages(ub);
  const catColor = catKey ? (STAGE_COLORS as Record<string, string>)[catKey] ?? C.primary : C.primary;

  const conviction = ub.belief_id && ub.belief
    ? ub.belief.conviction_uk
    : ub.custom_conviction ?? '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: C.surface2, shadowColor: C.shadow },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={() => router.push(`/belief/${ub.id}`)}
    >
      {/* Left: Ring */}
      <View style={styles.cardRing}>
        <RingProgress
          progress={completed}
          color={catColor}
          size={64}
          strokeWidth={5}
          animated={false}
        />
        <Text style={styles.ringLabel}>{completed}/6</Text>
      </View>

      {/* Right: Content */}
      <View style={styles.cardContent}>
        {/* Top row */}
        <View style={styles.cardTopRow}>
          {cat && (
            <View style={[styles.catBadge, { backgroundColor: catColor + '22' }]}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catName, { color: catColor }]}>{cat.nameUk}</Text>
            </View>
          )}
          <View style={[styles.scoreBadge, { backgroundColor: C.surface3 }]}>
            <Text style={[styles.scoreText, { color: C.textSecondary }]}>{ub.score}/10</Text>
          </View>
        </View>

        {/* Belief title */}
        <Text style={[styles.beliefTitle, { color: C.text }]} numberOfLines={2}>
          «{title}»
        </Text>

        {/* Conviction */}
        {!!conviction && (
          <Text style={[styles.conviction, { color: C.textSecondary }]} numberOfLines={2}>
            {conviction}
          </Text>
        )}

        {/* Stage indicator */}
        <View style={styles.stageRow}>
          <View style={[styles.stageDot, { backgroundColor: catColor }]} />
          <Text style={[styles.stageLabel, { color: C.textTertiary }]}>
            Етап {ub.current_stage}/6
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const C = useTheme();
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyEmoji}>🧠</Text>
      <Text style={[styles.emptyTitle, { color: C.text }]}>
        Немає активних установок
      </Text>
      <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
        Пройдіть діагностику, щоб виявити установки, що стримують ваш бізнес.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.diagnosticBtn,
          { backgroundColor: C.primary },
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => router.push('/onboarding/diagnostic')}
      >
        <Text style={[styles.diagnosticBtnText, { color: C.surface1 }]}>
          Пройти діагностику
        </Text>
      </Pressable>
    </View>
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
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text }]}>Mindset</Text>
          {beliefs.length > 0 && (
            <Text style={[styles.headerSub, { color: C.textSecondary }]}>
              {beliefs.length} активн{beliefs.length === 1 ? 'а' : 'их'} установк{beliefs.length === 1 ? 'а' : 'и'}
            </Text>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.headerBtn,
            { backgroundColor: C.primary + '18' },
            pressed && { opacity: 0.75 },
          ]}
          onPress={() => router.push('/belief/create')}
        >
          <Text style={[styles.headerBtnText, { color: C.primary }]}>＋ Додати</Text>
        </Pressable>
      </View>

      {loading && beliefs.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {beliefs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {beliefs.map((ub) => (
                <BeliefCard key={ub.id} ub={ub} />
              ))}
            </>
          )}

          {/* Add custom belief card — always at bottom when there are beliefs */}
          {beliefs.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.addCard,
                { borderColor: C.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.push('/belief/create')}
            >
              <Text style={[styles.addPlus, { color: C.primary }]}>＋</Text>
              <Text style={[styles.addText, { color: C.textSecondary }]}>
                Додати свою установку
              </Text>
            </Pressable>
          )}

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    marginTop: 2,
  },
  headerBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
  },
  headerBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scroll: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
  },

  // Belief card
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadow.sm,
  },
  cardRing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[4],
  },
  ringLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    color: '#888',
  },
  cardContent: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  catIcon: { fontSize: 12 },
  catName: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  scoreText: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  beliefTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: Spacing[1],
  },
  conviction: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: Spacing[2],
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '500',
  },

  // Add card
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: Spacing[5],
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  addPlus: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
  },
  addText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[8],
  },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing[4] },
  emptyTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  emptyBody: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },
  diagnosticBtn: {
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[4],
    borderRadius: Radius.md,
  },
  diagnosticBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
  },
});
