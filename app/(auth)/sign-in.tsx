import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';
import { Icon } from '@/components/ui/Icon';

export default function SignInScreen() {
  const C = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Введіть email та пароль');
      return;
    }
    setLoading(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authErr) {
      setError('Невірний email або пароль. Спробуйте ще раз.');
      return;
    }
    router.replace('/(tabs)/home');
  };

  const handleApple = async () => {
    setLoadingApple(true);
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const { data, error: authError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (authError) {
          setError(authError.message);
        } else if (data?.user) {
          router.replace('/(tabs)/home');
        }
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError('Apple Sign In не вдався');
      }
    }
    setLoadingApple(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Введіть email, щоб скинути пароль');
      return;
    }
    setError(null);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (resetErr) {
      setError(resetErr.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: C.textSecondary }]}>← Назад</Text>
          </Pressable>

          <Text style={[styles.title, { color: C.text }]}>З поверненням</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>
            Увійдіть, щоб продовжити трансформацію
          </Text>

          {/* Error */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: C.error + '15' }]}>
              <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
            </View>
          )}

          {/* Reset sent confirmation */}
          {resetSent && (
            <View style={[styles.successBox, { backgroundColor: C.primaryMuted }]}>
              <Text style={[styles.successText, { color: C.primary }]}>
                Лист для скидання пароля надіслано на {email}
              </Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface2, color: C.text, borderColor: C.border }]}
              placeholder="your@email.com"
              placeholderTextColor={C.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Пароль</Text>
              <Pressable onPress={handleForgotPassword}>
                <Text style={[styles.forgotLink, { color: C.primary }]}>Забув пароль?</Text>
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface2, color: C.text, borderColor: C.border }]}
              placeholder="Ваш пароль"
              placeholderTextColor={C.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: C.primary, opacity: loading ? 0.75 : pressed ? 0.88 : 1 },
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.bg} />
            ) : (
              <Text style={[styles.btnText, { color: C.bg }]}>Увійти</Text>
            )}
          </Pressable>

          {/* Apple Sign In */}
          {Platform.OS === 'ios' && (
            <>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
                <Text style={[styles.dividerText, { color: C.textTertiary }]}>або</Text>
                <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  { backgroundColor: C.surface2, borderColor: C.borderMedium, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleApple}
                disabled={loadingApple}
              >
                <Icon name="Monitor" size={20} color={C.textSecondary} />
                <Text style={[styles.socialText, { color: C.text }]}>
                  {loadingApple ? 'Зачекайте...' : 'Продовжити з Apple'}
                </Text>
              </Pressable>
            </>
          )}

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: C.textTertiary }]}>
              Ще немає акаунту?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={[styles.footerLink, { color: C.primary }]}>Зареєструватись</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxxl },
  back: { paddingTop: Spacing.base, paddingBottom: Spacing.xl },
  backText: { fontFamily: FontFamily.sansMedium, fontSize: 15 },
  title: { fontFamily: FontFamily.sansExtraBold, fontSize: 28, lineHeight: 34, marginBottom: Spacing.sm },
  subtitle: { fontFamily: FontFamily.sansMedium, fontSize: 15, lineHeight: 22, marginBottom: Spacing.xl },
  errorBox: { borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base },
  errorText: { fontFamily: FontFamily.sansMedium, fontSize: 14, lineHeight: 20 },
  successBox: { borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base },
  successText: { fontFamily: FontFamily.sansMedium, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  fieldGroup: { marginBottom: Spacing.base },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontFamily: FontFamily.sansSemiBold, fontSize: 12, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  forgotLink: { fontFamily: FontFamily.sansMedium, fontSize: 12, marginBottom: 6 },
  input: {
    borderRadius: Radius.md, borderWidth: 1.5,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    fontFamily: FontFamily.sansMedium, fontSize: 15,
  },
  btn: {
    borderRadius: Radius.md, paddingVertical: 15,
    alignItems: 'center', marginTop: Spacing.sm,
  },
  btnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xl },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontFamily: FontFamily.sans, fontSize: 13 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, borderWidth: 1.5, borderRadius: Radius.md,
    paddingVertical: 14, marginBottom: Spacing.xl,
  },
  socialText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontFamily: FontFamily.sans, fontSize: 14 },
  footerLink: { fontFamily: FontFamily.sansSemiBold, fontSize: 14 },
});
