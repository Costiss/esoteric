import { useState, useEffect, useCallback } from 'react';
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
} from 'tamagui';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, type Booking } from '@/lib/api-client';
import { Calendar, Clock } from '@tamagui/lucide-icons';

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
      setBookings(response.bookings);
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
        return '$green10';
      case 'in_progress':
        return '$blue10';
      case 'cancelled':
        return '$red10';
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
      <YStack f={1} jc="center" ai="center" bg="$background">
        <Spinner size="large" />
        <Text mt="$4" color="$gray10">
          Loading bookings...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="$background">
        <Text color="$red10" textAlign="center">
          {error}
        </Text>
        <Button mt="$4" onPress={loadBookings}>
          Retry
        </Button>
      </YStack>
    );
  }

  if (bookings.length === 0) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="$background">
        <Calendar size={64} color="gray" />
        <Text mt="$4" fontSize="$6" fontWeight="600" textAlign="center">
          No bookings yet
        </Text>
        <Text mt="$2" color="$gray10" textAlign="center">
          Explore our services and book your first appointment
        </Text>
      </YStack>
    );
  }

  return (
    <YStack f={1} p="$4" space="$4" bg="$background">
      <H2 color="$color">My Bookings</H2>
      
      <YStack space="$3">
        {bookings.map((booking) => (
          <Card key={booking.id} elevate bordered p="$4">
            <YStack space="$3">
              <XStack jc="space-between" ai="center">
                <Text fontSize="$5" fontWeight="600" color="$color">
                  Service ID: {booking.service_id.slice(0, 8)}...
                </Text>
                <View
                  bg={getStatusColor(booking.status)}
                  px="$2"
                  py="$1"
                  br="$2"
                >
                  <Text
                    color="white"
                    fontSize="$2"
                    fontWeight="600"
                    textTransform="capitalize"
                  >
                    {booking.status.replace('_', ' ')}
                  </Text>
                </View>
              </XStack>

              <Separator />

              <YStack space="$2">
                <XStack space="$2" ai="center">
                  <Calendar size={16} color="gray" />
                  <Text color="$gray10">{formatDate(booking.start_ts)}</Text>
                </XStack>
                <XStack space="$2" ai="center">
                  <Clock size={16} color="gray" />
                  <Text color="$gray10">
                    {formatTime(booking.start_ts)} - {formatTime(booking.end_ts)}
                  </Text>
                </XStack>
              </YStack>

              {booking.client_notes && (
                <Text color="$gray10" fontSize="$3">
                  Notes: {booking.client_notes}
                </Text>
              )}

              <XStack jc="space-between" ai="center" pt="$2">
                <Text fontSize="$4" fontWeight="600" color="$primary">
                  R$ {(booking.price_cents / 100).toFixed(2)}
                </Text>
                
                {booking.status === 'requested' && (
                  <Button size="$2" theme="red">
                    Cancel
                  </Button>
                )}
              </XStack>
            </YStack>
          </Card>
        ))}
      </YStack>
    </YStack>
  );
}
