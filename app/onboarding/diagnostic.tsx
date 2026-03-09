import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { DarkColors as C } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { CATEGORY_MAP, BeliefCategory } from '@/constants/categories';
import { SAMPLE_BELIEFS, CATEGORY_COLORS } from '@/constants/sample-beliefs';
import { addAnswer, saveAnswers } from '@/lib/onboarding-storage';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - Spacing.screen * 2;

// ─── Score button ─────────────────────────────────────────────────────────────

function ScoreButton({
  value,
  selected,
  color,
  onPress,
}: {
  value: number;
  selected: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.scoreBtn,
        selected && { backgroundColor: color, borderColor: color },
        pressed && !selected && { borderColor: color, backgroundColor: color + '22' },
      ]}
    >
      <Text
        style={[
          styles.scoreBtnText,
          selected && { color: '#fff', fontFamily: FontFamily.sansSemiBold },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

// ─── Scale labels ─────────────────────────────────────────────────────────────

function ScaleLabels() {
  return (
    <View style={styles.scaleLabels}>
      <Text style={styles.scaleLabelText}>Не впливає</Text>
      <Text style={styles.scaleLabelText}>Сильно впливає</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DiagnosticScreen() {
  const [index, setIndex] = useState(0);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ beliefId: number; category: BeliefCategory; score: number }[]>([]);

  const cardOpacity   = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(0)).current;
  const nextOpacity   = useRef(new Animated.Value(0)).current;
  const nextTranslate = useRef(new Animated.Value(30)).current;

  const belief = SAMPLE_BELIEFS[index];
  const total  = SAMPLE_BELIEFS.length;
  const progress = index / total;

  const category   = CATEGORY_MAP[belief.category];
  const accentColor = CATEGORY_COLORS[belief.category];

  // Animate card out, then in
  const advance = useCallback(
    async (score: number) => {
      const newAnswers = [
        ...answers,
        { beliefId: belief.id, category: belief.category as BeliefCategory, score },
      ];
      setAnswers(newAnswers);
      await addAnswer({ beliefId: belief.id, category: belief.category as BeliefCategory, score });

      if (index + 1 >= total) {
        await saveAnswers(newAnswers);
        router.push('/onboarding/results');
        return;
      }

      // Animate current card out
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslate, {
          toValue: -40,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex((i) => i + 1);
        setSelectedScore(null);
        cardOpacity.setValue(0);
        cardTranslate.setValue(24);
        nextOpacity.setValue(0);
        nextTranslate.setValue(24);

        // Animate next card in
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslate, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [index, answers, belief, total],
  );

  const handleScore = (score: number) => {
    setSelectedScore(score);
    // Small delay so user sees selection, then advance
    setTimeout(() => advance(score), 280);
  };

  const handleSkip = () => advance(0);

  return (
    <SafeAreaView style={styles.root}>
      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {index + 1} / {total}
        </Text>
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        {/* Shadow cards behind (stack illusion) */}
        {index + 2 < total && (
          <View style={[styles.cardShadow, styles.cardShadow3]} />
        )}
        {index + 1 < total && (
          <View style={[styles.cardShadow, styles.cardShadow2]} />
        )}

        {/* Main card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            },
          ]}
        >
          {/* Category tag */}
          <View style={styles.categoryRow}>
            <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.categoryName, { color: accentColor }]}>
              {category.icon}  {category.nameUk.toUpperCase()}
            </Text>
          </View>

          {/* Belief quote */}
          <Text style={styles.beliefQuote}>
            «{belief.belief_uk}»
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: accentColor + '30' }]} />

          {/* Conviction */}
          <Text style={styles.conviction}>{belief.conviction_uk}</Text>

          {/* Question */}
          <Text style={styles.question}>
            Наскільки ця установка впливає на вас?
          </Text>
        </Animated.View>
      </View>

      {/* Score section */}
      <View style={styles.scoreSection}>
        <ScaleLabels />

        <View style={styles.scoreRow}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <ScoreButton
              key={v}
              value={v}
              selected={selectedScore === v}
              color={accentColor}
              onPress={() => handleScore(v)}
            />
          ))}
        </View>

        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Пропустити</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SCORE_BTN_SIZE = Math.floor((SW - Spacing.screen * 2 - 9 * 6) / 10);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Progress
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  progressBg: {
    flex: 1,
    height: 3,
    backgroundColor: C.surface3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.textTertiary,
    width: 36,
    textAlign: 'right',
  },

  // Card area
  cardArea: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    justifyContent: 'center',
  },
  cardShadow: {
    position: 'absolute',
    left: Spacing.screen,
    right: Spacing.screen,
    backgroundColor: C.surface2,
    borderRadius: Radius.lg,
  },
  cardShadow2: {
    bottom: Spacing.sm + 8,
    top: Spacing.base + 8,
    opacity: 0.6,
    transform: [{ scaleX: 0.95 }],
  },
  cardShadow3: {
    bottom: Spacing.sm + 16,
    top: Spacing.base + 16,
    opacity: 0.3,
    transform: [{ scaleX: 0.9 }],
  },

  // Card
  card: {
    backgroundColor: C.surface1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: C.border,
    gap: Spacing.base,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  beliefQuote: {
    fontFamily: FontFamily.serifItalic,
    fontSize: 22,
    lineHeight: 32,
    color: C.text,
    letterSpacing: 0.1,
  },
  divider: {
    height: 1,
  },
  conviction: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    color: C.textSecondary,
  },
  question: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    color: C.textTertiary,
    marginTop: Spacing.xs,
  },

  // Score
  scoreSection: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabelText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
    color: C.textTertiary,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreBtn: {
    width: SCORE_BTN_SIZE,
    height: SCORE_BTN_SIZE,
    borderRadius: Radius.sm,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtnText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: C.textSecondary,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  skipText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: C.textTertiary,
  },
});
