import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useBeliefs, getBeliefTitle, getBeliefCategory, getCompletedStages } from '@/hooks/useBeliefs';
import { useJournal } from '@/hooks/useJournal';
import { RingProgress } from '@/components/charts/RingProgress';
import { CATEGORY_MAP } from '@/constants/categories';
import { STAGE_COLORS } from '@/constants/stages';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { formatDisplayDate } from '@/utils/dates';

// ─── Energy Slider ────────────────────────────────────────────────────────────

function EnergySlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const C = useTheme();

  const getEmoji = (v: number) => {
    if (v <= 2) return '😩';
    if (v <= 4) return '😕';
    if (v === 5) return '😐';
    if (v <= 7) return '🙂';
    if (v <= 8) return '😊';
    return '🔥';
  };

  const getColor = (v: number) => {
    if (v <= 3) return '#C47B8A';
    if (v <= 5) return '#E8976B';
    if (v <= 7) return '#7BB8C9';
    return '#7CB392';
  };

  const color = getColor(value);

  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.emoji}>{getEmoji(value)}</Text>
        <Text style={[sliderStyles.value, { color }]}>{value}/10</Text>
      </View>

      <View style={sliderStyles.segments}>
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          const active = n <= value;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={[
                sliderStyles.segment,
                { backgroundColor: active ? color : C.surface3 },
                n === 1 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                n === 10 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
              ]}
            />
          );
        })}
      </View>

      <View style={sliderStyles.hints}>
        <Text style={[sliderStyles.hint, { color: C.textTertiary }]}>😩 Виснажений</Text>
        <Text style={[sliderStyles.hint, { color: C.textTertiary }]}>Заряджений 🔥</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emoji: { fontSize: 28 },
  value: { fontFamily: FontFamily.serifBold, fontSize: 28, letterSpacing: -0.5 },
  segments: { flexDirection: 'row', gap: 3, height: 32 },
  segment: { flex: 1 },
  hints: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { fontFamily: FontFamily.sansMedium, fontSize: 11 },
});

// ─── Belief Progress Row ──────────────────────────────────────────────────────

function BeliefProgressRow({ ub, weekCount }: { ub: import('@/types').UserBelief; weekCount: number }) {
  const C = useTheme();
  const catKey = getBeliefCategory(ub);
  const cat = catKey ? CATEGORY_MAP[catKey] : null;
  const color = catKey ? (STAGE_COLORS as Record<string, string>)[catKey] ?? C.primary : C.primary;
  const completed = getCompletedStages(ub);
  const title = getBeliefTitle(ub);

  return (
    <View style={[beliefStyles.row, { borderBottomColor: C.border }]}>
      <RingProgress progress={completed} color={color} size={40} strokeWidth={3} animated={false} />
      <View style={beliefStyles.info}>
        <Text style={[beliefStyles.title, { color: C.text }]} numberOfLines={1}>
          {cat?.icon} {title}
        </Text>
        <Text style={[beliefStyles.sub, { color: C.textSecondary }]}>
          {completed}/6 етапів
          {weekCount > 0 && ` · +${weekCount} цього тижня`}
        </Text>
      </View>
      <View style={[beliefStyles.stageBadge, { backgroundColor: color + '20' }]}>
        <Text style={[beliefStyles.stageBadgeText, { color }]}>{completed}/6</Text>
      </View>
    </View>
  );
}

const beliefStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1 },
  title: { fontFamily: FontFamily.sansMedium, fontSize: 13, lineHeight: 18 },
  sub: { fontFamily: FontFamily.sansMedium, fontSize: 11, marginTop: 2 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  stageBadgeText: { fontFamily: FontFamily.sansSemiBold, fontSize: 11 },
});

// ─── Textarea field ───────────────────────────────────────────────────────────

function Textarea({
  label,
  icon,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const C = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={textareaStyles.wrap}>
      <View style={textareaStyles.labelRow}>
        <Text style={textareaStyles.icon}>{icon}</Text>
        <Text style={[textareaStyles.label, { color: C.textSecondary }]}>{label}</Text>
      </View>
      <TextInput
        style={[
          textareaStyles.input,
          {
            backgroundColor: C.surface2,
            color: C.text,
            borderColor: focused ? C.primary : C.border,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
        multiline
        textAlignVertical="top"
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const textareaStyles = StyleSheet.create({
  wrap: { gap: Spacing.sm, marginBottom: Spacing.xl },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 16 },
  label: { fontFamily: FontFamily.sansSemiBold, fontSize: 13 },
  input: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.base,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 100,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WeeklyRitualScreen() {
  const C = useTheme();
  const { beliefs, fetchBeliefs } = useBeliefs();
  const { weeklyEntries, fetchWeeklyEntries, saveEntry } = useJournal();

  const [winsOfWeek, setWinsOfWeek] = useState('');
  const [didntWork, setDidntWork] = useState('');
  const [focusNextWeek, setFocusNextWeek] = useState('');
  const [energyLevel, setEnergyLevel] = useState(7);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBeliefs();
      fetchWeeklyEntries();
    }, [fetchBeliefs, fetchWeeklyEntries]),
  );

  // Count stage completions per belief this week
  const weekStageCountByBelief = weeklyEntries.reduce<Record<string, number>>((acc, e) => {
    if (e.type === 'stage' && e.user_belief_id) {
      acc[e.user_belief_id] = (acc[e.user_belief_id] ?? 0) + 1;
    }
    return acc;
  }, {});

  const canSave = winsOfWeek.trim().length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveEntry('weekly', {
        wins_of_week: winsOfWeek.trim(),
        didnt_work: didntWork.trim(),
        focus_next_week: focusNextWeek.trim(),
        belief_progress_note: '',
        energy_level: energyLevel,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  // Compute week range label
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const weekLabel = `${formatDisplayDate(weekStart)} — ${formatDisplayDate(today)}`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: C.textSecondary }]}>✕</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>📊</Text>
          <Text style={[styles.headerTitle, { color: C.text }]}>Тижневий підсумок</Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* Week label */}
          <Text style={[styles.weekLabel, { color: C.textTertiary }]}>{weekLabel}</Text>

          {/* ─── Beliefs progress (read-only) ─── */}
          {beliefs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🧠</Text>
                <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>
                  Прогрес установок
                </Text>
              </View>
              <View style={[styles.beliefCard, { backgroundColor: C.surface2, ...Shadow.sm }]}>
                {beliefs.map((ub) => (
                  <BeliefProgressRow
                    key={ub.id}
                    ub={ub}
                    weekCount={weekStageCountByBelief[ub.id] ?? 0}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ─── Text fields ─── */}
          <View style={styles.section}>
            <Textarea
              label="Що вийшло цього тижня?"
              icon="🏆"
              placeholder="Мої перемоги, досягнення, результати..."
              value={winsOfWeek}
              onChange={setWinsOfWeek}
            />
            <Textarea
              label="Що НЕ вийшло?"
              icon="😤"
              placeholder="Без самокритики — просто факти..."
              value={didntWork}
              onChange={setDidntWork}
            />
            <Textarea
              label="Фокус наступного тижня"
              icon="🎯"
              placeholder="3 ключові речі, на яких зосередитись..."
              value={focusNextWeek}
              onChange={setFocusNextWeek}
            />
          </View>

          {/* ─── Energy level ─── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⚡</Text>
              <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>
                Рівень енергії за тиждень
              </Text>
            </View>
            <View style={[styles.energyCard, { backgroundColor: C.surface2, ...Shadow.sm }]}>
              <EnergySlider value={energyLevel} onChange={setEnergyLevel} />
            </View>
          </View>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: C.border, backgroundColor: C.surface1 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: C.primary },
              !canSave && { opacity: 0.4 },
              saving && { opacity: 0.6 },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? (
              <ActivityIndicator color={C.surface1} size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: C.surface1 }]}>
                Завершити тиждень ✓
              </Text>
            )}
          </Pressable>
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { width: 36, alignItems: 'center' },
  closeText: { fontFamily: FontFamily.sans, fontSize: 20 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerEmoji: { fontSize: 18 },
  headerTitle: { fontFamily: FontFamily.serifBold, fontSize: 18, letterSpacing: -0.2 },

  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  weekLabel: { fontFamily: FontFamily.sansMedium, fontSize: 12, marginBottom: Spacing.lg },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  beliefCard: { borderRadius: Radius.lg, padding: Spacing.base },
  energyCard: { borderRadius: Radius.lg, padding: Spacing.base },

  footer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontFamily: FontFamily.sansBold, fontSize: 15 },
});
