import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Svg, Path, Circle as SvgCircle } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';

const { width: SW, height: SH } = Dimensions.get('window');
const C = Colors;

interface SplashProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashProps) {
  const svgOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const containerY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(svgOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(containerY, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => onComplete?.(), 800);
    });
  }, []);

  return (
    <View style={S.root}>
      {/* Center glow */}
      <View style={S.glow} />

      <Animated.View style={[S.content, { opacity: svgOpacity, transform: [{ translateY: containerY }] }]}>
        {/* Growth trajectory icon */}
        <Svg width={80} height={80} viewBox="0 0 100 100" style={S.svg}>
          <Path
            d="M 15 85 L 35 55 L 55 45 L 85 15"
            stroke={C.primary}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <SvgCircle cx={85} cy={15} r={5} fill={C.primary} />
        </Svg>

        {/* Wordmark */}
        <Animated.Text style={[S.title, { opacity: titleOpacity }]}>
          MASHTAB
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[S.subtitle, { opacity: subtitleOpacity }]}>
          FOUNDER OS
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(200, 255, 0, 0.08)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  svg: {
    marginBottom: 24,
  },
  title: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 48,
    color: C.text,
    letterSpacing: -0.96,
    lineHeight: 48,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: '#A3AEC4',
    letterSpacing: 1.04,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
