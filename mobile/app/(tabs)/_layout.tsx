import { type Href, Tabs, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { FloatingNav } from '@/components/floating-nav';

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();

  // Extract active tab from pathname
  const getActiveTab = () => {
    if (pathname === '/' || pathname === '/index') return 'index';
    const match = pathname.match(/\/(\w+)$/);
    return match ? match[1] : 'index';
  };

  const activeTab = getActiveTab();

  const handleTabPress = (key: string) => {
    router.push(`/${key}` as Href);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="services" />
        <Tabs.Screen name="bookings" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <FloatingNav activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}
