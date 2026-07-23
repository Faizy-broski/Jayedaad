import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createQueryClient, configureHttpClient, configureSupabaseClient, getCurrentAccessToken } from '@jayedaad/core';
import { RootNavigator } from './src/navigation/RootNavigator';

configureSupabaseClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
});

configureHttpClient({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3001',
  getToken: getCurrentAccessToken,
});

export default function App() {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
