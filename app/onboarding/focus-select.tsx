import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors as C } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { BeliefCategory } from '@/constants/categories';
import { saveSelectedFocus } from '@/lib/onboarding-storage';
import { Button } from '@/components/ui/Button';

// ─── Focus options ────────────────────────────────────────────────────────────

interface FocusOption {
  key: BeliefCategory;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const FOCUS_OPTIONS: FocusOption[] = [
  {
    key: 'money',
    icon: '💰',
    title: 'Гроші',
    description: 'Ціноутворення, дохід, фінансові установки',
    color: '#7CB392',
  },
  {
    key: 'delegation',
    icon: '🤝',
    title: 'Делегування',
    description: 'Контроль, команда, масштабування через людей',
    color: '#7BB8C9',
  },
  {
    key: 'selfworth',
    icon: '💎',
    title: 'Самооцінка',
    description: 'Впевненість, синдром самозванця, гідність',
    color: '#9B8AC4',
  },
  {
    key: 'fear',
    icon: '🔥',
    title: 'Страх',
    description: 'Страх провалу, думки оточення, ризик',
    color: '#E8976B',
  },
];

// ─── FocusCard ────────────────────────────────────────────────────────────────

function FocusCard({
  option,
  selected,
  onPress,
}: {
  option: FocusOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        selected && { borderColor: option.color },
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
    >
      {selected && (
        <View style={[styles.cardGlow, { backgroundColor: option.color + '18' }]} />
      )}

      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: option.color + '20' }]}>
          <Text style={styles.icon}>{option.icon}</Text>
        </View>
        {selected && (
          <View style={[styles.checkDot, { backgroundColor: option.color }]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </View>

      <Text style={[styles.cardTitle, selected && { color: option.color }]}>
        {option.title}
      </Text>
      <Text style={styles.cardDesc}>{option.description}</Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FocusSelectScreen() {
  const [selected, setSelected] = useState<BeliefCategory | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    await saveSelectedFocus(selected);
    router.push('/onboarding/diagnostic');
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepRow}>
            <Text style={styles.stepText}>Крок 2 з 6</Text>
            <View style={styles.stepBar}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View
                  key={i}
                  style={[styles.stepDot, i <= 2 && styles.stepDotActive]}
                />
              ))}
            </View>
          </View>

          <Text style={styles.title}>Де найбільший бар'єр?</Text>
          <Text style={styles.subtitle}>
            Оберіть одну сферу для фокусу.{'\n'}
            Це визначить вашу першу установку.
          </Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {FOCUS_OPTIONS.map((opt) => (
            <FocusCard
              key={opt.key}
              option={opt}
              selected={selected === opt.key}
              onPress={() => setSelected(opt.key)}
            />
          ))}
        </View>

        {/* Hint */}
        {!selected && (
          <Text style={styles.hint}>Оберіть один варіант, щоб продовжити</Text>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          label="Далі — Діагностика"
          onPress={handleNext}
          variant="primary"
          size="lg"
          disabled={!selected}
          loading={loading}
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
  },

  // Header
  header: {
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.textTertiary,
  },
  stepBar: {
    flexDirection: 'row',
    gap: 4,
  },
  stepDot: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.surface3,
  },
  stepDotActive: {
    backgroundColor: C.primary,
  },
  title: {
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
    lineHeight: 36,
    color: C.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 23,
    color: C.textSecondary,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  // Card
  card: {
    width: '47.5%',
    backgroundColor: C.surface1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
    minHeight: 148,
  },
  cardSelected: {
    borderWidth: 1.5,
  },
  cardGlow: {
    position: 'absolute',
    inset: 0,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12,
    color: '#fff',
    lineHeight: 14,
  },
  cardTitle: {
    fontFamily: FontFamily.serifBold,
    fontSize: 20,
    lineHeight: 24,
    color: C.text,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: C.textTertiary,
  },

  // Hint
  hint: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: C.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
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
  btn: {
    width: '100%',
  },
});
