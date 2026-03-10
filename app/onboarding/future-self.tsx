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
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { BeliefCategory, CATEGORY_MAP } from '@/constants/categories';
import { SAMPLE_BELIEFS } from '@/constants/sample-beliefs';
import { getAnswers } from '@/lib/onboarding-storage';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

const { width: SW } = Dimensions.get('window');

// ─── Positive outcomes per category ──────────────────────────────────────────

const OUTCOMES: Record<BeliefCategory, { icon: IconName; outcome: string; color: string }> = {
  pricing: {
    icon: 'Coins',
    outcome: 'впевнено встановлювати ціни, що відображають реальну цінність вашої роботи',
    color: '#C8E64A',
  },
  delegation: {
    icon: 'Users',
    outcome: 'будувати команду і масштабувати бізнес без вашої прямої участі в кожному процесі',
    color: '#7BB8C9',
  },
  fear: {
    icon: 'ShieldAlert',
    outcome: 'діяти попри невизначеність і перетворювати провали на точки зростання',
    color: '#E8976B',
  },
  selfworth: {
    icon: 'Award',
    outcome: 'приймати рішення з позиції впевненості та не продавати себе дешевше за свою цінність',
    color: '#9B8AC4',
  },
  growth: {
    icon: 'TrendingUp',
    outcome: 'свідомо масштабувати бізнес за чіткою стратегією без відчуття хаосу',
    color: '#4AE68C',
  },
  time: {
    icon: 'Clock',
    outcome: 'управляти часом стратегічно і мати простір для відновлення та стратегії',
    color: '#E6B44A',
  },
  relationships: {
    icon: 'Heart',
    outcome: 'будувати сильні партнерства і залучати потрібних людей у свій бізнес',
    color: '#E64A5E',
  },
  money: {
    icon: 'Wallet',
    outcome: 'приймати фінансові рішення без внутрішніх обмежень і будувати систему достатку',
    color: '#4AE68C',
  },
};

// ─── Transformation card ──────────────────────────────────────────────────────

interface CardData {
  rank: number;
  beliefUk: string;
  category: BeliefCategory;
}

function TransformCard({ card, delay }: { card: CardData; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  const outcome = OUTCOMES[card.category];
  const cat = CATEGORY_MAP[card.category];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {/* Gold gradient simulation: top glow */}
      <View style={[styles.cardGlow, { backgroundColor: outcome.color + '12' }]} />

      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: outcome.color + '20' }]}>
          <Icon name={outcome.icon} size={22} color={outcome.color} />
        </View>
        <View style={[styles.categoryTag, { backgroundColor: outcome.color + '18', borderColor: outcome.color + '40' }]}>
          <Icon name={cat.icon} size={10} color={outcome.color} />
          <Text style={[styles.categoryTagText, { color: outcome.color }]}>{cat.nameUk}</Text>
        </View>
      </View>

      {/* Belief removed */}
      <Text style={styles.withoutLabel}>Без установки</Text>
      <Text style={styles.beliefText}>«{card.beliefUk}»</Text>

      {/* Divider */}
      <View style={[styles.arrowRow]}>
        <View style={[styles.arrowLine, { backgroundColor: outcome.color + '40' }]} />
        <Text style={[styles.arrowIcon, { color: outcome.color }]}>↓</Text>
        <View style={[styles.arrowLine, { backgroundColor: outcome.color + '40' }]} />
      </View>

      {/* Outcome */}
      <Text style={styles.outcomeLabel}>Ви зможете</Text>
      <Text style={styles.outcomeText}>{outcome.outcome}</Text>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FutureSelfScreen() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loaded, setLoaded] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    (async () => {
      const answers = await getAnswers();
      const answered = answers.filter((a) => a.score > 0);

      let top3: CardData[];
      if (answered.length >= 3) {
        top3 = answered
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((a, i) => {
            const belief = SAMPLE_BELIEFS.find((b) => b.id === a.beliefId);
            return {
              rank: i + 1,
              beliefUk: belief?.belief_uk ?? a.category,
              category: a.category,
            };
          });
      } else {
        // Fallback if user skipped diagnostic
        top3 = [
          { rank: 1, beliefUk: 'Я не можу встановлювати високі ціни', category: 'pricing' },
          { rank: 2, beliefUk: 'Якщо хочеш зробити добре — зроби сам', category: 'delegation' },
          { rank: 3, beliefUk: 'Я недостатньо компетентний для цього рівня', category: 'selfworth' },
        ];
      }

      setCards(top3);
      setLoaded(true);

      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]).start();
    })();
  }, []);

  if (!loaded) return <View style={styles.root} />;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}
        >
          <Text style={styles.eyebrow}>ВАШЕ МАЙБУТНЄ · 3 МІСЯЦІ</Text>
          <Text style={styles.title}>
            Уявіть себе{'\n'}через 3 місяці
          </Text>
          <Text style={styles.subtitle}>
            Ось що стане можливим, коли ви пропрацюєте свої ключові обмеження
          </Text>
        </Animated.View>

        {/* Cards */}
        <View style={styles.cardsList}>
          {cards.map((card, i) => (
            <TransformCard key={card.rank} card={card} delay={300 + i * 180} />
          ))}
        </View>

        {/* Bottom insight */}
        <Animated.View
          style={[
            styles.insightRow,
            { opacity: headerOpacity },
          ]}
        >
          <Text style={styles.insightText}>
            Це не мотиваційна риторика. Це результат системної роботи з методологією МАСШТАБ.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          label="Почати трансформацію"
          onPress={() => router.push('/onboarding/paywall')}
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
    fontSize: 32,
    lineHeight: 40,
    color: C.text,
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 23,
    color: C.textSecondary,
  },

  // Cards
  cardsList: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: C.surface1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  categoryTagText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
  },

  withoutLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.textTertiary,
    letterSpacing: 0.3,
  },
  beliefText: {
    fontFamily: FontFamily.serifItalic,
    fontSize: 17,
    lineHeight: 24,
    color: C.textSecondary,
  },

  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  arrowLine: {
    flex: 1,
    height: 1,
  },
  arrowIcon: {
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
  },

  outcomeLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: C.primary,
    textTransform: 'uppercase',
  },
  outcomeText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    color: C.text,
  },

  // Insight
  insightRow: {
    backgroundColor: C.surface2,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: C.border,
  },
  insightText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 21,
    color: C.textSecondary,
    textAlign: 'center',
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
