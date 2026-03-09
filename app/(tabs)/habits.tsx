import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useWheel, ScoreMap } from '@/hooks/useWheel';
import { SPHERES, SphereKey } from '@/constants/spheres';
import { FontFamily } from '@/constants/typography';
import { Spacing, Radius, Shadow } from '@/constants/spacing';

// ─── Wheel geometry ───────────────────────────────────────────────────────────

const WHEEL_SIZE = 280;
const CENTER = WHEEL_SIZE / 2;
const MAX_RADIUS = 104;
const LEVELS = [2, 4, 6, 8, 10];
const N = SPHERES.length; // 8

/** Angle in radians for sphere index i (top = -π/2) */
function angle(i: number): number {
  return (2 * Math.PI * i) / N - Math.PI / 2;
}

/** Point on the wheel for a given sphere and score */
function point(i: number, score: number) {
  const r = (score / 10) * MAX_RADIUS;
  const a = angle(i);
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
}

/** Icon position (outside ring) */
function iconPos(i: number) {
  const r = MAX_RADIUS + 22;
  const a = angle(i);
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
}

// ─── WheelChart ──────────────────────────────────────────────────────────────

function WheelChart({ scores, previousScores, avgScore, colors }: {
  scores: ScoreMap;
  previousScores: ScoreMap | null;
  avgScore: number;
  colors: ReturnType<typeof useTheme>;
}) {
  const polygonPoints = SPHERES
    .map((s, i) => {
      const p = point(i, scores[s.key]);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const prevPolygonPoints = previousScores
    ? SPHERES.map((s, i) => {
        const p = point(i, previousScores[s.key]);
        return `${p.x},${p.y}`;
      }).join(' ')
    : null;

  return (
    <View style={wheelStyles.container}>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
        {/* Concentric rings */}
        {LEVELS.map((level) => (
          <Circle
            key={level}
            cx={CENTER}
            cy={CENTER}
            r={(level / 10) * MAX_RADIUS}
            fill="none"
            stroke={colors.border}
            strokeWidth={level === 10 ? 1.5 : 1}
          />
        ))}

        {/* Axis lines */}
        {SPHERES.map((_, i) => {
          const outer = point(i, 10);
          return (
            <Line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Previous scores polygon (subtle) */}
        {prevPolygonPoints && (
          <Polygon
            points={prevPolygonPoints}
            fill={colors.primary + '10'}
            stroke={colors.primary + '30'}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* Current scores polygon */}
        <Polygon
          points={polygonPoints}
          fill={colors.primary + '28'}
          stroke={colors.primary}
          strokeWidth={2}
        />

        {/* Score dots */}
        {SPHERES.map((s, i) => {
          const p = point(i, scores[s.key]);
          return (
            <Circle
              key={s.key}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={s.color}
              stroke={colors.surface1}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Sphere icons */}
        {SPHERES.map((s, i) => {
          const pos = iconPos(i);
          return (
            <SvgText
              key={s.key}
              x={pos.x}
              y={pos.y + 5}
              textAnchor="middle"
              fontSize={16}
            >
              {s.icon}
            </SvgText>
          );
        })}

        {/* Average score in center */}
        <SvgText
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          fill={colors.text}
          fontSize={22}
          fontFamily={FontFamily.serifBold}
          fontWeight="700"
        >
          {avgScore.toFixed(1)}
        </SvgText>
        <SvgText
          x={CENTER}
          y={CENTER + 12}
          textAnchor="middle"
          fill={colors.textTertiary}
          fontSize={10}
          fontFamily={FontFamily.sans}
        >
          серед. бал
        </SvgText>
      </Svg>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: Spacing.base,
  },
});

// ─── Score Row (slider) ───────────────────────────────────────────────────────

function ScoreRow({
  sphere,
  score,
  previousScore,
  onPress,
  colors,
}: {
  sphere: typeof SPHERES[0];
  score: number;
  previousScore: number | null;
  onPress: (v: number) => void;
  colors: ReturnType<typeof useTheme>;
}) {
  const delta = previousScore !== null ? score - previousScore : null;

  return (
    <View style={rowStyles.row}>
      {/* Icon + name */}
      <View style={rowStyles.labelRow}>
        <Text style={rowStyles.icon}>{sphere.icon}</Text>
        <Text style={[rowStyles.name, { color: colors.textSecondary }]} numberOfLines={1}>
          {sphere.nameUk}
        </Text>
        {delta !== null && delta !== 0 && (
          <Text style={[rowStyles.delta, { color: delta > 0 ? '#7CB392' : '#C47B8A' }]}>
            {delta > 0 ? `+${delta}` : `${delta}`}
          </Text>
        )}
      </View>

      {/* 10-segment buttons */}
      <View style={rowStyles.segments}>
        {Array.from({ length: 10 }, (_, i) => {
          const val = i + 1;
          const active = val <= score;
          return (
            <Pressable
              key={val}
              onPress={() => onPress(val)}
              style={({ pressed }) => [
                rowStyles.segment,
                {
                  backgroundColor: active ? sphere.color : colors.surface3,
                  opacity: pressed ? 0.7 : 1,
                  borderRadius: val === 1 ? Radius.sm : val === 10 ? Radius.sm : 3,
                },
              ]}
            />
          );
        })}
        <Text style={[rowStyles.scoreLabel, { color: colors.text }]}>{score}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: { fontSize: 16, width: 24 },
  name: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    flex: 1,
  },
  delta: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12,
  },
  segments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  segment: {
    flex: 1,
    height: 8,
  },
  scoreLabel: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13,
    width: 20,
    textAlign: 'right',
  },
});

// ─── Coming Soon Card ─────────────────────────────────────────────────────────

function ComingSoonCard({ icon, title, subtitle, colors }: {
  icon: string;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        comingStyles.card,
        {
          borderColor: colors.borderMedium,
          backgroundColor: colors.surface2,
        },
      ]}
    >
      <Text style={comingStyles.cardIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[comingStyles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[comingStyles.cardSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
      </View>
      <View style={[comingStyles.badge, { backgroundColor: colors.surface3 }]}>
        <Text style={[comingStyles.badgeText, { color: colors.textTertiary }]}>Скоро</Text>
      </View>
    </View>
  );
}

const comingStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: Spacing.sm,
  },
  cardIcon: { fontSize: 24 },
  cardTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const C = useTheme();
  const { scores, previousScores, previousDate, latestDate, loading, saving, fetchLatestScores, setScore, saveScores } = useWheel();

  useFocusEffect(
    useCallback(() => {
      fetchLatestScores();
    }, []),
  );

  const avgScore =
    SPHERES.reduce((sum, s) => sum + scores[s.key], 0) / SPHERES.length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface1 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Баланс життя</Text>
          {latestDate && (
            <Text style={[styles.dateBadge, { color: C.textTertiary }]}>
              Замір: {formatDate(latestDate)}
            </Text>
          )}
        </View>

        {/* ─── Wheel ─── */}
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: Spacing.xxl }} />
        ) : (
          <WheelChart
            scores={scores}
            previousScores={previousScores}
            avgScore={avgScore}
            colors={C}
          />
        )}

        {/* Previous measurement note */}
        {previousDate && (
          <Text style={[styles.prevNote, { color: C.textTertiary }]}>
            Пунктир — попередній замір ({formatDate(previousDate)})
          </Text>
        )}

        {/* ─── Sphere sliders ─── */}
        <View style={[styles.card, { backgroundColor: C.surface2, ...Shadow.sm }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Оцінки по сферах</Text>
          {SPHERES.map((sphere) => (
            <ScoreRow
              key={sphere.key}
              sphere={sphere}
              score={scores[sphere.key]}
              previousScore={previousScores ? previousScores[sphere.key] : null}
              onPress={(val) => setScore(sphere.key as SphereKey, val)}
              colors={C}
            />
          ))}

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: C.primary, opacity: saving ? 0.7 : pressed ? 0.88 : 1 },
            ]}
            onPress={saveScores}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={C.surface1} size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: C.surface1 }]}>
                Зберегти оцінку
              </Text>
            )}
          </Pressable>
        </View>

        {/* ─── Coming soon ─── */}
        <View style={styles.comingSection}>
          <Text style={[styles.comingSectionTitle, { color: C.textSecondary }]}>
            Незабаром у МАСШТАБ
          </Text>
          <ComingSoonCard
            icon="🧘"
            title="Трекер звичок"
            subtitle="Щоденні звички зі стриком та статистикою"
            colors={C}
          />
          <ComingSoonCard
            icon="📚"
            title="Книжкова полиця"
            subtitle="Інсайти з книг, пов'язані з установками"
            colors={C}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingTop: Spacing.xl,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  title: {
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
    lineHeight: 34,
  },
  dateBadge: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
  },
  prevNote: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 14,
    marginBottom: Spacing.base,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  saveBtn: {
    marginTop: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
  },
  comingSection: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  comingSectionTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
});
