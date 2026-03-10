import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors as C } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { CATEGORY_MAP, BeliefCategory } from '@/constants/categories';
import { SAMPLE_BELIEFS, CATEGORY_COLORS } from '@/constants/sample-beliefs';
import { getAnswers, StoredAnswer } from '@/lib/onboarding-storage';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const { width: SW } = Dimensions.get('window');
const BAR_MAX_W = SW - Spacing.screen * 2 - 100; // label + value space

// ─── Data helpers ─────────────────────────────────────────────────────────────

interface CategoryResult {
  category: BeliefCategory;
  avgScore: number;
  count: number;
}

interface TopBelief {
  rank: number;
  beliefUk: string;
  category: BeliefCategory;
  score: number;
}

function buildResults(answers: StoredAnswer[]): {
  byCategory: CategoryResult[];
  topBeliefs: TopBelief[];
} {
  // Skip skipped (score=0)
  const answered = answers.filter((a) => a.score > 0);

  // Group by category
  const map: Partial<Record<BeliefCategory, number[]>> = {};
  for (const a of answered) {
    if (!map[a.category]) map[a.category] = [];
    map[a.category]!.push(a.score);
  }

  const byCategory: CategoryResult[] = Object.entries(map)
    .map(([cat, scores]) => ({
      category: cat as BeliefCategory,
      avgScore: scores!.reduce((s, v) => s + v, 0) / scores!.length,
      count: scores!.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // Top 3 individual beliefs
  const topBeliefs: TopBelief[] = answered
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((a, i) => {
      const belief = SAMPLE_BELIEFS.find((b) => b.id === a.beliefId);
      return {
        rank: i + 1,
        beliefUk: belief?.belief_uk ?? '',
        category: a.category,
        score: a.score,
      };
    });

  return { byCategory, topBeliefs };
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function CategoryBar({
  result,
  isTop,
  delay,
}: {
  result: CategoryResult;
  isTop: boolean;
  delay: number;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const color = CATEGORY_COLORS[result.category];
  const cat   = CATEGORY_MAP[result.category];
  const pct   = result.avgScore / 10;
  const barW  = BAR_MAX_W * pct;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(widthAnim, {
        toValue: barW,
        duration: 600,
        delay: delay + 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.barRow, { opacity: opacityAnim }]}>
      <View style={styles.barLabelWrap}>
        <Icon name={cat.icon} size={13} color={isTop ? color : color + 'AA'} />
        <Text
          style={[
            styles.barLabel,
            isTop && { color: C.primary, fontFamily: FontFamily.sansSemiBold },
          ]}
          numberOfLines={1}
        >
          {cat.nameUk}
        </Text>
      </View>

      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthAnim,
              backgroundColor: isTop ? color : color + 'AA',
            },
          ]}
        />
      </View>

      <Text style={[styles.barScore, isTop && { color: C.primary }]}>
        {result.avgScore.toFixed(1)}
      </Text>
    </Animated.View>
  );
}

// ─── Top belief item ──────────────────────────────────────────────────────────

const RANK_COLORS = ['#C8E64A', '#4AE68C', '#7BB8C9'];

function TopBeliefItem({ item }: { item: TopBelief }) {
  const color = CATEGORY_COLORS[item.category];
  const cat   = CATEGORY_MAP[item.category];
  const rankColor = RANK_COLORS[item.rank - 1] ?? color;

  return (
    <View style={[styles.topItem, { borderLeftColor: rankColor }]}>
      <View style={[styles.rankBadge, { backgroundColor: rankColor + '20' }]}>
        <Text style={[styles.rankNum, { color: rankColor }]}>{item.rank}</Text>
      </View>
      <View style={styles.topContent}>
        <Text style={styles.topBeliefText} numberOfLines={2}>
          «{item.beliefUk}»
        </Text>
        <View style={styles.topMeta}>
          <View style={styles.topCatRow}>
            <Icon name={cat.icon} size={11} color={color} />
            <Text style={[styles.topCat, { color }]}>{cat.nameUk}</Text>
          </View>
          <View style={[styles.topScore, { backgroundColor: color + '22' }]}>
            <Text style={[styles.topScoreText, { color }]}>{item.score}/10</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResultsScreen() {
  const [byCategory, setByCategory] = useState<CategoryResult[]>([]);
  const [topBeliefs, setTopBeliefs] = useState<TopBelief[]>([]);
  const [loaded, setLoaded] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    (async () => {
      const answers = await getAnswers();
      const { byCategory: cats, topBeliefs: top } = buildResults(answers);
      setByCategory(cats);
      setTopBeliefs(top);
      setLoaded(true);

      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    })();
  }, []);

  const handleContinue = () => router.push('/onboarding/future-self');

  if (!loaded) return <View style={styles.root} />;

  const topScore = byCategory[0]?.avgScore ?? 0;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOpacity, transform: [{ translateY: headerY }] },
          ]}
        >
          <Text style={styles.eyebrow}>РЕЗУЛЬТАТИ ДІАГНОСТИКИ</Text>
          <Text style={styles.title}>Ваш профіль обмежень</Text>
          <Text style={styles.subtitle}>
            Ось де установки найбільше стримують ваше зростання
          </Text>
        </Animated.View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>По категоріях</Text>
          <View style={styles.chart}>
            {byCategory.map((r, i) => (
              <CategoryBar
                key={r.category}
                result={r}
                isTop={i < 3}
                delay={i * 80}
              />
            ))}
          </View>

          {/* Scale hint */}
          <View style={styles.scaleLine}>
            <Text style={styles.scaleHint}>Шкала 1–10 · вплив на бізнес-рішення</Text>
          </View>
        </View>

        {/* Top 3 */}
        {topBeliefs.length > 0 && (
          <View style={styles.topSection}>
            <Text style={styles.sectionTitle}>Топ-3 установки</Text>
            <Text style={styles.topSubtitle}>
              З ними варто розпочати роботу
            </Text>
            <View style={styles.topList}>
              {topBeliefs.map((item) => (
                <TopBeliefItem key={item.rank} item={item} />
              ))}
            </View>
          </View>
        )}

        {/* Insight */}
        <View style={styles.insightCard}>
          <Icon name="Lightbulb" size={18} color={C.primary} />
          <Text style={styles.insightText}>
            Середній рівень впливу ваших установок —{' '}
            <Text style={{ color: C.primary, fontFamily: FontFamily.sansSemiBold }}>
              {topScore.toFixed(1)}/10
            </Text>
            . МАСШТАБ допоможе знизити його систематично, крок за кроком.
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          label="Продовжити"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },

  // Header
  header: {
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  eyebrow: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: C.primary,
  },
  title: {
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
    lineHeight: 36,
    color: C.text,
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 23,
    color: C.textSecondary,
  },

  // Chart card
  chartCard: {
    backgroundColor: C.surface1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: C.border,
    gap: Spacing.base,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 13,
    letterSpacing: 0.3,
    color: C.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  chart: {
    gap: 14,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barLabelWrap: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  barIcon: {
    width: 13,
    height: 13,
  },
  barLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: C.surface3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barScore: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 13,
    color: C.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  scaleLine: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  scaleHint: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
    color: C.textTertiary,
  },

  // Top 3
  topSection: {
    gap: Spacing.sm,
  },
  topSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: C.textTertiary,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
  },
  topList: {
    gap: Spacing.sm,
  },
  topItem: {
    backgroundColor: C.surface1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  rankNum: {
    fontFamily: FontFamily.sansBold,
    fontSize: 11,
    lineHeight: 14,
  },
  topContent: {
    flex: 1,
    gap: Spacing.sm,
  },
  topBeliefText: {
    fontFamily: FontFamily.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    color: C.text,
  },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topCat: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
  },
  topScore: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topScoreText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
  },

  // Insight
  insightCard: {
    backgroundColor: C.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  insightIcon: {
    width: 18,
    height: 18,
  },
  insightText: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 21,
    color: C.textSecondary,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  btn: { width: '100%' },
});
