import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { DarkColors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius } from '@/constants/spacing';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.content}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Щось пішло не так</Text>
          <Text style={styles.subtitle}>
            Сталася неочікувана помилка. Спробуйте ще раз — зазвичай це допомагає.
          </Text>

          {__DEV__ && this.state.errorMessage && (
            <View style={styles.devBox}>
              <Text style={styles.devText}>{this.state.errorMessage}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={this.handleRetry}
          >
            <Text style={styles.btnText}>Спробувати знову</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const C = DarkColors;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.base,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.serifBold,
    fontSize: 24,
    color: C.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  devBox: {
    backgroundColor: C.surface2,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
  },
  devText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: '#E8976B',
    lineHeight: 18,
  },
  btn: {
    backgroundColor: C.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  btnText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    color: C.surface1,
  },
});
