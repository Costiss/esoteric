import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  H1,
  H2,
  Spinner,
  ScrollView,
  View,
} from 'tamagui';
import { apiClient, type Service, type Provider } from '@/lib/api-client';
import { Clock, Star, Calendar, ChevronLeft } from '@tamagui/lucide-icons';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const serviceData = await apiClient.getService(id);
      setService(serviceData);
      
      // Load provider info
      const providerData = await apiClient.getProvider(serviceData.provider_id);
      setProvider(providerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookNow = () => {
    router.push(`/booking/new?service_id=${id}`);
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
        <Button mt="$4" onPress={loadData}>
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
            <H1 color="$color" fontSize="$8">
              {service.title}
            </H1>
            <XStack space="$2" ai="center">
              <Clock size={16} color="gray" />
              <Text color="$gray10">{service.duration_minutes} minutes</Text>
              <Text color="$gray10">•</Text>
              <Text color="$primary" fontWeight="600">
                R$ {(service.price_cents / 100).toFixed(2)}
              </Text>
            </XStack>
          </YStack>

          {/* Provider Info */}
          {provider && (
            <Card elevate bordered p="$4">
              <XStack space="$3" ai="center">
                <View
                  width={50}
                  height={50}
                  borderRadius={25}
                  bg="$primary"
                  ai="center"
                  jc="center"
                >
                  <Text color="white" fontSize="$5" fontWeight="600">
                    {provider.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <YStack flex={1}>
                  <XStack ai="center" space="$2">
                    <Text fontSize="$5" fontWeight="600" color="$color">
                      {provider.display_name}
                    </Text>
                    {provider.is_verified && (
                      <Star size={16} color="#F59E0B" fill="#F59E0B" />
                    )}
                  </XStack>
                  {provider.bio && (
                    <Text color="$gray10" fontSize="$3" numberOfLines={2}>
                      {provider.bio}
                    </Text>
                  )}
                </YStack>
              </XStack>
            </Card>
          )}

          {/* Description */}
          <YStack space="$2">
            <H2 color="$color" fontSize="$6">
              About This Service
            </H2>
            <Text color="$gray10" fontSize="$4" lineHeight={24}>
              {service.description}
            </Text>
          </YStack>

          {/* Tags */}
          {service.tags.length > 0 && (
            <YStack space="$2">
              <Text color="$color" fontSize="$4" fontWeight="600">
                Tags
              </Text>
              <XStack space="$2" flexWrap="wrap">
                {service.tags.map((tag) => (
                  <View
                    key={tag}
                    bg="$backgroundHover"
                    px="$3"
                    py="$2"
                    br="$4"
                  >
                    <Text fontSize="$3" color="$gray10">
                      {tag}
                    </Text>
                  </View>
                ))}
              </XStack>
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {/* Book Now Button */}
      <YStack p="$4" bg="$background" borderTopWidth={1} borderTopColor="$borderColor">
        <Button
          size="$5"
          theme="active"
          icon={<Calendar size={20} />}
          onPress={handleBookNow}
        >
          Book Now - R$ {(service.price_cents / 100).toFixed(2)}
        </Button>
      </YStack>
    </YStack>
  );
}
