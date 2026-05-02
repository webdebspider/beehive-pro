import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://ebufjekqqhwingpotano.supabase.co'
const supabaseAnonKey = 'sb_publishable_SMVUIqPR55bdNk-2I8iCvw_W5yotYYI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (...args) => {
      console.log('🌐 Supabase request:', args[0]);
      return fetch(...args);
    },
  },
});