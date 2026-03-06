import { type Href, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/components/design-system';
import { FloatingNav } from '@/components/floating-nav';
import { StardustBackground } from '@/components/stardust-background';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleTabPress = (key: string) => {
    router.push(`/${key}` as Href);
  };

  return (
    <View style={{ flex: 1 }}>
      <StardustBackground />
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <Text style={{ fontSize: 24, color: C.fg, marginBottom: 8 }}>
          Profile
        </Text>
        <Text style={{ fontSize: 16, color: C.fgMuted }}>Coming Soon</Text>
      </View>
      <FloatingNav activeTab="profile" onTabPress={handleTabPress} />
    </View>
  );
}
