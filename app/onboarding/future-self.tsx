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
import { useTheme } from '@/hooks/useTheme';
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
    color: '#C8FF00',
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
  const C = useTheme();
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
      style={[styles.card, { backgroundColor: C.surface2, opacity, transform: [{ translateY }] }]}
    >
      {/* БУЛО */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.wasLabel, { color: 'rgba(163,174,196,0.30)' }]}>БУЛО</Text>
        <Text style={[styles.beliefText, { color: C.textSecondary }]}>"{card.beliefUk}"</Text>
      </View>

      {/* Arrow */}
      <View style={styles.arrowRow}>
        <View style={[styles.arrowCircle, { backgroundColor: C.surface3 }]}>
          <Icon name="ArrowRight" size={18} color={C.textSecondary} strokeWidth={1.5} />
        </View>
      </View>

      {/* СТАНЕ МОЖЛИВИМ */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.outcomeLabel, { color: C.primary }]}>СТАНЕ МОЖЛИВИМ</Text>
        <Text style={[styles.outcomeText, { color: C.text }]}>{outcome.outcome}</Text>
      </View>
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
        {/* Header — centered */}
        <Animated.View
          style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}
        >
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

        {/* CTA — inline in content flow */}
        <View style={styles.ctaWrap}>
          <Button
            label="Почати трансформацію"
            onPress={() => router.push('/onboarding/paywall')}
            variant="primary"
            size="lg"
            style={styles.btn}
          />
        </View>
      </ScrollView>
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
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },

  // Header — centered
  header: {
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
    color: C.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 17,
    lineHeight: 25,
    color: C.textSecondary,
    textAlign: 'center',
  },

  // Cards
  cardsList: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: 16,
  },

  sectionBlock: { gap: 8 },
  wasLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  beliefText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 16,
    lineHeight: 23,
    fontStyle: 'italic',
  },

  arrowRow: {
    alignItems: 'center',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  outcomeLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  outcomeText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    lineHeight: 24,
  },

  // CTA — inline
  ctaWrap: {
    marginTop: Spacing.xxl,
  },
  btn: {
    width: '100%',
    paddingVertical: 20,
  },
});
