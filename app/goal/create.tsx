import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { useGoals, CreateGoalInput } from '@/hooks/useGoals';
import { useBeliefs, getBeliefTitle } from '@/hooks/useBeliefs';
import { SPHERES, SphereKey } from '@/constants/spheres';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';

type Period = 'year' | 'quarter';

export default function CreateGoalScreen() {
  const C = useTheme();
  const { createGoal } = useGoals();
  const { beliefs } = useBeliefs();

  const [title, setTitle] = useState('');
  const [sphere, setSphere] = useState<SphereKey | null>(null);
  const [period, setPeriod] = useState<Period>('year');
  const [beliefId, setBeliefId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);

  const canSave = title.trim().length >= 3 && sphere !== null;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const input: CreateGoalInput = {
        title: title.trim(),
        sphere: sphere!,
        period,
        user_belief_id: beliefId,
        due_date: dueDate.trim() || null,
      };
      const created = await createGoal(input);
      if (created) {
        router.replace(`/goal/${created.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

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
            onPress={() => router.back()}
          >
            <Icon name="X" size={22} color={C.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: C.text }]}>Нова ціль</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Назва цілі</Text>
            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: C.surface3,
                  color: C.text,
                  borderColor: titleFocused ? C.primary : C.border,
                },
              ]}
              placeholder="Збільшити дохід на 50%..."
              placeholderTextColor={C.textTertiary}
              multiline
              textAlignVertical="top"
              value={title}
              onChangeText={setTitle}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
          </View>

          {/* Sphere */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Сфера</Text>
            <View style={styles.sphereGrid}>
              {SPHERES.map((s) => {
                const active = sphere === s.key;
                return (
                  <Pressable
                    key={s.key}
                    style={({ pressed }) => [
                      styles.sphereBtn,
                      { backgroundColor: active ? s.color + '28' : C.surface3 },
                      active && { borderWidth: 1.5, borderColor: s.color },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => setSphere(s.key)}
                  >
                    <Icon name={s.icon} size={20} color={active ? s.color : C.textTertiary} />
                    <Text
                      style={[
                        styles.sphereName,
                        { color: active ? s.color : C.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {s.nameUk}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Period */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Горизонт</Text>
            <View style={styles.periodRow}>
              {(['year', 'quarter'] as Period[]).map((p) => (
                <Pressable
                  key={p}
                  style={[
                    styles.periodBtn,
                    {
                      backgroundColor: period === p ? C.primary : C.surface3,
                      flex: 1,
                    },
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodBtnText,
                      { color: period === p ? C.surface1 : C.textSecondary },
                    ]}
                  >
                    {p === 'year' ? 'Рік' : 'Квартал'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Belief link (optional) */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>
                Пов'язана установка
              </Text>
              <Text style={[styles.optional, { color: C.textTertiary }]}>опціонально</Text>
            </View>
            {beliefs.length === 0 ? (
              <Text style={[styles.noBeliefs, { color: C.textTertiary }]}>
                Немає активних установок
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beliefScroll}>
                <Pressable
                  style={[
                    styles.beliefChip,
                    {
                      borderColor: beliefId === null ? C.primary : C.border,
                      backgroundColor: beliefId === null ? C.primary + '18' : C.surface3,
                    },
                  ]}
                  onPress={() => setBeliefId(null)}
                >
                  <Text style={[styles.beliefChipText, { color: beliefId === null ? C.primary : C.textSecondary }]}>
                    Без установки
                  </Text>
                </Pressable>
                {beliefs.map((b) => (
                  <Pressable
                    key={b.id}
                    style={[
                      styles.beliefChip,
                      {
                        borderColor: beliefId === b.id ? C.primary : C.border,
                        backgroundColor: beliefId === b.id ? C.primary + '18' : C.surface3,
                      },
                    ]}
                    onPress={() => setBeliefId(b.id)}
                  >
                    <Text
                      style={[styles.beliefChipText, { color: beliefId === b.id ? C.primary : C.textSecondary }]}
                      numberOfLines={1}
                    >
                      {getBeliefTitle(b)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Due date (optional) */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Дедлайн</Text>
              <Text style={[styles.optional, { color: C.textTertiary }]}>опціонально</Text>
            </View>
            <TextInput
              style={[
                styles.dateInput,
                { backgroundColor: C.surface3, color: C.text, borderColor: C.border },
              ]}
              placeholder="РРРР-ММ-ДД"
              placeholderTextColor={C.textTertiary}
              value={dueDate}
              onChangeText={setDueDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>

        {/* Save button */}
        <View style={[styles.footer, { backgroundColor: C.surface1, borderTopColor: C.border }]}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: C.primary },
              !canSave && { opacity: 0.4 },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? (
              <ActivityIndicator color={C.surface1} size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: C.surface1 }]}>
                Створити ціль
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
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  headerBack: {
    fontFamily: FontFamily.sans,
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    fontWeight: '700',
  },

  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },

  fieldGroup: { marginBottom: Spacing.xl },
  fieldLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  optional: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
      },

  titleInput: {
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    padding: Spacing.md,
    fontFamily: FontFamily.serif,
    fontSize: 18,
    lineHeight: 26,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  sphereGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sphereBtn: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 0,
  },
  sphereEmoji: { fontSize: 22 },
  sphereName: {
    fontFamily: FontFamily.sans,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  periodBtn: {
    paddingVertical: 11,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  periodBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
  },

  beliefScroll: { flexGrow: 0 },
  beliefChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
    maxWidth: 200,
  },
  beliefChipText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
  },
  noBeliefs: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
      },

  dateInput: {
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    padding: Spacing.md,
    fontFamily: FontFamily.sans,
    fontSize: 15,
  },

  footer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: FontFamily.sans,
    fontSize: 16,
    fontWeight: '700',
  },
});
