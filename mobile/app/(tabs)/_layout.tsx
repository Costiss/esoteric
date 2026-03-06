import { Briefcase, Calendar, Home, Search, User } from '@tamagui/lucide-icons';
import { Tabs } from 'expo-router';
import { useTheme } from 'tamagui';
import { useAuth } from '@/contexts/auth-context';

export default function TabLayout() {
  const theme = useTheme();
  const { isProvider } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.color?.val || '#8B5CF6',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background?.val,
          borderTopColor: theme.borderColor?.val,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="provider-dashboard"
        options={{
          title: 'Dashboard',
          href: isProvider ? '/provider-dashboard' : undefined,
          tabBarIcon: ({ color }) => <Briefcase size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
