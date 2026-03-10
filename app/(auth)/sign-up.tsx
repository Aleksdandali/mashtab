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
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors as C } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { supabase } from '@/lib/supabase';
import { syncOnboardingData } from '@/lib/onboarding-storage';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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
    outputRange: [C.border, error ? C.error : C.primary],
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Animated.View style={[styles.inputWrap, { borderColor: error ? C.error : borderColor }]}>
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
  const [loadingApple, setLoadingApple]   = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!email.includes('@') || !email.includes('.')) next.email = 'Введіть правильну email адресу';
    if (password.length < 8) next.password = 'Пароль має бути мінімум 8 символів';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const afterAuth = async (userId: string) => {
    await syncOnboardingData(userId, supabase);
    router.replace('/(tabs)/home');
  };

  // Email sign-up with email confirm handling
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

    if (data.session) {
      await afterAuth(data.user!.id);
    } else if (data.user) {
      setShowEmailConfirm(true);
    }
    setLoadingEmail(false);
  };

  // Apple Sign In via native module + Supabase ID token
  const handleApple = async () => {
    setLoadingApple(true);
    setErrors({});
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) {
          setErrors({ general: error.message });
        } else if (data?.user) {
          await afterAuth(data.user.id);
        }
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setErrors({ general: 'Apple Sign In не вдався' });
      }
    }
    setLoadingApple(false);
  };

  // Email confirm screen
  if (showEmailConfirm) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.confirmContainer}>
          <View style={styles.confirmIconWrap}>
            <Icon name="Mail" size={40} color={C.primary} />
          </View>
          <Text style={styles.confirmTitle}>Перевірте пошту</Text>
          <Text style={styles.confirmDesc}>
            Ми надіслали лист підтвердження на{'\n'}
            <Text style={{ color: C.primary, fontFamily: FontFamily.sansSemiBold }}>{email}</Text>
          </Text>
          <Text style={styles.confirmHint}>
            Натисніть посилання в листі, а потім поверніться і увійдіть
          </Text>
          <Button
            label="Увійти"
            onPress={() => router.replace('/(auth)/sign-in')}
            variant="primary"
            size="lg"
            style={{ width: '100%', marginTop: Spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

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

          {/* Apple Sign In */}
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={handleApple}
              disabled={loadingApple}
              style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.85 }]}
            >
              <Icon name="Monitor" size={20} color={C.textSecondary} />
              <Text style={styles.socialLabel}>
                {loadingApple ? 'Зачекайте...' : 'Продовжити з Apple'}
              </Text>
            </Pressable>
          )}

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

  header: { gap: Spacing.sm },
  title: {
    fontFamily: FontFamily.sansExtraBold,
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
  form: { gap: Spacing.base },
  inputGroup: { gap: Spacing.xs },
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

  // Email confirm
  confirmContainer: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  confirmTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 28,
    color: C.text,
    marginBottom: Spacing.sm,
  },
  confirmDesc: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 23,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  confirmHint: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: C.textTertiary,
    textAlign: 'center',
  },
});
