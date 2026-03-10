import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useBeliefs } from '@/hooks/useBeliefs';
import { CATEGORIES, BeliefCategory } from '@/constants/categories';

const BELIEF_EXAMPLES = [
  'Я будую компанію на $10M',
  'Мене шанують клієнти',
  'Я приймаю великі рішення легко',
];

export default function CreateBeliefScreen() {
  const { createCustomBelief } = useBeliefs();

  const [step, setStep] = useState(1);
  const [beliefText, setBeliefText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BeliefCategory | null>(null);
  const [why, setWhy] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!beliefText.trim()) return;
    setSaving(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await createCustomBelief({
        belief: beliefText.trim(),
        conviction: why.trim() || beliefText.trim(),
        score: 7,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const canProceed =
    step === 1 ? beliefText.trim().length > 0 :
    step === 2 ? !!selectedCategory :
    why.trim().length > 0;

  return (
    <SafeAreaView style={S.container}>
      <View style={S.progressContainer}>
        <View style={S.progressBar}>
          <View style={[S.progressFill, { width: `${(step / 3) * 100}%` as `${number}%` }]} />
        </View>
        <Text style={S.progressText}>Крок {step} з 3</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
          {step === 1 && (
            <>
              <Text style={S.title}>Яка твоя нова установка?</Text>
              <Text style={S.subtitle}>
                Почни з "Я..." та опиши те, ким ти хочеш стати. Не пиши "хочу" — пиши ніби це вже реальність.
              </Text>

              <View style={S.inputCard}>
                <TextInput
                  style={S.input}
                  placeholder="Я заробляю $50K/міс"
                  placeholderTextColor="rgba(163, 174, 196, 0.4)"
                  value={beliefText}
                  onChangeText={setBeliefText}
                  multiline
                  numberOfLines={3}
                  autoFocus
                />
              </View>

              <View style={S.examples}>
                <Text style={S.examplesLabel}>ПРИКЛАДИ</Text>
                {BELIEF_EXAMPLES.map((example, index) => (
                  <Pressable
                    key={index}
                    style={S.exampleChip}
                    onPress={() => setBeliefText(example)}
                  >
                    <Text style={S.exampleText}>{example}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={S.title}>Яка сфера життя?</Text>
              <Text style={S.subtitle}>
                Обери категорію, щоб ми могли краще трекати твій прогрес.
              </Text>

              <View style={S.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.key}
                    style={[
                      S.categoryCard,
                      selectedCategory === cat.key && S.categoryCardSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat.key)}
                  >
                    {selectedCategory === cat.key && (
                      <View style={S.categoryCheck}>
                        <Check color="#060810" size={16} strokeWidth={2} />
                      </View>
                    )}
                    <Text
                      style={[
                        S.categoryText,
                        selectedCategory === cat.key && S.categoryTextSelected,
                      ]}
                    >
                      {cat.nameUk}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={S.title}>Чому це важливо?</Text>
              <Text style={S.subtitle}>
                Напиши чесно — для себе. Ніхто це не побачить. Це якір, до якого ти повернешся в моменти сумніву.
              </Text>

              <View style={S.inputCard}>
                <TextInput
                  style={[S.input, S.inputLarge]}
                  placeholder="Тому що..."
                  placeholderTextColor="rgba(163, 174, 196, 0.4)"
                  value={why}
                  onChangeText={setWhy}
                  multiline
                  numberOfLines={6}
                  autoFocus
                />
              </View>
            </>
          )}
        </ScrollView>

        <View style={S.footer}>
          {step > 1 && (
            <Pressable style={S.backBtn} onPress={() => setStep(step - 1)}>
              <ChevronLeft color="#A3AEC4" size={20} strokeWidth={1.5} />
            </Pressable>
          )}
          {step < 3 ? (
            <Pressable
              style={[S.ctaButton, !canProceed && S.ctaButtonDisabled, { flex: 1 }]}
              onPress={() => setStep(step + 1)}
              disabled={!canProceed}
            >
              <Text style={S.ctaButtonText}>Далі</Text>
              <ArrowRight color="#060810" size={20} strokeWidth={2} />
            </Pressable>
          ) : (
            <Pressable
              style={[S.ctaButton, (!canProceed || saving) && S.ctaButtonDisabled, { flex: 1 }]}
              onPress={handleSave}
              disabled={!canProceed || saving}
            >
              {saving ? (
                <ActivityIndicator color="#060810" size="small" />
              ) : (
                <Text style={S.ctaButtonText}>Створити установку</Text>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060810',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(163, 174, 196, 0.12)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#C8FF00',
  },
  progressText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#A3AEC4',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.5,
    color: '#F9FAFF',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
    marginBottom: 24,
  },
  inputCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  input: {
    fontFamily: 'Inter_500Medium',
    fontSize: 17,
    color: '#F9FAFF',
    minHeight: 60,
  },
  inputLarge: {
    minHeight: 120,
  },
  examples: {
    gap: 12,
  },
  examplesLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#A3AEC4',
    marginBottom: 8,
  },
  exampleChip: {
    backgroundColor: '#0B0F18',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  exampleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#F9FAFF',
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 24,
    position: 'relative',
  },
  categoryCardSelected: {
    backgroundColor: '#C8FF00',
  },
  categoryCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#060810',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#F9FAFF',
  },
  categoryTextSelected: {
    color: '#060810',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 174, 196, 0.12)',
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0B0F18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    backgroundColor: '#C8FF00',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaButtonDisabled: {
    backgroundColor: 'rgba(200, 255, 0, 0.3)',
  },
  ctaButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#060810',
  },
});
