import { TamaguiProvider, Theme } from 'tamagui';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import config from '@/tamagui.config';
import { AuthProvider } from '@/contexts/auth-context';
import { ErrorBoundary } from '@/components/error-boundary';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <TamaguiProvider config={config}>
        <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
          <AuthProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="booking" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: 'modal', title: 'Modal' }}
              />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </AuthProvider>
        </Theme>
      </TamaguiProvider>
    </ErrorBoundary>
  );
}
