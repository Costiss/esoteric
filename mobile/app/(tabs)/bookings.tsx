import { Calendar, Clock } from '@tamagui/lucide-icons';
import { useCallback, useEffect, useState } from 'react';
import {
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
import { apiClient, type Booking } from '@/lib/api-client';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const loadBookings = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getCustomerBookings(user.id);
      setBookings(response?.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '$tertiary';
      case 'in_progress':
        return '$secondary';
      case 'cancelled':
        return '$primary';
      case 'completed':
        return '$gray10';
      default:
        return '$yellow10';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <YStack f={1} jc="center" ai="center" bg="transparent">
        <Spinner size="large" color="$secondary" />
        <Text mt="$4" color="$gray10">
          Reading the records...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="transparent">
        <Text color="$primary" textAlign="center">
          {error}
        </Text>
        <Button mt="$4" onPress={loadBookings} backgroundColor="$primary">
          <Text color="white">Retry</Text>
        </Button>
      </YStack>
    );
  }

  if (bookings.length === 0) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="transparent">
        <FloatingElement>
          <Calendar size={64} color="$secondary" opacity={0.5} />
        </FloatingElement>
        <Text
          mt="$4"
          fontSize="$6"
          fontWeight="600"
          textAlign="center"
          color="$color"
        >
          No destiny paths yet
        </Text>
        <Text mt="$2" color="$gray10" textAlign="center">
          Explore our services and book your first appointment
        </Text>
      </YStack>
    );
  }

  return (
    <YStack f={1} p="$4" gap="$4" bg="transparent">
      <XStack ai="center" gap="$2">
        <H2 color="$color">My Bookings</H2>
        <Sparkle size={24} color="$tertiary" />
      </XStack>

      <YStack gap="$3" pb="$8">
        {bookings.map((booking) => (
          <GlassCard key={booking.id} elevation={5}>
            <YStack gap="$3">
              <XStack jc="space-between" ai="center">
                <Text fontSize="$5" fontWeight="600" color="$color">
                  Service ID: {booking.service_id.slice(0, 8)}...
                </Text>
                <View
                  bg={getStatusColor(booking.status)}
                  px="$2"
                  py="$1"
                  br="$2"
                  opacity={0.8}
                >
                  <Text
                    color="white"
                    fontSize="$2"
                    fontWeight="700"
                    textTransform="capitalize"
                  >
                    {booking.status.replace('_', ' ')}
                  </Text>
                </View>
              </XStack>

              <Separator borderColor="rgba(255,255,255,0.1)" />

              <YStack gap="$2">
                <XStack gap="$2" ai="center">
                  <Calendar size={16} color="$secondary" />
                  <Text color="$gray10">{formatDate(booking.start_ts)}</Text>
                </XStack>
                <XStack gap="$2" ai="center">
                  <Clock size={16} color="$secondary" />
                  <Text color="$gray10">
                    {formatTime(booking.start_ts)} -{' '}
                    {formatTime(booking.end_ts)}
                  </Text>
                </XStack>
              </YStack>

              {booking.client_notes && (
                <Text color="$gray11" fontSize="$3" fontStyle="italic">
                  " {booking.client_notes} "
                </Text>
              )}

              <XStack jc="space-between" ai="center" pt="$2">
                <Text fontSize="$4" fontWeight="600" color="$primary">
                  R$ {(booking.price_cents / 100).toFixed(2)}
                </Text>

                {booking.status === 'requested' && (
                  <Button size="$2" backgroundColor="$primary">
                    <Text color="white" fontSize="$2" fontWeight="600">
                      Cancel
                    </Text>
                  </Button>
                )}
              </XStack>
            </YStack>
          </GlassCard>
        ))}
      </YStack>
    </YStack>
  );
}
