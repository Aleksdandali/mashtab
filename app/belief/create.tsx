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
import { useTheme } from '@/hooks/useTheme';
import { useBeliefs } from '@/hooks/useBeliefs';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';

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
          <View key={i} style={stepStyles.item}>
            <View
              style={[
                stepStyles.dot,
                {
                  backgroundColor: done || active ? C.primary : C.surface3,
                  borderColor: active ? C.primary : 'transparent',
                  borderWidth: active ? 2 : 0,
                },
              ]}
            >
              {done && <Text style={stepStyles.dotCheck}>✓</Text>}
              {active && (
                <View style={[stepStyles.dotInner, { backgroundColor: C.primary }]} />
              )}
            </View>
            <Text
              style={[
                stepStyles.label,
                { color: active ? C.primary : done ? C.textSecondary : C.textTertiary },
              ]}
            >
              {s.label}
            </Text>
            {i < STEPS.length - 1 && (
              <View style={[stepStyles.line, { backgroundColor: done ? C.primary : C.border }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  dotCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  line: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 1,
    zIndex: -1,
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
    fontStyle: 'italic',
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

// ─── Score Row (impact 1-10) ──────────────────────────────────────────────────

function ImpactScore({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number) => void;
}) {
  const C = useTheme();
  return (
    <View style={scoreStyles.wrap}>
      <Text style={[scoreStyles.title, { color: C.textSecondary }]}>
        Вплив на ваш бізнес / життя
      </Text>
      <View style={scoreStyles.row}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={[
                scoreStyles.btn,
                {
                  backgroundColor: active ? C.primary : C.surface3,
                },
              ]}
            >
              <Text
                style={[
                  scoreStyles.btnText,
                  { color: active ? C.surface1 : C.textSecondary },
                ]}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={scoreStyles.hints}>
        <Text style={[scoreStyles.hint, { color: C.textTertiary }]}>1 — слабкий</Text>
        <Text style={[scoreStyles.hint, { color: C.textTertiary }]}>10 — дуже сильний</Text>
      </View>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  wrap: { marginBottom: 5 },
  title: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  hints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
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
  // Step 2
  const [conviction, setConviction] = useState('');
  // Step 3
  const [source, setSource] = useState('');
  const [newBelief, setNewBelief] = useState('');
  const [experiment, setExperiment] = useState('');
  const [identity, setIdentity] = useState('');
  const [score, setScore] = useState<number | null>(null);

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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            onPress={() => (step === 0 ? router.back() : prevStep())}
          >
            <Text style={[styles.headerBack, { color: C.textSecondary }]}>
              {step === 0 ? '✕' : '←'}
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: C.text }]}>
            Нова установка
          </Text>
          <View style={{ width: 32 }} />
        </View>

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
            {/* Step 0: belief */}
            {step === 0 && (
              <View>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Яка установка вас обмежує?
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Починайте з «Я не можу...», «Мені важко...», «Завжди так...»
                </Text>

                <StyledInput
                  label="Установка"
                  placeholder="Я не можу підвищити ціни..."
                  value={beliefText}
                  onChangeText={setBeliefText}
                  minHeight={120}
                />

                <View style={[styles.tipCard, { backgroundColor: C.surface3 }]}>
                  <Text style={[styles.tipText, { color: C.textSecondary }]}>
                    💡 Підказка: згадайте ситуацію, де ви кажете собі «я не можу», «це не для мене» або «завжди так виходить».
                  </Text>
                </View>
              </View>
            )}

            {/* Step 1: conviction */}
            {step === 1 && (
              <View>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Яке переконання за цим стоїть?
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Чому ви в це вірите? Звідки це переконання?
                </Text>

                <View style={[styles.beliefPreview, { backgroundColor: C.surface3, borderColor: C.border }]}>
                  <Text style={[styles.beliefPreviewLabel, { color: C.textTertiary }]}>
                    Ваша установка
                  </Text>
                  <Text style={[styles.beliefPreviewText, { color: C.text }]}>
                    «{beliefText}»
                  </Text>
                </View>

                <StyledInput
                  label="Переконання"
                  placeholder="Якщо підніму ціни — клієнти підуть..."
                  value={conviction}
                  onChangeText={setConviction}
                  minHeight={100}
                />
              </View>
            )}

            {/* Step 2: optional details */}
            {step === 2 && (
              <View>
                <Text style={[styles.stepTitle, { color: C.text }]}>
                  Деталі для глибшої роботи
                </Text>
                <Text style={[styles.stepHint, { color: C.textSecondary }]}>
                  Ці поля допоможуть у проходженні 6 етапів. Можна пропустити або заповнити пізніше.
                </Text>

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
                    🤖 AI допоможе заповнити
                  </Text>
                </Pressable>

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
                <StyledInput
                  label="Нова ідентичність"
                  placeholder="Я підприємець, який цінує свою роботу..."
                  value={identity}
                  onChangeText={setIdentity}
                  optional
                  minHeight={70}
                />

                <ImpactScore value={score} onChange={setScore} />
              </View>
            )}
          </Animated.View>

          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Bottom buttons */}
        <View style={[styles.footer, { backgroundColor: C.surface1, borderTopColor: C.border }]}>
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
              <Text style={styles.nextBtnText}>Далі →</Text>
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
                <Text style={styles.nextBtnText}>Зберегти установку ✓</Text>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  headerBack: {
    fontFamily: FontFamily.sans,
    fontSize: 20,
    fontWeight: '400',
    width: 32,
    textAlign: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    fontWeight: '700',
  },

  stepIndicatorWrap: {
    paddingTop: 5,
  },

  content: {
    paddingHorizontal: 5,
  },

  stepTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 2,
  },
  stepHint: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },

  tipCard: {
    borderRadius: Radius.sm,
    padding: 4,
    marginTop: 2,
  },
  tipText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
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
    fontFamily: FontFamily.serif,
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
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

  footer: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderTopWidth: 1,
  },
  nextBtn: {
    paddingVertical: 15,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1714',
  },
});
