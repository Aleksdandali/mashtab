import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { Colors, ColorTheme } from '@/constants/colors';

// ─── Stroke-only tab icons (Lucide-style, 1.5px stroke) ──────────────────────

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.iconWrapper}>
      {children}
      {focused && <View style={[styles.dot, { backgroundColor: Colors.primary }]} />}
    </View>
  );
}

// Home — house outline
function HomeIcon({ focused }: { focused: boolean }) {
  const color = focused ? Colors.primary : Colors.tabInactive;
  return (
    <View style={styles.icon}>
      <View style={[styles.roof, { borderBottomColor: color }]} />
      <View style={[styles.houseBody, { borderColor: color }]}>
        <View style={[styles.houseDoor, { borderColor: color }]} />
      </View>
    </View>
  );
}

// Mindset — brain outline (simplified: circle + two bumps)
function MindsetIcon({ focused }: { focused: boolean }) {
  const color = focused ? Colors.primary : Colors.tabInactive;
  return (
    <View style={styles.icon}>
      <View style={[styles.brainOuter, { borderColor: color }]}>
        <View style={[styles.brainLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

// Plans — checklist lines
function PlansIcon({ focused }: { focused: boolean }) {
  const color = focused ? Colors.primary : Colors.tabInactive;
  return (
    <View style={styles.icon}>
      {([0, 7, 14] as const).map((top, i) => (
        <View
          key={top}
          style={[
            styles.listLine,
            {
              backgroundColor: color,
              top,
              width: i === 1 ? 14 : i === 2 ? 17 : 20,
            },
          ]}
        />
      ))}
    </View>
  );
}

// Habits — circle with lightning bolt inside
function HabitsIcon({ focused }: { focused: boolean }) {
  const color = focused ? Colors.primary : Colors.tabInactive;
  return (
    <View style={styles.icon}>
      <View style={[styles.circle, { borderColor: color }]}>
        <View style={[styles.bolt, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(5, 6, 8, 0.92)',
          borderTopColor: Colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          position: 'absolute',
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <HomeIcon focused={focused} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="mindset"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <MindsetIcon focused={focused} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <PlansIcon focused={focused} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <HabitsIcon focused={focused} />
            </TabIcon>
          ),
        }}
      />
      {/* Profile accessed via avatar in Home header */}
      <Tabs.Screen name="profile" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    position: 'absolute',
    bottom: 1,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Home icon
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 0,
  },
  houseBody: {
    width: 14,
    height: 9,
    borderWidth: 1.5,
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  houseDoor: {
    width: 4,
    height: 5,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderRadius: 1,
    marginBottom: 0,
  },

  // Mindset icon
  brainOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainLine: {
    width: 8,
    height: 1.5,
    borderRadius: 1,
  },

  // Plans icon
  listLine: {
    height: 1.5,
    borderRadius: 1,
    position: 'absolute',
    left: 2,
  },

  // Habits icon
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolt: {
    width: 3,
    height: 8,
    borderRadius: 1,
  },
});
