import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { DarkColors } from '@/constants/colors';

export default function Index() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
  }, []);

  if (authed === null) {
    return (
      <View style={{ flex: 1, backgroundColor: DarkColors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={DarkColors.primary} />
      </View>
    );
  }

  if (authed) return <Redirect href="/(tabs)/home" />;
  return <Redirect href="/(auth)/welcome" />;
}
