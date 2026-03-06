import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Check, ChevronLeft, Clock } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  Button,
  Card,
  H1,
  H2,
  Input,
  Label,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, type Service } from '@/lib/api-client';

export default function NewBookingScreen() {
  const { service_id } = useLocalSearchParams<{ service_id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const loadService = useCallback(async () => {
    try {
      setIsLoading(true);
      const serviceData = await apiClient.getService(service_id);
      setService(serviceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service');
    } finally {
      setIsLoading(false);
    }
  }, [service_id]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  const handleDateChange = (event: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSubmit = async () => {
    if (!service || !user) return;

    setIsSubmitting(true);
    setError('');

    try {
      const endDate = new Date(selectedDate);
      endDate.setMinutes(endDate.getMinutes() + service.duration_minutes);

      const booking = await apiClient.createBooking({
        service_id: service.id,
        start_ts: selectedDate.toISOString(),
        client_notes: notes || undefined,
      });

      // Navigate to booking success or confirmation
      router.replace(`/booking/confirmation?booking_id=${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <YStack f={1} jc="center" ai="center" bg="$background">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (error || !service) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="$background">
        <Text color="$red10" textAlign="center">
          {error || 'Service not found'}
        </Text>
        <Button mt="$4" onPress={loadService}>
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <YStack f={1} bg="$background">
      <ScrollView f={1}>
        <YStack p="$4" space="$4">
          {/* Back Button */}
          <Button
            icon={<ChevronLeft size={20} />}
            onPress={() => router.back()}
            theme="secondary"
            alignSelf="flex-start"
          >
            Back
          </Button>

          {/* Header */}
          <YStack space="$2">
            <H1 color="$color" fontSize="$7">
              Book Appointment
            </H1>
            <Text color="$gray10">{service.title}</Text>
          </YStack>

          {/* Service Summary */}
          <Card elevate bordered p="$4">
            <YStack space="$2">
              <Text fontSize="$5" fontWeight="600" color="$color">
                {service.title}
              </Text>
              <XStack space="$2" ai="center">
                <Clock size={16} color="gray" />
                <Text color="$gray10">{service.duration_minutes} minutes</Text>
              </XStack>
              <Text color="$primary" fontSize="$5" fontWeight="600">
                R$ {(service.price_cents / 100).toFixed(2)}
              </Text>
            </YStack>
          </Card>

          {/* Date Selection */}
          <YStack space="$3">
            <H2 color="$color" fontSize="$6">
              Select Date & Time
            </H2>

            <Button
              onPress={() => setShowDatePicker(true)}
              icon={<Calendar size={20} />}
              size="$4"
              theme="secondary"
            >
              {selectedDate.toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Button>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </YStack>

          {/* Notes */}
          <YStack space="$2">
            <Label htmlFor="notes" color="$color">
              Additional Notes (Optional)
            </Label>
            <Input
              id="notes"
              placeholder="Any special requests or information..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              size="$4"
              height={100}
              borderWidth={1}
              borderColor="$borderColor"
            />
          </YStack>

          {error ? (
            <View bg="$red5" p="$3" br="$4">
              <Text color="$red10" textAlign="center">
                {error}
              </Text>
            </View>
          ) : null}
        </YStack>
      </ScrollView>

      {/* Submit Button */}
      <YStack
        p="$4"
        bg="$background"
        borderTopWidth={1}
        borderTopColor="$borderColor"
      >
        <Button
          size="$5"
          theme="active"
          icon={isSubmitting ? <Spinner /> : <Check size={20} />}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
        </Button>
      </YStack>
    </YStack>
  );
}
