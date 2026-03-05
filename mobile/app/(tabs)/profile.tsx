import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  H2,
  Spinner,
  View,
  Separator,
  Avatar,
} from 'tamagui';
import { useAuth } from '@/contexts/auth-context';
import { User, LogOut, Settings, Shield, HelpCircle } from '@tamagui/lucide-icons';

export default function ProfileScreen() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout]);

  if (!user) {
    return (
      <YStack f={1} jc="center" ai="center" bg="$background">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <YStack f={1} p="$4" space="$4" bg="$background">
      <YStack ai="center" space="$3" pt="$4">
        <Avatar circular size="$10" bg="$primary">
          <Avatar.Fallback bg="$primary">
            <User size={48} color="white" />
          </Avatar.Fallback>
        </Avatar>
        <H2 color="$color" textAlign="center">
          {user.full_name || 'User'}
        </H2>
        <Text color="$gray10">{user.email}</Text>
      </YStack>

      <Card elevate bordered>
        <YStack>
          <MenuItem
            icon={<Settings size={20} />}
            title="Edit Profile"
            onPress={() => {}}
          />
          <Separator />
          <MenuItem
            icon={<Shield size={20} />}
            title="Privacy & Security"
            onPress={() => {}}
          />
          <Separator />
          <MenuItem
            icon={<HelpCircle size={20} />}
            title="Help & Support"
            onPress={() => router.push('/support')}
          />
        </YStack>
      </Card>

      <Button
        theme="red"
        size="$4"
        onPress={handleLogout}
        disabled={isLoggingOut}
        icon={isLoggingOut ? <Spinner /> : <LogOut size={20} />}
        mt="auto"
      >
        {isLoggingOut ? 'Logging out...' : 'Log Out'}
      </Button>
    </YStack>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

function MenuItem({ icon, title, onPress }: MenuItemProps) {
  return (
    <XStack
      p="$4"
      ai="center"
      space="$3"
      onPress={onPress}
      pressStyle={{ bg: '$backgroundHover' }}
    >
      <View color="$gray10">{icon}</View>
      <Text flex={1} color="$color" fontSize="$4">
        {title}
      </Text>
      <Text color="$gray10">›</Text>
    </XStack>
  );
}
