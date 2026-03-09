import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors as C } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { supabase } from '@/lib/supabase';
import { syncOnboardingData } from '@/lib/onboarding-storage';
import { Button } from '@/components/ui/Button';

// ─── Social auth button ───────────────────────────────────────────────────────

function SocialButton({
  icon,
  label,
  onPress,
  loading,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
        }
        style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.socialIcon}>{icon}</Text>
        <Text style={styles.socialLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styled input ─────────────────────────────────────────────────────────────

function StyledInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  error,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  error?: string;
  autoCapitalize?: 'none' | 'sentences';
}) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, error ? '#E07B6B' : C.primary],
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Animated.View style={[styles.inputWrap, { borderColor: error ? '#E07B6B' : borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={C.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          style={styles.input}
        />
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<{ email?: string; password?: string; general?: string }>({});
  const [loadingEmail, setLoadingEmail]   = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple]   = useState(false);

  // Validation
  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!email.includes('@') || !email.includes('.')) next.email = 'Введіть правильну email адресу';
    if (password.length < 8) next.password = 'Пароль має бути мінімум 8 символів';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Post-auth: sync onboarding data + navigate to tabs
  const afterAuth = async (userId: string) => {
    await syncOnboardingData(userId, supabase);
    router.replace('/(tabs)/home');
  };

  // Email sign-up
  const handleEmailSignUp = async () => {
    if (!validate()) return;
    setLoadingEmail(true);
    setErrors({});

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrors({ general: error.message });
      setLoadingEmail(false);
      return;
    }
    if (data.user) await afterAuth(data.user.id);
    setLoadingEmail(false);
  };

  // Google OAuth
  // Requires expo-auth-session setup + Supabase Google provider
  const handleGoogle = async () => {
    setLoadingGoogle(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'mashtab://auth/callback' },
    });
    if (error) setErrors({ general: error.message });
    // Navigation handled via deep link listener in _layout.tsx
    setLoadingGoogle(false);
  };

  // Apple OAuth
  // Requires expo-apple-authentication + Supabase Apple provider
  const handleApple = async () => {
    setLoadingApple(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: 'mashtab://auth/callback' },
    });
    if (error) setErrors({ general: error.message });
    setLoadingApple(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Почнімо</Text>
            <Text style={styles.subtitle}>
              Створіть акаунт, щоб зберегти результати діагностики і почати роботу
            </Text>
          </View>

          {/* Social auth */}
          <View style={styles.socialBlock}>
            <SocialButton
              icon="G"
              label="Продовжити з Google"
              onPress={handleGoogle}
              loading={loadingGoogle}
            />
            <SocialButton
              icon=""
              label="Продовжити з Apple"
              onPress={handleApple}
              loading={loadingApple}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>або</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email form */}
          <View style={styles.form}>
            <StyledInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              error={errors.email}
            />
            <StyledInput
              label="Пароль"
              value={password}
              onChangeText={setPassword}
              placeholder="Мінімум 8 символів"
              secureTextEntry
              error={errors.password}
            />

            {errors.general && (
              <View style={styles.generalError}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            <Button
              label="Створити акаунт"
              onPress={handleEmailSignUp}
              loading={loadingEmail}
              variant="primary"
              size="lg"
              style={styles.submitBtn}
            />
          </View>

          {/* Sign in link */}
          <View style={styles.signinRow}>
            <Text style={styles.signinText}>Вже маю акаунт? </Text>
            <Pressable onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.signinLink}>Увійти</Text>
            </Pressable>
          </View>

          {/* Legal */}
          <Text style={styles.legal}>
            Реєструючись, ви погоджуєтесь з{' '}
            <Text style={styles.legalLink}>Умовами використання</Text>
            {' '}та{' '}
            <Text style={styles.legalLink}>Політикою конфіденційності</Text>
          </Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xl,
  },

  // Header
  header: {
    gap: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.serifBold,
    fontSize: 32,
    lineHeight: 40,
    color: C.text,
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 23,
    color: C.textSecondary,
  },

  // Social
  socialBlock: {
    gap: Spacing.sm,
  },
  socialBtn: {
    height: 52,
    backgroundColor: C.surface1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.borderMedium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  socialIcon: {
    fontSize: 18,
    fontFamily: FontFamily.sansBold,
    color: C.text,
    width: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  socialLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    color: C.text,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: C.textTertiary,
  },

  // Form
  form: {
    gap: Spacing.base,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: C.textSecondary,
    marginLeft: 2,
  },
  inputWrap: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    backgroundColor: C.surface2,
    overflow: 'hidden',
  },
  input: {
    height: 50,
    paddingHorizontal: Spacing.base,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    color: C.text,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: C.error,
    marginLeft: 2,
  },
  generalError: {
    backgroundColor: C.error + '15',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: C.error + '40',
  },
  generalErrorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: C.error,
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    marginTop: Spacing.xs,
  },

  // Sign in
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    color: C.textSecondary,
  },
  signinLink: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 14,
    color: C.primary,
  },

  // Legal
  legal: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: C.textTertiary,
    textAlign: 'center',
  },
  legalLink: {
    color: C.primary,
    fontFamily: FontFamily.sansMedium,
  },
});
