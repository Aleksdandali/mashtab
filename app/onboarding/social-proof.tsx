import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Colors as C } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';

export default function SocialProofScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>Результати</Text>
        <Text style={styles.sub}>— буде побудовано (соціальний доказ)</Text>
      </View>
      <View style={styles.footer}>
        <Button
          label="Далі"
          onPress={() => router.push('/onboarding/focus-select')}
          variant="primary"
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl },
  title: { fontFamily: FontFamily.serifBold, fontSize: 28, color: C.text },
  sub: { fontFamily: FontFamily.sans, fontSize: 15, color: C.textSecondary, marginTop: Spacing.sm },
  footer: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
});
