import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { useBeliefs } from '@/hooks/useBeliefs';
import { useTasks } from '@/hooks/useTasks';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { Language, ThemeMode } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  standard: 'Standard',
  premium: 'Premium',
};

const TIER_COLORS: Record<string, string> = {
  free: '#888',
  standard: '#7BB8C9',
  premium: '#C8FF00',
};

const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: 'uk', label: 'Українська' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: import('@/components/ui/Icon').IconName }[] = [
  { value: 'auto', label: 'Авто', icon: 'SunMoon' },
  { value: 'dark', label: 'Темна', icon: 'Moon' },
  { value: 'light', label: 'Світла', icon: 'Sun' },
];

const DAY_OPTIONS = [
  { value: 1, label: 'Понеділок' },
  { value: 2, label: 'Вівторок' },
  { value: 3, label: 'Середа' },
  { value: 4, label: 'Четвер' },
  { value: 5, label: "П'ятниця" },
  { value: 6, label: 'Субота' },
  { value: 0, label: 'Неділя' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: `${String(i).padStart(2, '0')}:00`,
  label: `${String(i).padStart(2, '0')}:00`,
}));

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatColumn({ value, label, colors }: {
  value: string | number;
  label: string;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={statStyles.col}>
      <Text style={[statStyles.value, { color: colors.primary }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', gap: 3 },
  value: { fontFamily: FontFamily.serifBold, fontSize: 26 },
  label: { fontFamily: FontFamily.sans, fontSize: 11, textAlign: 'center', lineHeight: 15 },
});

function SettingRow({
  icon, label, value, onPress, colors, danger = false,
}: {
  icon: import('@/components/ui/Icon').IconName;
  label: string;
  value?: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        settingStyles.row,
        { borderBottomColor: colors.border },
        pressed && { opacity: 0.65 },
      ]}
      onPress={onPress}
    >
      <Icon name={icon} size={18} color={danger ? colors.error : colors.textSecondary} />
      <Text style={[settingStyles.label, { color: danger ? colors.error : colors.text }]}>
        {label}
      </Text>
      <View style={{ flex: 1 }} />
      {value && (
        <Text style={[settingStyles.value, { color: colors.primary }]}>{value}</Text>
      )}
      {!danger && (
        <Icon name="ChevronRight" size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  icon: { width: 24 },
  label: { fontFamily: FontFamily.sansMedium, fontSize: 15 },
  value: { fontFamily: FontFamily.sansSemiBold, fontSize: 13 },
  arrow: { fontFamily: FontFamily.sans, fontSize: 20, marginLeft: 4 },
});

// ─── Generic picker modal ─────────────────────────────────────────────────────

function PickerModal<T extends string | number>({
  visible, title, options, selected, onSelect, onClose, colors,
}: {
  visible: boolean;
  title: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose} />
      <View style={[pickerStyles.sheet, { backgroundColor: C_PLACEHOLDER }]}>
        {/* We need colors inside — pass via inline */}
        <PickerSheet
          title={title}
          options={options}
          selected={selected}
          onSelect={onSelect}
          onClose={onClose}
          colors={colors}
        />
      </View>
    </Modal>
  );
}

// Separate inner component to properly use colors
function PickerSheet<T extends string | number>({
  title, options, selected, onSelect, onClose, colors,
}: {
  title: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[pickerStyles.sheetInner, { backgroundColor: colors.surface2 }]}>
      <View style={[pickerStyles.handle, { backgroundColor: colors.border }]} />
      <Text style={[pickerStyles.title, { color: colors.text }]}>{title}</Text>
      <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <Pressable
            key={String(opt.value)}
            style={({ pressed }) => [
              pickerStyles.optRow,
              { borderBottomColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              onSelect(opt.value);
              onClose();
            }}
          >
            <Text style={[pickerStyles.optLabel, { color: colors.text }]}>{opt.label}</Text>
            {selected === opt.value && (
              <Icon name="Check" size={16} color={colors.primary} strokeWidth={2.5} />
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// Placeholder color needed for outer View; actual color applied inside PickerSheet
const C_PLACEHOLDER = 'transparent';

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: { justifyContent: 'flex-end' },
  sheetInner: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optLabel: { fontFamily: FontFamily.sansMedium, fontSize: 15, flex: 1 },
  checkmark: { fontFamily: FontFamily.sansBold, fontSize: 17 },
});

// ─── Theme Picker (inline 3-button toggle) ────────────────────────────────────

function ThemeModal({ visible, selected, onSelect, onClose, colors }: {
  visible: boolean;
  selected: ThemeMode;
  onSelect: (v: ThemeMode) => void;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose} />
      <View style={[pickerStyles.sheetInner, { backgroundColor: colors.surface2 }]}>
        <View style={[pickerStyles.handle, { backgroundColor: colors.border }]} />
        <Text style={[pickerStyles.title, { color: colors.text }]}>Тема</Text>
        <View style={themeStyles.row}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                themeStyles.option,
                {
                  backgroundColor:
                    selected === opt.value ? colors.primary + '22' : colors.surface3,
                  borderColor:
                    selected === opt.value ? colors.primary : 'transparent',
                },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => { onSelect(opt.value); onClose(); }}
            >
              <Icon name={opt.icon} size={20} color={selected === opt.value ? colors.primary : colors.textSecondary} />
              <Text style={[themeStyles.optLabel, { color: colors.text }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 32 }} />
      </View>
    </Modal>
  );
}

const themeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: 6,
  },
  optIcon: { fontSize: 24 },
  optLabel: { fontFamily: FontFamily.sansMedium, fontSize: 13 },
});

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, colors }: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={[sectionStyles.title, { color: colors.textTertiary }]}>{title}</Text>
      <View style={[sectionStyles.card, { backgroundColor: colors.surface2, ...Shadow.sm }]}>
        {children}
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  title: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  card: { borderRadius: Radius.lg, overflow: 'hidden' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const C = useTheme();
  const { profile, streak, fetchProfile, fetchStreak, updateProfile } = useProfile();
  const { beliefs } = useBeliefs();
  const { tasks } = useTasks();

  const [signingOut, setSigningOut] = useState(false);
  const [completedBeliefsCount, setCompletedBeliefsCount] = useState(0);
  const [completedTasksMonth, setCompletedTasksMonth] = useState(0);

  // Modal states
  const [showLang, setShowLang] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showMorning, setShowMorning] = useState(false);
  const [showEvening, setShowEvening] = useState(false);
  const [showWeekDay, setShowWeekDay] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchStreak();
      fetchCompletedStats();
    }, []),
  );

  const fetchCompletedStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count: beliefCount } = await supabase
      .from('user_beliefs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null);

    setCompletedBeliefsCount(beliefCount ?? 0);

    // Tasks completed this calendar month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: taskCount } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('date', monthStart.toISOString().split('T')[0]);

    setCompletedTasksMonth(taskCount ?? 0);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSignOut = () => {
    Alert.alert(
      'Вийти з акаунту',
      'Ваші дані збережені в хмарі — ви завжди зможете увійти знову.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Вийти',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await supabase.auth.signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ],
    );
  };

  const initials = profile?.name
    ? profile.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const tierLabel = TIER_LABELS[profile?.subscription_tier ?? 'free'];
  const tierColor = TIER_COLORS[profile?.subscription_tier ?? 'free'];

  const morningTime = profile?.morning_reminder?.slice(0, 5) ?? '08:00';
  const eveningTime = profile?.evening_reminder?.slice(0, 5) ?? '20:00';
  const weekDay = DAY_OPTIONS.find((d) => d.value === (profile?.weekly_checkin_day ?? 0))?.label ?? 'Неділя';
  const langLabel = LANG_OPTIONS.find((l) => l.value === (profile?.language ?? 'uk'))?.label.split('  ')[1] ?? 'Українська';
  const themeLabel = THEME_OPTIONS.find((t) => t.value === (profile?.theme_mode ?? 'auto'))?.label ?? 'Авто';

  const expiresText = profile?.subscription_expires
    ? new Date(profile.subscription_expires).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Avatar + name ─── */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: C.primary + '22', borderColor: C.primary + '55' }]}>
            <Text style={[styles.avatarInitial, { color: C.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: C.text }]}>
            {profile?.name ?? 'Підприємець'}
          </Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '22' }]}>
            <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
            <Text style={[styles.tierLabel, { color: tierColor }]}>{tierLabel}</Text>
          </View>
        </View>

        {/* ─── Stats ─── */}
        <View style={[styles.statsCard, { backgroundColor: C.surface2, ...Shadow.sm }]}>
          <StatColumn value={completedBeliefsCount} label={'Установок\nзавершено'} colors={C} />
          <View style={[styles.statDivider, { backgroundColor: C.border }]} />
          <StatColumn value={streak} label={'Днів\nстрик'} colors={C} />
          <View style={[styles.statDivider, { backgroundColor: C.border }]} />
          <StatColumn value={completedTasksMonth} label={'Задач\nцього місяця'} colors={C} />
        </View>

        {/* ─── Налаштування ─── */}
        <Section title="Налаштування" colors={C}>
          <SettingRow
            icon="Globe"
            label="Мова"
            value={langLabel}
            onPress={() => setShowLang(true)}
            colors={C}
          />
          <SettingRow
            icon="SunMoon"
            label="Тема"
            value={themeLabel}
            onPress={() => setShowTheme(true)}
            colors={C}
          />
          <SettingRow
            icon="Bell"
            label="Ранковий ритуал"
            value={morningTime}
            onPress={() => setShowMorning(true)}
            colors={C}
          />
          <SettingRow
            icon="Moon"
            label="Вечірній ритуал"
            value={eveningTime}
            onPress={() => setShowEvening(true)}
            colors={C}
          />
          <SettingRow
            icon="BarChart2"
            label="Тижневий підсумок"
            value={weekDay}
            onPress={() => setShowWeekDay(true)}
            colors={C}
          />
        </Section>

        {/* ─── Інструменти ─── */}
        <Section title="Інструменти" colors={C}>
          <SettingRow
            icon="RefreshCw"
            label="Пройти діагностику знову"
            onPress={() => router.push('/onboarding/diagnostic')}
            colors={C}
          />
          <SettingRow
            icon="TrendingUp"
            label="Профіль установок"
            onPress={() => router.push('/onboarding/results')}
            colors={C}
          />
        </Section>

        {/* ─── Підписка ─── */}
        <Section title="Підписка" colors={C}>
          <View style={subStyles.info}>
            <View>
              <Text style={[subStyles.planName, { color: C.text }]}>
                {tierLabel} план
              </Text>
              {expiresText && (
                <Text style={[subStyles.expires, { color: C.textTertiary }]}>
                  Діє до {expiresText}
                </Text>
              )}
            </View>
            {(profile?.subscription_tier ?? 'free') !== 'premium' && (
              <Pressable
                style={({ pressed }) => [
                  subStyles.upgradeBtn,
                  { backgroundColor: C.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => router.push('/onboarding/paywall')}
              >
                <Text style={[subStyles.upgradeBtnText, { color: C.surface1 }]}>
                  Оновити план
                </Text>
              </Pressable>
            )}
          </View>
        </Section>

        {/* ─── Sign out ─── */}
        <View style={[styles.signOutCard, { backgroundColor: C.surface2, ...Shadow.sm }]}>
          <Pressable
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color="#C47B8A" size="small" />
            ) : (
              <Text style={styles.signOutText}>Вийти з акаунту</Text>
            )}
          </Pressable>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* ─── Pickers ─── */}
      <PickerModal
        visible={showLang}
        title="Мова"
        options={LANG_OPTIONS}
        selected={profile?.language ?? 'uk'}
        onSelect={(v) => updateProfile({ language: v as Language })}
        onClose={() => setShowLang(false)}
        colors={C}
      />

      <ThemeModal
        visible={showTheme}
        selected={profile?.theme_mode ?? 'auto'}
        onSelect={(v) => updateProfile({ theme_mode: v })}
        onClose={() => setShowTheme(false)}
        colors={C}
      />

      <PickerModal
        visible={showMorning}
        title="Ранковий ритуал"
        options={HOUR_OPTIONS}
        selected={morningTime}
        onSelect={(v) => updateProfile({ morning_reminder: v as string })}
        onClose={() => setShowMorning(false)}
        colors={C}
      />

      <PickerModal
        visible={showEvening}
        title="Вечірній ритуал"
        options={HOUR_OPTIONS}
        selected={eveningTime}
        onSelect={(v) => updateProfile({ evening_reminder: v as string })}
        onClose={() => setShowEvening(false)}
        colors={C}
      />

      <PickerModal
        visible={showWeekDay}
        title="День тижневого підсумку"
        options={DAY_OPTIONS}
        selected={profile?.weekly_checkin_day ?? 0}
        onSelect={(v) => updateProfile({ weekly_checkin_day: v as number })}
        onClose={() => setShowWeekDay(false)}
        colors={C}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInitial: {
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
  },
  name: {
    fontFamily: FontFamily.serifBold,
    fontSize: 24,
    lineHeight: 30,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierLabel: { fontFamily: FontFamily.sansSemiBold, fontSize: 12 },

  statsCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },

  signOutCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  signOutBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    color: '#C47B8A',
  },
});

const subStyles = StyleSheet.create({
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
  },
  planName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
  },
  expires: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    marginTop: 2,
  },
  upgradeBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  upgradeBtnText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 13,
  },
});
