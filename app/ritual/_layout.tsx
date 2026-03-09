import { Stack } from 'expo-router';

export default function RitualLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="morning" />
      <Stack.Screen name="evening" />
      <Stack.Screen name="weekly" />
    </Stack>
  );
}
