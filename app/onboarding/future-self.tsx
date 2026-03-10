import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Colors as C } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { BeliefCategory } from '@/constants/categories';
import { SAMPLE_BELIEFS } from '@/constants/sample-beliefs';
import { getAnswers } from '@/lib/onboarding-storage';
import { Icon } from '@/components/ui/Icon';

// ─── Positive outcomes per category ──────────────────────────────────────────

const OUTCOMES: Record<BeliefCategory, string> = {
  pricing: 'впевнено встановлювати ціни, що відображають реальну цінність вашої роботи',
  delegation: 'будувати команду і масштабувати бізнес без вашої прямої участі в кожному процесі',
  fear: 'діяти попри невизначеність і перетворювати провали на точки зростання',
  selfworth: 'приймати рішення з позиції впевненості та не продавати себе дешевше за свою цінність',
  growth: 'свідомо масштабувати бізнес за чіткою стратегією без відчуття хаосу',
  time: 'управляти часом стратегічно і мати простір для відновлення та стратегії',
  relationships: 'будувати сильні партнерства і залучати потрібних людей у свій бізнес',
  money: 'приймати фінансові рішення без внутрішніх обмежень і будувати систему достатку',
};

const HARDCODED_CARDS = [
  { was: 'Працював 80 год/тиждень', becomes: '4-денний робочий тиждень' },
  { was: 'Боявся делегувати', becomes: 'Команда з 12 людей' },
  { was: '$5K/міс revenue', becomes: '$50K/міс стабільно' },
];

// ─── Transformation Card ──────────────────────────────────────────────────────

function TransformCard({
  was,
  becomes,
  delay,
}: {
  was: string;
  becomes: string;
  delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.wasSection}>
        <Text style={styles.sectionLabel}>БУЛО</Text>
        <Text style={styles.wasText}>"{was}"</Text>
      </View>

      <View style={styles.arrowContainer}>
        <Icon name="ArrowRight" size={24} color={C.primary} strokeWidth={1.5} />
      </View>

      <View style={styles.becomesSection}>
        <Text style={styles.sectionLabel}>СТАНЕ МОЖЛИВИМ</Text>
        <Text style={styles.becomesText}>{becomes}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FutureSelfScreen() {
  const [cardData, setCardData] = useState<{ was: string; becomes: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const answers = await getAnswers();
      const answered = answers.filter((a) => a.score > 0);

      if (answered.length >= 3) {
        const top3 = answered
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((a) => {
            const belief = SAMPLE_BELIEFS.find((b) => b.id === a.beliefId);
            return {
              was: belief?.belief_uk ?? a.category,
              becomes: OUTCOMES[a.category as BeliefCategory] ?? a.category,
            };
          });
        setCardData(top3);
      } else {
        setCardData(HARDCODED_CARDS);
      }

      setLoaded(true);
    })();
  }, []);

  if (!loaded) return <View style={styles.root} />;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Майбутнє Я</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Text style={styles.introText}>
          Ось як виглядає ваше підприємницьке життя через 3 місяці після того, як ви пропрацюєте
          ключові обмеження.
        </Text>

        {/* Transformation cards */}
        {cardData.map((item, i) => (
          <TransformCard key={i} was={item.was} becomes={item.becomes} delay={200 + i * 160} />
        ))}

        {/* Reflection card */}
        <View style={styles.reflectionCard}>
          <Text style={styles.reflectionLabel}>РЕФЛЕКСІЯ</Text>
          <Text style={styles.reflectionQuestion}>
            Як би змінилось ваше підприємницьке життя без цих обмежень?
          </Text>
          <Pressable
            style={({ pressed }) => [styles.reflectionButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/ai-coach')}
          >
            <Text style={styles.reflectionButtonText}>Записати думки</Text>
          </Pressable>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/onboarding/paywall')}
        >
          <Text style={styles.ctaText}>Почати трансформацію</Text>
        </Pressable>
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

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    letterSpacing: -0.5,
    color: C.text,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  introText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    color: C.textSecondary,
    marginBottom: 24,
  },

  // Transformation card
  card: {
    backgroundColor: C.surface1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: 16,
  },

  wasSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.textSecondary,
    marginBottom: 8,
  },
  wasText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(163,174,196,0.4)',
  },

  arrowContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },

  becomesSection: {
    marginTop: 20,
  },
  becomesText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    lineHeight: 24,
    color: C.text,
  },

  // Reflection card
  reflectionCard: {
    backgroundColor: C.surface2,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: 16,
  },
  reflectionLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.textSecondary,
    marginBottom: 8,
  },
  reflectionQuestion: {
    fontFamily: FontFamily.sansBold,
    fontSize: 20,
    lineHeight: 28,
    color: C.text,
    marginBottom: 20,
  },
  reflectionButton: {
    backgroundColor: C.primaryMuted,
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionButtonText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    color: C.primary,
  },

  // CTA
  ctaButton: {
    backgroundColor: C.primary,
    borderRadius: Radius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    color: '#060810',
  },
});
