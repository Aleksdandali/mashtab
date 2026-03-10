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
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useBeliefs } from '@/hooks/useBeliefs';
import { CATEGORIES, BeliefCategory } from '@/constants/categories';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';

// ─── Category pills for step 1 ───────────────────────────────────────────────

const PILL_CATEGORIES: { key: BeliefCategory; label: string }[] = [
  { key: 'money', label: 'ФІНАНСИ' },
  { key: 'pricing', label: 'ПРОДАЖІ' },
  { key: 'selfworth', label: 'ОСОБИСТЕ' },
  { key: 'time', label: "ЧАС" },
  { key: 'relationships', label: 'ВІДНОСИНИ' },
  { key: 'fear', label: 'СТРАХИ' },
  { key: 'delegation', label: 'ДЕЛЕГУВАННЯ' },
  { key: 'growth', label: 'ЗРОСТАННЯ' },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Установка' },
  { label: 'Переконання' },
  { label: 'Деталі' },
];

function StepIndicator({ current }: { current: number }) {
  const C = useTheme();
  return (
    <View style={stepStyles.row}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View
            key={i}
            style={[
              stepStyles.bar,
              {
                backgroundColor: done || active ? C.primary : C.surface3,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});

// ─── Styled Input ─────────────────────────────────────────────────────────────

interface StyledInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  optional?: boolean;
  minHeight?: number;
}

function StyledInput({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = true,
  optional = false,
  minHeight = 80,
}: StyledInputProps) {
  const C = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={inputStyles.wrap}>
      <View style={inputStyles.labelRow}>
        <Text style={[inputStyles.label, { color: C.textSecondary }]}>{label}</Text>
        {optional && (
          <Text style={[inputStyles.optional, { color: C.textTertiary }]}>опціонально</Text>
        )}
      </View>
      <TextInput
        style={[
          inputStyles.input,
          {
            backgroundColor: C.surface3,
            color: C.text,
            borderColor: focused ? C.primary : C.border,
            minHeight,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  optional: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
  },
  input: {
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    padding: 3,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
});

// ─── Impact Slider (1-10) ────────────────────────────────────────────────────

function ImpactSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const C = useTheme();
  const TRACK_WIDTH = 280;
  const THUMB_SIZE = 28;
  const MIN = 1;
  const MAX = 10;

  const handleTrackPress = (e: any) => {
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / TRACK_WIDTH));
    const val = Math.round(MIN + ratio * (MAX - MIN));
    onChange(val);
    Haptics.selectionAsync();
  };

  const fillRatio = (value - MIN) / (MAX - MIN);

  return (
    <View style={sliderStyles.wrap}>
      <Text style={[sliderStyles.title, { color: C.textSecondary }]}>
        Вплив на ваш бізнес / життя
      </Text>
      <Text style={[sliderStyles.valueDisplay, { color: C.primary }]}>
        {value}/10
      </Text>
      <Pressable onPress={handleTrackPress} style={sliderStyles.trackWrap}>
        <View style={[sliderStyles.track, { backgroundColor: C.surface3, width: TRACK_WIDTH }]}>
          <View
            style={[
              sliderStyles.trackFill,
              { backgroundColor: C.primary, width: fillRatio * TRACK_WIDTH },
            ]}
          />
          <View
            style={[
              sliderStyles.thumb,
              {
                backgroundColor: C.primary,
                left: fillRatio * (TRACK_WIDTH - THUMB_SIZE),
              },
            ]}
          />
        </View>
      </Pressable>
      <View style={sliderStyles.hints}>
        <Text style={[sliderStyles.hint, { color: C.textTertiary }]}>1 — слабкий</Text>
        <Text style={[sliderStyles.hint, { color: C.textTertiary }]}>10 — дуже сильний</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { marginBottom: 5 },
  title: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  valueDisplay: {
    fontFamily: FontFamily.sansBold,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 16,
  },
  trackWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  track: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    top: -11,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  hints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  hint: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateBeliefScreen() {
  const C = useTheme();
  const { createCustomBelief } = useBeliefs();

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Step 1
  const [beliefText, setBeliefText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BeliefCategory | null>(null);
  // Step 2
  const [conviction, setConviction] = useState('');
  // Step 3
  const [source, setSource] = useState('');
  const [newBelief, setNewBelief] = useState('');
  const [experiment, setExperiment] = useState('');
  const [identity, setIdentity] = useState('');
  const [score, setScore] = useState<number>(5);
  const [isFocusWeek, setIsFocusWeek] = useState(false);

  const [saving, setSaving] = useState(false);

  const animateForward = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const nextStep = () => {
    animateForward();
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    animateForward();
    setStep((s) => s - 1);
  };

  const handleSave = async () => {
    if (!beliefText.trim() || !conviction.trim() || !score) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const created = await createCustomBelief({
        belief: beliefText.trim(),
        conviction: conviction.trim(),
        source: source.trim() || undefined,
        newBelief: newBelief.trim() || undefined,
        experiment: experiment.trim() || undefined,
        identity: identity.trim() || undefined,
        score,
      });
      if (created) {
        router.replace(`/belief/${created.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const step1Valid = beliefText.trim().length >= 5;
  const step2Valid = conviction.trim().length >= 5;
  const step3Valid = score !== null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepIndicatorWrap}>
            <StepIndicator current={step} />
          </View>

          <Animated.View
            style={[
              styles.content,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            {/* Step 0: belief + category */}
            {step === 0 && (
              <View>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Що вас зупиняє?
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Починайте з «Я не можу...», «Мені важко...», «Завжди так...»
                </Text>

                <StyledInput
                  label="Установка"
                  placeholder="Я не можу підвищити ціни..."
                  value={beliefText}
                  onChangeText={setBeliefText}
                  minHeight={160}
                />

                <Text style={[styles.categoryLabel, { color: C.textSecondary }]}>
                  Категорія
                </Text>
                <View style={styles.pillsRow}>
                  {PILL_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <Pressable
                        key={cat.key}
                        onPress={() => {
                          setSelectedCategory(isSelected ? null : cat.key);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.pill,
                          {
                            backgroundColor: isSelected ? C.primary : C.surface2,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: isSelected ? '#060810' : C.textSecondary },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Step 1: conviction + details */}
            {step === 1 && (
              <View>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Нова установка
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Чому ви в це вірите? Звідки це переконання?
                </Text>

                <StyledInput
                  label="Звідки це переконання?"
                  placeholder="Батьки вчили не «жадібничати»..."
                  value={source}
                  onChangeText={setSource}
                  optional
                  minHeight={70}
                />
                <StyledInput
                  label="Нова функціональна установка"
                  placeholder="Я встановлюю ціни, що відображають цінність..."
                  value={newBelief}
                  onChangeText={setNewBelief}
                  optional
                  minHeight={70}
                />
                <StyledInput
                  label="Експеримент / дія для перевірки"
                  placeholder="Підніміть ціну на один продукт на 15%..."
                  value={experiment}
                  onChangeText={setExperiment}
                  optional
                  minHeight={70}
                />
              </View>
            )}

            {/* Step 2: impact + focus toggle */}
            {step === 2 && (
              <View>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Останній крок
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Оцініть вплив і налаштуйте фокус.
                </Text>

                <ImpactSlider value={score} onChange={setScore} />

                <View style={[styles.toggleRow, { backgroundColor: C.surface2 }]}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={[styles.toggleTitle, { color: C.text }]}>
                      Зробити фокусом тижня
                    </Text>
                    <Text style={[styles.toggleHint, { color: C.textSecondary }]}>
                      Ця установка буде в центрі уваги цього тижня
                    </Text>
                  </View>
                  <Switch
                    value={isFocusWeek}
                    onValueChange={setIsFocusWeek}
                    trackColor={{ false: C.surface3, true: C.primary + '60' }}
                    thumbColor={isFocusWeek ? C.primary : C.textSecondary}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.aiBtn,
                    { borderColor: C.primary, backgroundColor: C.primary + '12' },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/ai-coach',
                      params: {
                        contextType: 'belief_create',
                        belief: beliefText,
                        conviction,
                      },
                    })
                  }
                >
                  <Text style={[styles.aiBtnText, { color: C.primary }]}>
                    AI допоможе заповнити
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* Navigation buttons — inline in content */}
          <View style={styles.navRow}>
            {step > 0 && (
              <Pressable
                style={[styles.backBtn, { borderColor: C.border }]}
                onPress={prevStep}
              >
                <Icon name="ArrowLeft" size={20} color={C.textSecondary} />
              </Pressable>
            )}

            <View style={{ flex: 1 }}>
              {step < 2 ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.nextBtn,
                    { backgroundColor: C.primary },
                    !((step === 0 && step1Valid) || (step === 1 && step2Valid)) && { opacity: 0.4 },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={nextStep}
                  disabled={!(step === 0 ? step1Valid : step2Valid)}
                >
                  <Text style={styles.nextBtnText}>Далі</Text>
                  <Icon name="ArrowRight" size={18} color="#060810" />
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.nextBtn,
                    { backgroundColor: C.primary },
                    (!step3Valid || saving) && { opacity: 0.4 },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={handleSave}
                  disabled={!step3Valid || saving}
                >
                  {saving ? (
                    <ActivityIndicator color={C.surface1} size="small" />
                  ) : (
                    <Text style={styles.nextBtnText}>Почати трансформацію</Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  stepIndicatorWrap: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.screen,
  },

  content: {
    paddingHorizontal: Spacing.screen,
  },

  stepTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
    marginBottom: Spacing.sm,
  },
  stepHint: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  categoryLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 13,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  pillText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },

  beliefPreview: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: 4,
    marginBottom: 4,
  },
  beliefPreviewLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  beliefPreviewText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
    lineHeight: 22,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  toggleTextWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  toggleHint: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
  },

  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    marginBottom: 5,
  },
  aiBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing.xl,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
    color: '#060810',
  },
});
