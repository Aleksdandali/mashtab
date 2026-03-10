import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';

const TRANSFORMATIONS = [
  { was: 'Працював 80 год/тиждень', becomes: '4-денний робочий тиждень' },
  { was: 'Боявся делегувати', becomes: 'Команда з 12 людей' },
  { was: '$5K/міс revenue', becomes: '$50K/міс стабільно' },
  { was: 'Синдром самозванця', becomes: 'Впевненість у рішеннях' },
];

export default function FutureSelfScreen() {
  const transformations = TRANSFORMATIONS;

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <Text style={S.title}>Майбутнє Я</Text>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
        <Text style={S.intro}>
          Це не мрії — це конкретні трансформації, які станеться, коли ти інтегруєш нові установки.
        </Text>

        {transformations.map((item, index) => (
          <View key={index} style={S.transformCard}>
            <View style={S.wasSection}>
              <Text style={S.label}>БУЛО</Text>
              <Text style={S.wasText}>{item.was}</Text>
            </View>

            <View style={S.arrowContainer}>
              <ArrowRight color="#C8FF00" size={24} strokeWidth={1.5} />
            </View>

            <View style={S.becomesSection}>
              <Text style={S.label}>СТАНЕ МОЖЛИВИМ</Text>
              <Text style={S.becomesText}>{item.becomes}</Text>
            </View>
          </View>
        ))}

        <View style={S.reflectionCard}>
          <Text style={S.reflectionLabel}>РЕФЛЕКСІЯ</Text>
          <Text style={S.reflectionQuestion}>
            Хто ти станеш через рік, якщо продовжиш цей шлях?
          </Text>
          <Pressable style={S.reflectionButton} onPress={() => router.push('/ai-coach')}>
            <Text style={S.reflectionButtonText}>Записати думки</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={S.footer}>
        <Pressable style={S.ctaButton} onPress={() => router.push('/onboarding/paywall')}>
          <Text style={S.ctaButtonText}>Почати трансформацію</Text>
          <ArrowRight color="#060810" size={20} strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060810',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 174, 196, 0.12)',
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.5,
    color: '#F9FAFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  intro: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#A3AEC4',
    marginBottom: 24,
  },
  transformCard: {
    backgroundColor: '#0B0F18',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  wasSection: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#A3AEC4',
    marginBottom: 8,
  },
  wasText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(163, 174, 196, 0.4)',
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  becomesSection: {
    marginTop: 20,
  },
  becomesText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#F9FAFF',
  },
  reflectionCard: {
    backgroundColor: '#111622',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  reflectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#A3AEC4',
    marginBottom: 12,
  },
  reflectionQuestion: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#F9FAFF',
    marginBottom: 20,
  },
  reflectionButton: {
    backgroundColor: 'rgba(200, 255, 0, 0.09)',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#C8FF00',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 174, 196, 0.12)',
  },
  ctaButton: {
    backgroundColor: '#C8FF00',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#060810',
  },
});
