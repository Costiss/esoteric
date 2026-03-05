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

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register(email, password, fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <YStack f={1} jc="center" ai="center" p="$4" space="$4" bg="$background">
      <Card elevate bordered p="$6" width="100%" maxWidth={400}>
        <YStack space="$6">
          <YStack space="$2" ai="center">
            <H2 color="$color" textAlign="center">
              Create Account
            </H2>
            <Paragraph color="$gray10" textAlign="center">
              Join our community of spiritual seekers
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
              <Label htmlFor="fullName" color="$color">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                size="$4"
                borderWidth={1}
                borderColor="$borderColor"
              />
            </YStack>

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
                placeholder="Enter your password (min 8 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                size="$4"
                borderWidth={1}
                borderColor="$borderColor"
              />
            </YStack>

            <YStack space="$2">
              <Label htmlFor="confirmPassword" color="$color">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
            onPress={handleRegister}
            disabled={isLoading}
            icon={isLoading ? <Spinner /> : undefined}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <XStack jc="center" space="$2">
            <Text color="$gray10">Already have an account?</Text>
            <Text
              color="$primary"
              fontWeight="600"
              onPress={navigateToLogin}
              pressStyle={{ opacity: 0.7 }}
            >
              Sign In
            </Text>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
