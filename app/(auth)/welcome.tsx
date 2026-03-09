import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';

const { width, height } = Dimensions.get('window');
const C = Colors;

// Staggered animation helper
function useEntrance(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

function useScaleEntrance(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleX, {
          toValue: 1,
          speed: 12,
          bounciness: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return { opacity, transform: [{ scaleX }] };
}

export default function WelcomeScreen() {
  // Staggered entrance per element
  const glowStyle  = useEntrance(0);
  const badgeStyle = useEntrance(200);
  const logoStyle  = useEntrance(380);
  const lineStyle  = useScaleEntrance(560);
  const taglineStyle = useEntrance(620);
  const descStyle  = useEntrance(780);
  const btnStyle   = useEntrance(920);
  const signinStyle = useEntrance(1020);

  return (
    <View style={styles.root}>
      {/* Background ambient glow */}
      <Animated.View style={[styles.glowOuter, glowStyle]}>
        <View style={styles.glowInner} />
      </Animated.View>

      <SafeAreaView style={styles.safe}>
        <View style={styles.layout}>

          {/* ── Top spacer ── */}
          <View style={styles.topSpacer} />

          {/* ── Center block ── */}
          <View style={styles.center}>

            {/* DANGROW badge */}
            <Animated.View style={[styles.badge, badgeStyle]}>
              <Text style={styles.badgeText}>DANGROW ECOSYSTEM</Text>
            </Animated.View>

            {/* Logo */}
            <Animated.Text style={[styles.logo, logoStyle]}>
              МАСШТАБ
            </Animated.Text>

            {/* Decorative line */}
            <View style={styles.lineWrap}>
              <Animated.View style={[styles.line, lineStyle]} />
            </View>

            {/* Tagline */}
            <Animated.Text style={[styles.tagline, taglineStyle]}>
              Розшир свої межі
            </Animated.Text>

            {/* Description */}
            <Animated.Text style={[styles.description, descStyle]}>
              Інструмент для підприємців,{'\n'}
              які готові зростати зсередини
            </Animated.Text>

          </View>

          {/* ── Bottom block ── */}
          <View style={styles.bottom}>

            {/* Primary CTA */}
            <Animated.View style={[styles.btnWrap, btnStyle]}>
              <Button
                label="Почати"
                onPress={() => router.push('/onboarding/social-proof')}
                variant="primary"
                size="lg"
                style={styles.btn}
              />
            </Animated.View>

            {/* Sign in link */}
            <Animated.View style={signinStyle}>
              <Pressable
                onPress={() => router.push('/(auth)/sign-in')}
                style={({ pressed }) => [styles.signinBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.signinText}>
                  Вже маю акаунт
                  <Text style={styles.signinAccent}> · Увійти</Text>
                </Text>
              </Pressable>
            </Animated.View>

          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  safe: {
    flex: 1,
  },
  layout: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
  },

  // Background glow
  glowOuter: {
    position: 'absolute',
    top: height * 0.1,
    left: '50%',
    marginLeft: -(width * 0.7),
    width: width * 1.4,
    height: width * 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.7,
    backgroundColor: 'rgba(212, 165, 116, 0.045)',
  },

  // Sections
  topSpacer: {
    height: height * 0.08,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.xxl,
  },
  bottom: {
    paddingBottom: Spacing.xl,
    gap: Spacing.base,
  },

  // Badge
  badge: {
    borderWidth: 1,
    borderColor: C.borderMedium,
    borderRadius: 100,
    paddingHorizontal: Spacing.base,
    paddingVertical: 5,
    marginBottom: Spacing.xl,
  },
  badgeText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2.5,
    color: C.textTertiary,
  },

  // Logo
  logo: {
    fontFamily: FontFamily.serifBold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: 6,
    color: C.primary,
    textAlign: 'center',
  },

  // Decorative line
  lineWrap: {
    width: 64,
    height: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  line: {
    width: '100%',
    height: 1,
    backgroundColor: C.primary,
    opacity: 0.6,
  },

  // Tagline
  tagline: {
    fontFamily: FontFamily.serifItalic,
    fontSize: 22,
    lineHeight: 30,
    color: C.text,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },

  // Description
  description: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 23,
    color: C.textSecondary,
    textAlign: 'center',
  },

  // Button
  btnWrap: {
    width: '100%',
  },
  btn: {
    width: '100%',
  },

  // Sign in
  signinBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  signinText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: C.textTertiary,
  },
  signinAccent: {
    color: C.primary,
    fontFamily: FontFamily.sansSemiBold,
  },
});
