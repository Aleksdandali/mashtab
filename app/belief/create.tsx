import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useBeliefs } from '@/hooks/useBeliefs';
import { CATEGORIES, BeliefCategory } from '@/constants/categories';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';

// ─── Example prompts for step 0 ───────────────────────────────────────────────

const BELIEF_EXAMPLES = [
  'Я не можу встановити вищі ціни',
  'Мені важко делегувати задачі',
  'Я не вмію ефективно управляти часом',
  'Клієнти не готові платити більше',
];

const STEP_TITLES = [
  'Яка твоя нова установка?',
  'Яка сфера життя?',
  'Чому це важливо?',
];

const STEP_SUBTITLES = [
  'Починайте з «Я не можу...», «Мені важко...», «Завжди так...»',
  'Оберіть категорію, яка найкраще описує цю установку',
  'Розкажіть, чому ця установка має значення для вашого бізнесу',
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateBeliefScreen() {
  const C = useTheme();
  const { createCustomBelief } = useBeliefs();

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Step 0
  const [beliefText, setBeliefText] = useState('');
  // Step 1
  const [selectedCategory, setSelectedCategory] = useState<BeliefCategory | null>(null);
  // Step 2
  const [conviction, setConviction] = useState('');

  const [saving, setSaving] = useState(false);

  const animateStep = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const nextStep = () => {
    animateStep();
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    animateStep();
    setStep((s) => s - 1);
  };

  const handleSave = async () => {
    if (!beliefText.trim() || !conviction.trim()) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const created = await createCustomBelief({
        belief: beliefText.trim(),
        conviction: conviction.trim(),
        source: undefined,
        newBelief: undefined,
        experiment: undefined,
        identity: undefined,
        score: 5,
      });
      if (created) {
        router.replace(`/belief/${created.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const canProceed = [
    beliefText.trim().length >= 5,
    selectedCategory !== null,
    conviction.trim().length >= 5,
  ][step];

  const progressFill = `${((step + 1) / 3) * 100}%`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: C.primary, width: progressFill as any },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: C.textSecondary }]}>
          Крок {step + 1} з 3
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            {/* Step header */}
            <Text style={[styles.stepTitle, { color: C.text }]}>
              {STEP_TITLES[step]}
            </Text>
            <Text style={[styles.stepSubtitle, { color: C.textSecondary }]}>
              {STEP_SUBTITLES[step]}
            </Text>

            {/* Step 0: belief text + example chips */}
            {step === 0 && (
              <View>
                <View style={[styles.inputCard, { backgroundColor: C.surface1 }]}>
                  <TextInput
                    style={[styles.inputCardText, { color: C.text }]}
                    placeholder="Я не можу підвищити ціни..."
                    placeholderTextColor={C.textTertiary}
                    multiline
                    textAlignVertical="top"
                    value={beliefText}
                    onChangeText={setBeliefText}
                    autoFocus
                  />
                </View>

                <Text style={[styles.examplesLabel, { color: C.textSecondary }]}>
                  ПРИКЛАДИ
                </Text>

                {BELIEF_EXAMPLES.map((example) => (
                  <Pressable
                    key={example}
                    style={({ pressed }) => [
                      styles.exampleChip,
                      { backgroundColor: C.surface1 },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      setBeliefText(example);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[styles.exampleChipText, { color: C.text }]}>
                      {example}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Step 1: category grid */}
            {step === 1 && (
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      style={({ pressed }) => [
                        styles.categoryCard,
                        { backgroundColor: isSelected ? C.primary : C.surface1 },
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => {
                        setSelectedCategory(isSelected ? null : cat.key);
                        Haptics.selectionAsync();
                      }}
                    >
                      <View style={styles.categoryCardInner}>
                        <Icon
                          name={cat.icon}
                          size={22}
                          color={isSelected ? '#060810' : C.textSecondary}
                          strokeWidth={1.5}
                        />
                        <Text
                          style={[
                            styles.categoryCardText,
                            { color: isSelected ? '#060810' : C.text },
                          ]}
                        >
                          {cat.nameUk}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={[styles.categoryCheck, { backgroundColor: '#060810' }]}>
                          <Icon name="Check" size={14} strokeWidth={2.5} color={C.primary} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Step 2: why textarea */}
            {step === 2 && (
              <View style={[styles.inputCard, { backgroundColor: C.surface1 }]}>
                <TextInput
                  style={[styles.inputCardTextLarge, { color: C.text }]}
                  placeholder="Ця установка заважає мені розвивати бізнес, тому що..."
                  placeholderTextColor={C.textTertiary}
                  multiline
                  textAlignVertical="top"
                  value={conviction}
                  onChangeText={setConviction}
                  autoFocus
                />
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Sticky footer */}
        <View style={[styles.footer, { backgroundColor: C.bg, borderTopColor: C.border }]}>
          <View style={styles.footerRow}>
            {step > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.backBtn,
                  { borderColor: C.border },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={prevStep}
              >
                <Icon name="ArrowLeft" size={20} color={C.textSecondary} />
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                {
                  backgroundColor: canProceed ? C.primary : C.primary + '4D',
                  flex: 1,
                },
                pressed && canProceed && { transform: [{ scale: 0.97 }] },
              ]}
              onPress={step < 2 ? nextStep : handleSave}
              disabled={!canProceed || saving}
            >
              {saving ? (
                <ActivityIndicator color="#060810" size="small" />
              ) : step < 2 ? (
                <>
                  <Text style={styles.nextBtnText}>Далі</Text>
                  <Icon name="ArrowRight" size={18} color="#060810" />
                </>
              ) : (
                <Text style={styles.nextBtnText}>Створити установку</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  progressContainer: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 13,
  },

  scroll: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },

  stepTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  inputCard: {
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: 24,
  },
  inputCardText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 17,
    lineHeight: 26,
    minHeight: 60,
  },
  inputCardTextLarge: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 17,
    lineHeight: 26,
    minHeight: 120,
  },

  examplesLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  exampleChip: {
    borderRadius: Radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  exampleChipText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  },

  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    borderRadius: Radius.lg,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  categoryCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  categoryCardText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
  },
  categoryCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    borderTopWidth: 1,
    padding: Spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    height: 56,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 17,
    color: '#060810',
  },
});
