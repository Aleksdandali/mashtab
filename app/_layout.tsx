import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  CormorantGaramond_600SemiBold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    CormorantGaramond_600SemiBold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="belief/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="belief/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ritual/morning" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ritual/evening" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ritual/weekly" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goal/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="goal/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ai-coach" options={{ presentation: 'modal' }} />
      </Stack>
    </ErrorBoundary>
  );
}
