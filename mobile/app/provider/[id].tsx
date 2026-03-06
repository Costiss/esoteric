import { ChevronLeft, Clock, Star } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  H1,
  H2,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';
import {
  FloatingElement,
  GlassCard,
  Sparkle,
  TarotCard,
} from '@/components/animations';
import { apiClient, type Provider, type Service } from '@/lib/api-client';

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
      <YStack f={1} jc="center" ai="center" bg="transparent">
        <Spinner size="large" color="$secondary" />
      </YStack>
    );
  }

  if (error || !provider) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="transparent">
        <Text color="$primary" textAlign="center">
          {error || 'Provider not found'}
        </Text>
        <Button mt="$4" onPress={loadData} backgroundColor="$primary">
          <Text color="white">Retry</Text>
        </Button>
      </YStack>
    );
  }

  return (
    <YStack f={1} bg="transparent">
      <ScrollView f={1}>
        <YStack p="$4" gap="$6">
          {/* Back Button */}
          <Button
            size="$3"
            icon={<ChevronLeft size={20} color="white" />}
            onPress={() => router.back()}
            backgroundColor="rgba(255,255,255,0.05)"
            borderColor="rgba(255,255,255,0.1)"
            borderWidth={1}
            alignSelf="flex-start"
          >
            <Text color="white">Back</Text>
          </Button>

          {/* Provider Header */}
          <YStack ai="center" gap="$4">
            <FloatingElement duration={5000} distance={10}>
              <View
                width={120}
                height={120}
                borderRadius={60}
                bg="$primary"
                ai="center"
                jc="center"
                shadowColor="$primary"
                shadowRadius={30}
                shadowOpacity={0.6}
              >
                <Text color="white" fontSize="$10" fontWeight="700">
                  {provider.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </FloatingElement>

            <YStack ai="center" gap="$1">
              <XStack ai="center" gap="$2">
                <H1 color="$color" fontSize="$8" textAlign="center">
                  {provider.display_name}
                </H1>
                {provider.is_verified && (
                  <Sparkle size={24} color="$tertiary" />
                )}
              </XStack>
              <Text
                color="$secondary"
                fontSize="$4"
                fontWeight="600"
                letterSpacing={1}
              >
                MASTER OF SECRETS
              </Text>
            </YStack>

            {provider.is_verified && (
              <View
                bg="rgba(57, 255, 20, 0.1)"
                px="$4"
                py="$1.5"
                br="$10"
                borderColor="$tertiary"
                borderWidth={1}
              >
                <Text color="$tertiary" fontSize="$3" fontWeight="700">
                  VERIFIED CHANNEL
                </Text>
              </View>
            )}
          </YStack>

          {/* Bio */}
          {provider.bio && (
            <GlassCard elevation={5} gap="$2">
              <H2 color="$color" fontSize="$6">
                The Origin
              </H2>
              <Text color="$gray11" fontSize="$4" lineHeight={24}>
                {provider.bio}
              </Text>
            </GlassCard>
          )}

          {/* Services */}
          <YStack gap="$4" pb="$8">
            <H2 color="$color" fontSize="$7" textAlign="center">
              Active Rituals
            </H2>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              gap="$4"
              py="$4"
            >
              {services.length === 0 ? (
                <Text color="$gray11" textAlign="center" f={1}>
                  No rituals available in this plane
                </Text>
              ) : (
                services
                  .filter((s) => s.is_published)
                  .map((service) => (
                    <TarotCard
                      key={service.id}
                      onPress={() => router.push(`/service/${service.id}`)}
                      p="$4"
                      jc="space-between"
                    >
                      <YStack gap="$2">
                        <Text
                          color="$secondary"
                          fontSize="$2"
                          fontWeight="700"
                          textTransform="uppercase"
                        >
                          Ritual
                        </Text>
                        <Text
                          fontSize="$5"
                          fontWeight="700"
                          color="white"
                          numberOfLines={3}
                        >
                          {service.title}
                        </Text>
                      </YStack>

                      <YStack gap="$2">
                        <Text color="$primary" fontWeight="700" fontSize="$5">
                          R$ {(service.price_cents / 100).toFixed(2)}
                        </Text>
                        <XStack gap="$1" ai="center">
                          <Clock size={14} color="$gray10" />
                          <Text fontSize="$2" color="$gray10">
                            {service.duration_minutes} min
                          </Text>
                        </XStack>
                      </YStack>
                    </TarotCard>
                  ))
              )}
            </ScrollView>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
