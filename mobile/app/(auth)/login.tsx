import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Label,
  Spinner,
  Card,
  H2,
  Paragraph,
  View,
} from 'tamagui';
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <YStack f={1} jc="center" ai="center" p="$4" space="$4" bg="$background">
      <Card elevate bordered p="$6" width="100%" maxWidth={400}>
        <YStack space="$6">
          <YStack space="$2" ai="center">
            <H2 color="$color" textAlign="center">
              Welcome Back
            </H2>
            <Paragraph color="$gray10" textAlign="center">
              Sign in to continue your journey
            </Paragraph>
          </YStack>

          {error ? (
            <View bg="$red5" p="$3" br="$4">
              <Text color="$red10" textAlign="center">
                {error}
              </Text>
            </View>
          ) : null}

          <YStack space="$4">
            <YStack space="$2">
              <Label htmlFor="email" color="$color">
                Email
              </Label>
              <Input
                id="email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                size="$4"
                borderWidth={1}
                borderColor="$borderColor"
              />
            </YStack>

            <YStack space="$2">
              <Label htmlFor="password" color="$color">
                Password
              </Label>
              <Input
                id="password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                size="$4"
                borderWidth={1}
                borderColor="$borderColor"
              />
            </YStack>
          </YStack>

          <Button
            theme="active"
            size="$4"
            onPress={handleLogin}
            disabled={isLoading}
            icon={isLoading ? <Spinner /> : undefined}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <XStack jc="center" space="$2">
            <Text color="$gray10">Don't have an account?</Text>
            <Text
              color="$primary"
              fontWeight="600"
              onPress={navigateToRegister}
              pressStyle={{ opacity: 0.7 }}
            >
              Sign Up
            </Text>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
