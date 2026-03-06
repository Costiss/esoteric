import {
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  User,
} from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Avatar,
  Button,
  H2,
  Separator,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';
import { FloatingElement, GlassCard, Sparkle } from '@/components/animations';
import { useAuth } from '@/contexts/auth-context';

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
      <YStack f={1} jc="center" ai="center" bg="transparent">
        <Spinner size="large" color="$secondary" />
      </YStack>
    );
  }

  return (
    <YStack f={1} p="$4" gap="$6" bg="transparent">
      <YStack ai="center" gap="$3" pt="$4">
        <FloatingElement duration={4000} distance={5}>
          <Avatar
            circular
            size="$10"
            bg="$primary"
            shadowColor="$primary"
            shadowRadius={20}
            shadowOpacity={0.4}
          >
            <Avatar.Fallback bg="$primary">
              <User size={48} color="white" />
            </Avatar.Fallback>
          </Avatar>
        </FloatingElement>

        <YStack ai="center" gap="$1">
          <XStack ai="center" gap="$2">
            <H2 color="$color" textAlign="center">
              {user.full_name || 'Seeker'}
            </H2>
            <Sparkle size={20} color="$secondary" />
          </XStack>
          <Text color="$gray11" fontSize="$3">
            {user.email}
          </Text>
        </YStack>
      </YStack>

      <GlassCard elevation={5} p={0} overflow="hidden">
        <YStack>
          <MenuItem
            icon={<Settings size={20} color="$secondary" />}
            title="Edit Identity"
            onPress={() => {}}
          />
          <Separator borderColor="rgba(255,255,255,0.05)" />
          <MenuItem
            icon={<Shield size={20} color="$tertiary" />}
            title="Wards & Security"
            onPress={() => {}}
          />
          <Separator borderColor="rgba(255,255,255,0.05)" />
          <MenuItem
            icon={<HelpCircle size={20} color="$primary" />}
            title="Help & Rituals"
            onPress={() => router.push('/support')}
          />
        </YStack>
      </GlassCard>

      <Button
        size="$4"
        onPress={handleLogout}
        disabled={isLoggingOut}
        backgroundColor="rgba(255, 45, 85, 0.1)"
        borderColor="$primary"
        borderWidth={1}
        mt="auto"
        mb="$4"
      >
        <XStack ai="center" gap="$2">
          {isLoggingOut ? (
            <Spinner color="white" />
          ) : (
            <LogOut size={20} color="white" />
          )}
          <Text color="white" fontWeight="600">
            {isLoggingOut ? 'Fading away...' : 'Log Out'}
          </Text>
        </XStack>
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
      gap="$3"
      onPress={onPress}
      pressStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
    >
      <View>{icon}</View>
      <Text flex={1} color="$color" fontSize="$4">
        {title}
      </Text>
      <Text color="$gray10" fontSize="$5">
        ›
      </Text>
    </XStack>
  );
}
