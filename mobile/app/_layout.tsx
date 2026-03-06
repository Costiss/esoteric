import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  useFonts,
} from '@expo-google-fonts/cormorant-garamond';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';
import { TamaguiProvider, Theme } from 'tamagui';
import { StardustBackground } from '@/components/stardust-background';
import config from '../tamagui.config';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <Theme name="dark">
        {/* Deep-void base colour */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#050208',
          }}
          pointerEvents="none"
        />
        <StardustBackground />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </Theme>
    </TamaguiProvider>
  );
}
