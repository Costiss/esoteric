import { Calendar, Check, Home } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, H1, Paragraph, Text, View, YStack } from 'tamagui';

export default function BookingConfirmationScreen() {
  const { booking_id } = useLocalSearchParams<{ booking_id: string }>();
  const router = useRouter();

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleViewBookings = () => {
    router.replace('/(tabs)/bookings');
  };

  return (
    <YStack f={1} p="$4" jc="center" ai="center" bg="$background">
      <Card elevate bordered p="$6" width="100%" maxWidth={400}>
        <YStack space="$6" ai="center">
          <View
            width={80}
            height={80}
            borderRadius={40}
            bg="$green5"
            ai="center"
            jc="center"
          >
            <Check size={40} color="#10B981" />
          </View>

          <YStack space="$2" ai="center">
            <H1 color="$color" fontSize="$8" textAlign="center">
              Booking Requested!
            </H1>
            <Paragraph color="$gray10" textAlign="center">
              Your appointment has been requested successfully. The provider
              will confirm it soon.
            </Paragraph>
          </YStack>

          <Card bg="$backgroundHover" p="$4" width="100%">
            <YStack space="$2">
              <Text color="$gray10" fontSize="$3">
                Booking ID
              </Text>
              <Text color="$color" fontSize="$4" fontWeight="600">
                {booking_id?.slice(0, 8)}...
              </Text>
            </YStack>
          </Card>

          <YStack space="$3" width="100%">
            <Button
              theme="active"
              size="$4"
              icon={<Calendar size={20} />}
              onPress={handleViewBookings}
            >
              View My Bookings
            </Button>

            <Button
              variant="outlined"
              size="$4"
              icon={<Home size={20} />}
              onPress={handleGoHome}
            >
              Go Home
            </Button>
          </YStack>
        </YStack>
      </Card>
    </YStack>
  );
}
