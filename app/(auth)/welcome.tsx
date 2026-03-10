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
import { FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

const { width, height } = Dimensions.get('window');
const C = Colors;

function useEntrance(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

export default function WelcomeScreen() {
  const chipStyle = useEntrance(200);
  const logoStyle = useEntrance(300);
  const sloganStyle = useEntrance(500);
  const descStyle = useEntrance(600);
  const btnStyle = useEntrance(800);
  const linkStyle = useEntrance(900);

  return (
    <View style={S.root}>
      {/* Radial glow */}
      <View style={S.glowWrap}>
        <View style={S.glow} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={S.layout}>

          {/* Chip */}
          <Animated.View style={[S.chip, chipStyle]}>
            <Text style={S.chipText}>DANGROW ECOSYSTEM</Text>
          </Animated.View>

          {/* Center content */}
          <View style={S.center}>
            <Animated.Text style={[S.logo, logoStyle]}>
              МАСШТАБ
            </Animated.Text>

            <Animated.Text style={[S.slogan, sloganStyle]}>
              Розшир свої межі
            </Animated.Text>

            <Animated.Text style={[S.desc, descStyle]}>
              Перепрошивай установки, масштабуй бізнес, приймай сміливі рішення
            </Animated.Text>
          </View>

          {/* Bottom */}
          <View style={S.bottom}>
            <Animated.View style={[{ width: '100%' }, btnStyle]}>
              <Pressable
                onPress={() => router.push('/onboarding/social-proof')}
                style={({ pressed }) => [
                  S.cta,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={S.ctaText}>Почати</Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={linkStyle}>
              <Pressable
                onPress={() => router.push('/(auth)/sign-in')}
                style={({ pressed }) => [S.loginBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={S.loginText}>
                  Вже маю акаунт · <Text style={S.loginAccent}>Увійти</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  layout: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: 48, paddingBottom: 48 },

  // Glow
  glowWrap: { position: 'absolute', top: '20%', left: '50%', marginLeft: -250 },
  glow: { width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(200, 255, 0, 0.06)' },

  // Chip
  chip: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(200, 255, 0, 0.2)',
    marginBottom: 64,
  },
  chipText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.88,
    color: C.primary,
    textTransform: 'uppercase',
  },

  // Center
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 72,
    color: C.primary,
    letterSpacing: -2.16,
    lineHeight: 72,
    marginBottom: 24,
    textAlign: 'center',
  },
  slogan: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 18,
    color: C.text,
    letterSpacing: -0.18,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
    textAlign: 'center',
    maxWidth: 340,
  },

  // Bottom
  bottom: { gap: 20, alignItems: 'center' },
  cta: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
    color: '#060810',
  },
  loginBtn: { paddingVertical: 8 },
  loginText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    color: '#A3AEC4',
  },
  loginAccent: {
    color: C.primary,
  },
});
