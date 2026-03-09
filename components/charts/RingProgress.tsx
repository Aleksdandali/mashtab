import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Geometry ─────────────────────────────────────────────────────────────────

const SEGMENTS = 6;
const GAP_DEG = 7;
const SEGMENT_DEG = (360 - SEGMENTS * GAP_DEG) / SEGMENTS; // ~53°

function toRad(deg: number): number {
  return ((deg - 90) * Math.PI) / 180;
}

function polarXY(cx: number, cy: number, r: number, deg: number) {
  return {
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polarXY(cx, cy, r, startDeg);
  const e = polarXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${s.x.toFixed(3)},${s.y.toFixed(3)} A${r},${r},0,${large},1,${e.x.toFixed(3)},${e.y.toFixed(3)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RingProgressProps {
  /** Number of completed stages (0–6) */
  progress: number;
  /** Active color for filled segments */
  color: string;
  /** Outer diameter in dp */
  size?: number;
  /** Arc stroke width */
  strokeWidth?: number;
  /** Animate entrance */
  animated?: boolean;
}

export function RingProgress({
  progress,
  color,
  size = 56,
  strokeWidth = 4.5,
  animated = true,
}: RingProgressProps) {
  const scaleAnim = useRef(new Animated.Value(animated ? 0.6 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (!animated) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;

  const segments = Array.from({ length: SEGMENTS }, (_, i) => {
    const startDeg = i * (SEGMENT_DEG + GAP_DEG);
    const endDeg = startDeg + SEGMENT_DEG;
    return {
      d: arcPath(cx, cy, r, startDeg, endDeg),
      filled: i < progress,
    };
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <Svg width={size} height={size}>
        {segments.map((seg, i) => (
          <Path
            key={i}
            d={seg.d}
            stroke={seg.filled ? color : 'rgba(245, 230, 211, 0.10)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>
    </Animated.View>
  );
}
