import '@tamagui/native/setup-zeego';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { AuthProvider } from '@/contexts/auth-context';
import config from '../tamagui.config';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { StardustBackground } from '@/components/animations';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}
    >
      <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
        <ErrorBoundary>
          <AuthProvider>
            <StardustBackground />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: 'transparent' },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: 'modal', title: 'Modal' }}
              />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </AuthProvider>
        </ErrorBoundary>
      </Theme>
    </TamaguiProvider>
  );
}
