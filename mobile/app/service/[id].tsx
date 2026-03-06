import { Calendar, ChevronLeft, Clock, Star } from '@tamagui/lucide-icons';
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
import { FloatingElement, GlassCard, Sparkle } from '@/components/animations';
import { apiClient, type Provider, type Service } from '@/lib/api-client';

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
      <YStack f={1} jc="center" ai="center" bg="transparent">
        <Spinner size="large" color="$secondary" />
      </YStack>
    );
  }

  if (error || !service) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="transparent">
        <Text color="$primary" textAlign="center">
          {error || 'Service not found'}
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
        <YStack p="$4" gap="$4">
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

          {/* Header */}
          <YStack gap="$2">
            <XStack ai="center" gap="$2">
              <H1 color="$color" fontSize="$8" f={1}>
                {service.title}
              </H1>
              <FloatingElement>
                <Sparkle size={32} color="$secondary" />
              </FloatingElement>
            </XStack>

            <XStack gap="$3" ai="center">
              <XStack
                gap="$1.5"
                ai="center"
                bg="rgba(0, 242, 255, 0.05)"
                px="$2"
                py="$1"
                br="$2"
              >
                <Clock size={16} color="$secondary" />
                <Text color="$gray11" fontSize="$3">
                  {service.duration_minutes} min
                </Text>
              </XStack>
              <Text color="$gray11" fontSize="$5">
                •
              </Text>
              <Text color="$primary" fontWeight="700" fontSize="$5">
                R$ {(service.price_cents / 100).toFixed(2)}
              </Text>
            </XStack>
          </YStack>

          {/* Provider Info */}
          {provider && (
            <GlassCard
              elevation={10}
              p="$4"
              onPress={() => router.push(`/provider/${provider.id}`)}
            >
              <XStack gap="$3" ai="center">
                <View
                  width={50}
                  height={50}
                  borderRadius={25}
                  bg="$primary"
                  ai="center"
                  jc="center"
                  shadowColor="$primary"
                  shadowRadius={10}
                  shadowOpacity={0.4}
                >
                  <Text color="white" fontSize="$5" fontWeight="600">
                    {provider.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <YStack flex={1} gap="$1">
                  <XStack ai="center" gap="$2">
                    <Text fontSize="$5" fontWeight="600" color="$color">
                      {provider.display_name}
                    </Text>
                    {provider.is_verified && (
                      <Star size={16} color="$tertiary" fill="$tertiary" />
                    )}
                  </XStack>
                  <Text color="$gray11" fontSize="$2">
                    Vocalizer of the Unseen
                  </Text>
                </YStack>
                <Text color="$gray10" fontSize="$6">
                  ›
                </Text>
              </XStack>
            </GlassCard>
          )}

          {/* Description */}
          <GlassCard elevation={2}>
            <YStack gap="$2">
              <H2 color="$color" fontSize="$6">
                The Revelation
              </H2>
              <Text color="$gray11" fontSize="$4" lineHeight={24}>
                {service.description}
              </Text>
            </YStack>
          </GlassCard>

          {/* Tags */}
          {service.tags.length > 0 && (
            <YStack gap="$3">
              <Text color="$color" fontSize="$4" fontWeight="600">
                Aspects
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {service.tags.map((tag) => (
                  <View
                    key={tag}
                    bg="rgba(255, 45, 85, 0.05)"
                    px="$3"
                    py="$2"
                    br="$4"
                    borderColor="rgba(255, 45, 85, 0.2)"
                    borderWidth={1}
                  >
                    <Text fontSize="$3" color="$primary" fontWeight="600">
                      {tag}
                    </Text>
                  </View>
                ))}
              </XStack>
            </YStack>
          )}

          <View height="$8" />
        </YStack>
      </ScrollView>

      {/* Book Now Button */}
      <YStack
        p="$4"
        backgroundColor="rgba(5, 2, 8, 0.8)"
        borderTopWidth={1}
        borderTopColor="rgba(255,255,255,0.05)"
        pb="$8"
      >
        <Button
          size="$5"
          backgroundColor="$primary"
          onPress={handleBookNow}
          shadowColor="$primary"
          shadowRadius={15}
          shadowOpacity={0.4}
        >
          <XStack ai="center" gap="$2">
            <Calendar size={20} color="white" />
            <Text color="white" fontWeight="700" fontSize="$4">
              Book Ritual - R$ {(service.price_cents / 100).toFixed(2)}
            </Text>
          </XStack>
        </Button>
      </YStack>
    </YStack>
  );
}
