import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Animated,
  Switch,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors as C } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const { width: SW } = Dimensions.get('window');

// ─── Config ───────────────────────────────────────────────────────────────────

type Plan = 'monthly' | 'annual';

const PLANS = {
  monthly: {
    label: 'Місячний',
    price: '299₴',
    priceNum: 299,
    period: '/місяць',
    perDay: null as string | null,
    badge: null as string | null,
  },
  annual: {
    label: 'Річний',
    price: '2 499₴',
    priceNum: 2499,
    period: '/рік',
    perDay: '6.8₴/день',
    badge: 'Економія 40%',
  },
} as const;

const FEATURES = [
  'Повна бібліотека 30+ установок',
  '6-етапна методологія трансформації',
  'AI-коуч з повним контекстом',
  'Щоденні ритуали і трекер прогресу',
  'Планувальник цілей і задач',
  'Колесо балансу',
];

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
}) {
  const data = PLANS[plan];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard,
        selected && styles.planCardSelected,
        pressed && { opacity: 0.9 },
      ]}
    >
      {selected && <View style={styles.planGlow} />}

      <View style={styles.planTop}>
        <View style={styles.planLeft}>
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected && <View style={styles.radioDot} />}
          </View>
          <Text style={[styles.planLabel, selected && { color: C.primary }]}>
            {data.label}
          </Text>
          {data.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{data.badge}</Text>
            </View>
          )}
        </View>

        <View style={styles.planRight}>
          <Text style={[styles.planPrice, selected && { color: C.text }]}>
            {data.price}
          </Text>
          <Text style={styles.planPeriod}>{data.period}</Text>
        </View>
      </View>

      {data.perDay && (
        <Text style={styles.perDay}>{data.perDay} · дешевше за каву</Text>
      )}
    </Pressable>
  );
}

// ─── Feature row ──────────────────────────────────────────────────────────────

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.checkWrap}>
        <Icon name="Check" size={11} color={C.primary} strokeWidth={2.5} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [showClose, setShowClose] = useState(false);
  const [loading, setLoading] = useState(false);

  const closeOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(16)).current;

  // Show close button after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowClose(true);
      Animated.timing(closeOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 450, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const ctaLabel = trialEnabled
    ? 'Почати 7 днів безкоштовно'
    : 'Почати трансформацію';

  const handleSubscribe = async () => {
    setLoading(true);
    // TODO: RevenueCat purchase flow
    // For now navigate to sign-up
    router.push('/(auth)/sign-up');
    setLoading(false);
  };

  const handleClose = () => {
    if (!showClose) return;
    router.push('/(auth)/sign-up');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Close button — appears after 3s */}
        <Animated.View style={[styles.closeWrap, { opacity: closeOpacity }]}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            disabled={!showClose}
          >
            <Icon name="X" size={20} color={C.textSecondary} />
          </Pressable>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: contentOpacity, transform: [{ translateY: contentY }] },
            ]}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.heroIconWrap}>
                <Icon name="Target" size={32} color={C.primary} />
              </View>
              <Text style={styles.heroTitle}>
                Ваш персональний{'\n'}коуч за ціну кави
              </Text>
              <Text style={styles.heroSubtitle}>
                Системна робота з обмежуючими установками,{'\n'}
                яка дає вимірюваний результат
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresCard}>
              {FEATURES.map((f) => (
                <FeatureRow key={f} text={f} />
              ))}
            </View>

            {/* Trial toggle */}
            <View style={styles.trialRow}>
              <View style={styles.trialLeft}>
                <Text style={styles.trialTitle}>7-денний безкоштовний період</Text>
                <Text style={styles.trialSub}>Скасуйте до закінчення — не спишемо нічого</Text>
              </View>
              <Switch
                value={trialEnabled}
                onValueChange={setTrialEnabled}
                trackColor={{ false: C.surface3, true: C.primary + '60' }}
                thumbColor={trialEnabled ? C.primary : C.textTertiary}
                ios_backgroundColor={C.surface3}
              />
            </View>

            {/* Plans */}
            <View style={styles.plans}>
              <PlanCard
                plan="annual"
                selected={selectedPlan === 'annual'}
                onPress={() => setSelectedPlan('annual')}
              />
              <PlanCard
                plan="monthly"
                selected={selectedPlan === 'monthly'}
                onPress={() => setSelectedPlan('monthly')}
              />
            </View>

            {/* Price breakdown */}
            <Text style={styles.priceNote}>
              {selectedPlan === 'annual'
                ? trialEnabled
                  ? '7 днів безкоштовно, потім 2 499₴/рік (6.8₴/день)'
                  : '2 499₴ на рік · 208₴/місяць'
                : trialEnabled
                ? '7 днів безкоштовно, потім 299₴/місяць'
                : '299₴ на місяць'}
            </Text>
          </Animated.View>
        </ScrollView>

        {/* CTA footer */}
        <View style={styles.footer}>
          <Button
            label={ctaLabel}
            onPress={handleSubscribe}
            loading={loading}
            variant="primary"
            size="lg"
            style={styles.ctaBtn}
          />

          {/* Social proof */}
          <View style={styles.socialProof}>
            <View style={styles.socialProofItem}>
              <Icon name="Lock" size={11} color={C.textTertiary} />
              <Text style={styles.socialProofText}>Скасувати будь-коли</Text>
            </View>
            <View style={styles.socialDivider} />
            <Text style={styles.socialProofText}>4.9 · 2 400+ відгуків</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  safe: {
    flex: 1,
  },

  // Close
  closeWrap: {
    position: 'absolute',
    top: 56,
    right: Spacing.screen,
    zIndex: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 16,
  },

  // Scroll
  scroll: {
    paddingBottom: Spacing.base,
  },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },

  // Hero
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontFamily: FontFamily.serifBold,
    fontSize: 30,
    lineHeight: 38,
    color: C.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 22,
    color: C.textSecondary,
    textAlign: 'center',
  },

  // Features
  featuresCard: {
    backgroundColor: C.surface1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: C.border,
    gap: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    width: 11,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: C.text,
    flex: 1,
  },

  // Trial
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: C.border,
    gap: Spacing.base,
  },
  trialLeft: {
    flex: 1,
    gap: 3,
  },
  trialTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 14,
    color: C.text,
  },
  trialSub: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: C.textTertiary,
    lineHeight: 17,
  },

  // Plans
  plans: {
    gap: Spacing.sm,
  },
  planCard: {
    backgroundColor: C.surface1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
    gap: 6,
  },
  planCardSelected: {
    borderColor: C.primary,
    backgroundColor: C.surface2,
  },
  planGlow: {
    position: 'absolute',
    inset: 0,
    backgroundColor: C.primaryLight,
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: C.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },
  planLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    color: C.textSecondary,
  },
  badge: {
    backgroundColor: C.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 10,
    color: '#060810',
    letterSpacing: 0.3,
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  planPrice: {
    fontFamily: FontFamily.serifBold,
    fontSize: 20,
    color: C.textSecondary,
    lineHeight: 24,
  },
  planPeriod: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.textTertiary,
  },
  perDay: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.primary,
    marginLeft: 28,
  },

  // Price note
  priceNote: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.textTertiary,
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
    gap: Spacing.md,
  },
  ctaBtn: {
    width: '100%',
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  socialProofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialProofText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.textTertiary,
  },
  socialDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.textTertiary,
  },
});
