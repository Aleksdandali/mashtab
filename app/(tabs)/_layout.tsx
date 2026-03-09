import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { DarkColors, LightColors, ColorTheme } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  return (
    <View style={styles.iconWrapper}>
      {children}
      {focused && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
    </View>
  );
}

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors: ColorTheme = scheme === 'dark' ? DarkColors : LightColors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface1,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <HomeIcon focused={focused} colors={colors} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="mindset"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <MindsetIcon focused={focused} colors={colors} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <PlansIcon focused={focused} colors={colors} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <HabitsIcon focused={focused} colors={colors} />
            </TabIcon>
          ),
        }}
      />
      {/* Profile is navigated to via header avatar — not shown in tab bar */}
      <Tabs.Screen name="profile" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}

// ─── Tab Icons (SVG-like via Text, замінимо на векторні пізніше) ──────────────

function HomeIcon({ focused, colors }: { focused: boolean; colors: ColorTheme }) {
  return (
    <View style={[styles.icon, focused && { opacity: 1 }]}>
      <View style={[styles.iconBase, { opacity: focused ? 1 : 0.4 }]}>
        {/* House shape */}
        <View style={[styles.roof, { borderBottomColor: focused ? colors.primary : colors.text }]} />
        <View style={[styles.house, { backgroundColor: focused ? colors.primary : colors.text, opacity: focused ? 1 : 0.5 }]} />
      </View>
    </View>
  );
}

function MindsetIcon({ focused, colors }: { focused: boolean; colors: ColorTheme }) {
  return (
    <View style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}>
      <View style={[styles.circle, {
        borderColor: focused ? colors.primary : colors.text,
        borderWidth: 2,
        width: 20,
        height: 20,
        borderRadius: 10,
      }]} />
      <View style={[styles.lineSmall, { backgroundColor: focused ? colors.primary : colors.text }]} />
    </View>
  );
}

function PlansIcon({ focused, colors }: { focused: boolean; colors: ColorTheme }) {
  return (
    <View style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}>
      {[0, 6, 12].map((top) => (
        <View key={top} style={[styles.listLine, {
          backgroundColor: focused ? colors.primary : colors.text,
          width: top === 0 ? 20 : top === 6 ? 14 : 17,
          top,
        }]} />
      ))}
    </View>
  );
}

function HabitsIcon({ focused, colors }: { focused: boolean; colors: ColorTheme }) {
  return (
    <View style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}>
      <View style={[styles.bolt, { borderColor: focused ? colors.primary : colors.text }]}>
        <View style={[styles.boltInner, { backgroundColor: focused ? colors.primary : colors.text }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBase: {
    alignItems: 'center',
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 1,
  },
  house: {
    width: 14,
    height: 10,
    borderRadius: 1,
  },
  circle: {
    marginBottom: 3,
  },
  lineSmall: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  listLine: {
    height: 2,
    borderRadius: 1,
    position: 'absolute',
    left: 0,
  },
  bolt: {
    width: 18,
    height: 22,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boltInner: {
    width: 6,
    height: 10,
    borderRadius: 1,
  },
});
