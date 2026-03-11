import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Polygon, Line, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWheel, ScoreMap } from '@/hooks/useWheel';
import { SPHERES, SphereKey } from '@/constants/spheres';

// ─── Radar geometry ───────────────────────────────────────────────────────────

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_MAX = SIZE / 2 - 32;
const N = SPHERES.length;
const GRID_LEVELS = [2, 4, 6, 8, 10];

function angle(i: number) {
  return (Math.PI * 2 * i) / N - Math.PI / 2;
}

function pt(i: number, v: number) {
  return {
    x: CX + (v / 10) * R_MAX * Math.cos(angle(i)),
    y: CY + (v / 10) * R_MAX * Math.sin(angle(i)),
  };
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({ scores }: { scores: ScoreMap }) {
  const dataPoints = SPHERES.map((s, i) => pt(i, scores[s.key] || 0));
  const avgRaw = Object.values(scores).reduce((a, b) => a + b, 0) / N;
  const avg = avgRaw.toFixed(1);

  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {/* Grid polygons */}
      {GRID_LEVELS.map((lv) => (
        <Polygon
          key={lv}
          points={Array.from({ length: N }, (_, i) => { const p = pt(i, lv); return `${p.x},${p.y}`; }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Radial lines */}
      {Array.from({ length: N }, (_, i) => {
        const end = pt(i, 10);
        return (
          <Line
            key={i}
            x1={CX} y1={CY}
            x2={end.x} y2={end.y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data fill */}
      <Polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="rgba(200,255,0,0.12)"
        stroke="#C8FF00"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <SvgCircle
          key={i}
          cx={p.x} cy={p.y} r="4"
          fill={SPHERES[i].color}
          stroke="#060810"
          strokeWidth="2"
        />
      ))}

      {/* Center avg */}
      <SvgText
        x={CX} y={CY - 6}
        textAnchor="middle"
        fill="#C8FF00"
        fontSize="30"
        fontWeight="800"
      >
        {avg}
      </SvgText>
      <SvgText
        x={CX} y={CY + 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize="10"
      >
        серед. бал
      </SvgText>
    </Svg>
  );
}

// ─── Score Bar (10 dots) ──────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <View style={SB.row}>
      {Array.from({ length: 10 }, (_, i) => (
        <View
          key={i}
          style={[SB.dot, { backgroundColor: i < score ? color : 'rgba(255,255,255,0.08)' }]}
        />
      ))}
    </View>
  );
}

const SB = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, flex: 1 },
  dot: { flex: 1, height: 8, borderRadius: 4 },
});

// ─── Score Picker (for edit mode) ────────────────────────────────────────────

function ScorePicker({
  value,
  color,
  onChange,
}: {
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={SP.row}>
      {Array.from({ length: 10 }, (_, i) => {
        const n = i + 1;
        const active = n <= value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[SP.dot, { backgroundColor: active ? color : 'rgba(255,255,255,0.08)' }]}
          />
        );
      })}
    </View>
  );
}

const SP = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, flex: 1 },
  dot: { flex: 1, height: 8, borderRadius: 4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const { scores, latestDate, loading, saving, fetchLatestScores, setScore, saveScores } = useWheel();
  const [editing, setEditing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchLatestScores();
    }, [fetchLatestScores]),
  );

  const now = new Date();
  const MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
  const measureDate = latestDate
    ? new Date(latestDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
    : `${now.getDate()} ${MONTHS[now.getMonth()]}`;

  const handleSave = async () => {
    await saveScores();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const handleScoreChange = (sphere: SphereKey, v: number) => {
    setScore(sphere, v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={S.container}>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
        <Text style={S.title}>Баланс життя</Text>
        <Text style={S.dateLabel}>Замір: {measureDate}</Text>

        {loading ? (
          <ActivityIndicator color="#C8FF00" style={{ marginTop: 60 }} />
        ) : (
          <>
            <View style={S.chartWrap}>
              <RadarChart scores={scores} />
            </View>

            <View style={S.scoresCard}>
              <View style={S.scoresHeader}>
                <Text style={S.scoresHeaderLabel}>ОЦІНКИ ПО СФЕРАХ</Text>
                {editing ? (
                  <Pressable
                    style={[S.editBtn, S.editBtnActive]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#060810" size="small" />
                    ) : (
                      <Text style={S.editBtnActiveText}>Готово</Text>
                    )}
                  </Pressable>
                ) : (
                  <Pressable style={S.editBtn} onPress={() => setEditing(true)}>
                    <Text style={S.editBtnText}>Змінити</Text>
                  </Pressable>
                )}
              </View>

              {SPHERES.map((sphere) => (
                <View key={sphere.key} style={S.sphereRow}>
                  <View style={S.sphereInfo}>
                    <Text style={[S.sphereDot, { color: sphere.color }]}>●</Text>
                    <Text style={S.sphereName}>{sphere.nameUk}</Text>
                    <Text style={S.sphereScore}>{scores[sphere.key]}</Text>
                  </View>
                  {editing ? (
                    <ScorePicker
                      value={scores[sphere.key]}
                      color={sphere.color}
                      onChange={(v) => handleScoreChange(sphere.key, v)}
                    />
                  ) : (
                    <ScoreBar score={scores[sphere.key]} color={sphere.color} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },

  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32, letterSpacing: -0.5, color: '#F9FAFF',
  },
  dateLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14, color: '#A3AEC4', marginTop: 6,
  },

  chartWrap: {
    alignItems: 'center', marginTop: 16, marginBottom: 24,
  },

  scoresCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  scoresHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  scoresHeaderLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14,
    minWidth: 70, alignItems: 'center',
  },
  editBtnActive: { backgroundColor: '#C8FF00' },
  editBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  editBtnActiveText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#060810' },

  sphereRow: { marginBottom: 18 },
  sphereInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
  },
  sphereDot: { fontSize: 12 },
  sphereName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#F9FAFF', flex: 1 },
  sphereScore: {
    fontFamily: 'Inter_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.5)',
  },
});
