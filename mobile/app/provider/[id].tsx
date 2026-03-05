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
import { apiClient, type Provider, type Service } from '@/lib/api-client';
import { Star, ChevronLeft, Clock } from '@tamagui/lucide-icons';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [providerData, servicesData] = await Promise.all([
        apiClient.getProvider(id),
        apiClient.getProviderServices(id),
      ]);
      setProvider(providerData);
      setServices(servicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load provider');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <YStack f={1} jc="center" ai="center" bg="$background">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (error || !provider) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="$background">
        <Text color="$red10" textAlign="center">
          {error || 'Provider not found'}
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

          {/* Provider Header */}
          <YStack ai="center" space="$3">
            <View
              width={100}
              height={100}
              borderRadius={50}
              bg="$primary"
              ai="center"
              jc="center"
            >
              <Text color="white" fontSize="$9" fontWeight="600">
                {provider.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <XStack ai="center" space="$2">
              <H1 color="$color" fontSize="$8" textAlign="center">
                {provider.display_name}
              </H1>
              {provider.is_verified && (
                <Star size={24} color="#F59E0B" fill="#F59E0B" />
              )}
            </XStack>
            {provider.is_verified && (
              <View bg="$green5" px="$3" py="$1" br="$4">
                <Text color="$green10" fontSize="$3" fontWeight="600">
                  Verified Provider
                </Text>
              </View>
            )}
          </YStack>

          {/* Bio */}
          {provider.bio && (
            <Card elevate bordered p="$4">
              <YStack space="$2">
                <H2 color="$color" fontSize="$6">
                  About
                </H2>
                <Text color="$gray10" fontSize="$4" lineHeight={24}>
                  {provider.bio}
                </Text>
              </YStack>
            </Card>
          )}

          {/* Services */}
          <YStack space="$3">
            <H2 color="$color" fontSize="$6">
              Services ({services.length})
            </H2>
            
            {services.length === 0 ? (
              <Text color="$gray10" textAlign="center">
                No services available at the moment
              </Text>
            ) : (
              services
                .filter((s) => s.is_published)
                .map((service) => (
                  <Card
                    key={service.id}
                    elevate
                    bordered
                    p="$4"
                    pressStyle={{ scale: 0.98 }}
                    onPress={() => router.push(`/service/${service.id}`)}
                  >
                    <YStack space="$2">
                      <XStack jc="space-between" ai="flex-start">
                        <Text
                          flex={1}
                          fontSize="$5"
                          fontWeight="600"
                          color="$color"
                        >
                          {service.title}
                        </Text>
                        <Text color="$primary" fontWeight="600">
                          R$ {(service.price_cents / 100).toFixed(2)}
                        </Text>
                      </XStack>
                      <Text
                        color="$gray10"
                        fontSize="$3"
                        numberOfLines={2}
                      >
                        {service.description}
                      </Text>
                      <XStack space="$1" ai="center">
                        <Clock size={14} color="gray" />
                        <Text fontSize="$2" color="$gray10">
                          {service.duration_minutes} min
                        </Text>
                      </XStack>
                    </YStack>
                  </Card>
                ))
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
