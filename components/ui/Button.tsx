import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  colors?: typeof Colors;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  textStyle,
  colors = Colors,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const containerStyle: ViewStyle[] = [
    styles.base,
    sizes[size],
    variants(colors)[variant],
    ...(disabled ? [styles.disabled] : []),
    style as ViewStyle,
  ];

  const labelStyle: TextStyle[] = [
    Typography.button as TextStyle,
    labelColors(colors)[variant],
    textStyle as TextStyle,
  ];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={containerStyle}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? colors.bg : colors.primary}
            size="small"
          />
        ) : (
          <Text style={labelStyle}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  disabled: {
    opacity: 0.4,
  },
});

const sizes: Record<Size, ViewStyle> = {
  sm: { height: 36, paddingHorizontal: Spacing.base },
  md: { height: 44, paddingHorizontal: Spacing.lg },
  lg: { height: 52, paddingHorizontal: Spacing.xl },
};

const variants = (c: typeof Colors): Record<Variant, ViewStyle> => ({
  primary: {
    backgroundColor: c.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: c.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const labelColors = (c: typeof Colors): Record<Variant, TextStyle> => ({
  primary: { color: '#1A1208' },
  secondary: { color: c.primary },
  ghost: { color: c.textSecondary },
});
