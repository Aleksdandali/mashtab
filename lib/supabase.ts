import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://tgdxrmuxdgybrcyypjpe.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZHhybXV4ZGd5YnJjeXlwanBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjE1MDUsImV4cCI6MjA4ODYzNzUwNX0.eXfnlnF_me7WxuxQ8bOsdlx56JlxX2dHmzr475gEU9s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
