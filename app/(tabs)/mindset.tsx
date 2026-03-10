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
import { CATEGORY_MAP } from '@/constants/categories';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { UserBelief } from '@/types';

// ─── Belief Card ──────────────────────────────────────────────────────────────

function BeliefCard({ ub }: { ub: UserBelief }) {
  const C = useTheme();
  const title = getBeliefTitle(ub);
  const catKey = getBeliefCategory(ub);
  const cat = catKey ? CATEGORY_MAP[catKey] : null;
  const completed = getCompletedStages(ub);
  const progress = Math.round((completed / 6) * 100);

  const conviction = ub.belief_id && ub.belief
    ? `Впевненість ${progress}%`
    : `Впевненість ${progress}%`;

  return (
    <Pressable
      style={({ pressed }) => [
        S.card,
        { backgroundColor: C.surface2 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={() => router.push(`/belief/${ub.id}`)}
    >
      {/* Category label */}
      {cat && (
        <Text style={[S.catLabel, { color: C.primary }]}>
          {cat.nameUk.toUpperCase()}
        </Text>
      )}

      {/* Belief title — italic serif */}
      <Text style={[S.beliefTitle, { color: C.text }]} numberOfLines={3}>
        "{title}"
      </Text>

      {/* Conviction + progress bar */}
      <View style={S.progressWrap}>
        <Text style={[S.convictionText, { color: C.textSecondary }]}>{conviction}</Text>
      </View>
      <View style={[S.progressTrack, { backgroundColor: C.surface3 }]}>
        <View
          style={[S.progressFill, { backgroundColor: C.primary, width: `${progress}%` as `${number}%` }]}
        />
      </View>
    </Pressable>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const C = useTheme();
  return (
    <View style={S.emptyWrap}>
      <View style={[S.emptyIcon, { backgroundColor: C.primaryMuted }]}>
        <Icon name="Brain" size={32} color={C.primary} />
      </View>
      <Text style={[S.emptyTitle, { color: C.text }]}>Немає активних установок</Text>
      <Text style={[S.emptyBody, { color: C.textSecondary }]}>
        Пройдіть діагностику, щоб виявити установки, що стримують ваш бізнес.
      </Text>
      <Pressable
        style={({ pressed }) => [S.diagBtn, { backgroundColor: C.primary }, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/onboarding/diagnostic')}
      >
        <Text style={S.diagBtnText}>Пройти діагностику</Text>
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
    <SafeAreaView style={[S.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={[S.headerEyebrow, { color: C.primary }]}>MINDSET</Text>
          <Text style={[S.headerTitle, { color: C.text }]}>Ваші установки</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            S.addBtn,
            { backgroundColor: C.primaryMuted },
            pressed && { opacity: 0.75 },
          ]}
          onPress={() => router.push('/belief/create')}
        >
          <Text style={[S.addBtnText, { color: C.primary }]}>＋ Додати</Text>
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

              {/* Add new belief — dashed border */}
              <Pressable
                style={({ pressed }) => [
                  S.addCard,
                  { borderColor: C.border },
                  pressed && { opacity: 0.7, borderColor: 'rgba(200,230,74,0.3)' },
                ]}
                onPress={() => router.push('/belief/create')}
              >
                <Text style={[S.addCardText, { color: C.textSecondary }]}>
                  + Додати свою установку
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  addBtnText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 13,
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scroll: { paddingHorizontal: Spacing.screen, gap: 14, paddingTop: 4 },

  // Belief card
  card: {
    borderRadius: Radius.lg,
    padding: 20,
    gap: 10,
  },
  catLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  beliefTitle: {
    fontFamily: FontFamily.serifItalic,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 25,
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convictionText: { fontFamily: FontFamily.sans, fontSize: 13 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  // Add card
  addCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: { fontFamily: FontFamily.sansMedium, fontSize: 14 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: FontFamily.serifBold, fontSize: 22, textAlign: 'center', marginBottom: 8 },
  emptyBody: { fontFamily: FontFamily.sans, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  diagBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  diagBtnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: '#050608' },
});
