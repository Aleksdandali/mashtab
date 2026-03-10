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
  const [error, setError] = useState<string | null>(null);

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
            <View style={[styles.errorBox, { backgroundColor: '#C47B8A22' }]}>
              <Text style={[styles.errorText, { color: '#C47B8A' }]}>{error}</Text>
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
            <Text style={[styles.label, { color: C.textSecondary }]}>Пароль</Text>
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
              <ActivityIndicator color={C.surface1} />
            ) : (
              <Text style={[styles.btnText, { color: C.surface1 }]}>Увійти</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
            <Text style={[styles.dividerText, { color: C.textTertiary }]}>або</Text>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
          </View>

          {/* Google */}
          <Pressable
            style={({ pressed }) => [
              styles.socialBtn,
              { backgroundColor: C.surface2, borderColor: C.borderMedium, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={async () => {
              const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google' });
              if (!err) router.replace('/(tabs)/home');
            }}
          >
            <Icon name="Globe" size={20} color={C.textSecondary} />
            <Text style={[styles.socialText, { color: C.text }]}>Продовжити з Google</Text>
          </Pressable>

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
  title: { fontFamily: FontFamily.serifBold, fontSize: 28, lineHeight: 34, marginBottom: Spacing.sm },
  subtitle: { fontFamily: FontFamily.sansMedium, fontSize: 15, lineHeight: 22, marginBottom: Spacing.xl },
  errorBox: { borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base },
  errorText: { fontFamily: FontFamily.sansMedium, fontSize: 14, lineHeight: 20 },
  fieldGroup: { marginBottom: Spacing.base },
  label: { fontFamily: FontFamily.sansSemiBold, fontSize: 12, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
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
  socialIcon: { width: 20 },
  socialText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontFamily: FontFamily.sans, fontSize: 14 },
  footerLink: { fontFamily: FontFamily.sansSemiBold, fontSize: 14 },
});
