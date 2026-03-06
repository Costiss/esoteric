import { ArrowRight, Search, Sparkles, Star } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  H1,
  H2,
  Paragraph,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';
import { FloatingElement, GlassCard, TarotCard } from '@/components/animations';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, type Provider, type Service } from '@/lib/api-client';

export default function HomeScreen() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [topProviders, setTopProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [servicesResponse, providersResponse] = await Promise.all([
        apiClient.searchServices({ per_page: 6, provider_verified_only: true }),
        apiClient.listProviders({ per_page: 4, verified_only: true }),
      ]);
      setFeaturedServices(servicesResponse?.services || []);
      setTopProviders(providersResponse?.providers || []);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <YStack f={1} jc="center" ai="center" bg="transparent">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  return (
    <ScrollView f={1} bg="transparent">
      <YStack p="$4" gap="$6" pt="$10">
        {/* Header */}
        <YStack gap="$2">
          <XStack ai="center" gap="$2">
            <FloatingElement duration={2000} distance={5}>
              <Sparkles size={24} color="#FF2D55" />
            </FloatingElement>
            <Text
              color="$secondary"
              fontSize="$4"
              fontWeight="600"
              letterSpacing={1}
            >
              WELCOME
              {user?.full_name
                ? `, ${user.full_name.split(' ')[0].toUpperCase()}`
                : ''}
            </Text>
          </XStack>
          <H1 color="$color" fontSize="$10" lineHeight={50} fontWeight="900">
            Discover the <Text color="$primary">Unseen</Text>
          </H1>
          <Paragraph color="$gray10" fontSize="$4" lineHeight={22}>
            Connect with mystical practitioners for tarot, astrology, and
            ancient wisdom.
          </Paragraph>
        </YStack>

        {/* Search Button */}
        <Button
          size="$6"
          bg="rgba(0, 242, 255, 0.15)"
          borderColor="$secondary"
          borderWidth={1}
          icon={<Search size={20} color="$secondary" />}
          onPress={() => router.push('/(tabs)/explore')}
          pressStyle={{ scale: 0.95, opacity: 0.8 }}
        >
          <Text color="$secondary" fontWeight="700" letterSpacing={1}>
            SEARCH SERVICES
          </Text>
        </Button>

        {/* Featured Services */}
        <YStack gap="$4">
          <XStack jc="space-between" ai="center">
            <H2 color="$color" fontSize="$7" fontWeight="800">
              Sacred Services
            </H2>
            <Button
              size="$2"
              variant="outlined"
              borderColor="transparent"
              iconAfter={<ArrowRight size={16} color="$primary" />}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text color="$primary">See All</Text>
            </Button>
          </XStack>

          <YStack gap="$4">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </YStack>
        </YStack>

        {/* Top Providers */}
        <YStack gap="$4">
          <XStack jc="space-between" ai="center">
            <H2 color="$color" fontSize="$7" fontWeight="800">
              Master Practitioners
            </H2>
            <Button
              size="$2"
              variant="outlined"
              borderColor="transparent"
              iconAfter={<ArrowRight size={16} color="$primary" />}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text color="$primary">See All</Text>
            </Button>
          </XStack>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} p="$2">
            <XStack gap="$4">
              {topProviders?.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </XStack>
          </ScrollView>
        </YStack>
      </YStack>
    </ScrollView>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const router = useRouter();

  return (
    <GlassCard
      onPress={() => router.push(`/service/${service.id}`)}
      pressStyle={{ scale: 0.98, backgroundColor: 'rgba(255, 45, 85, 0.1)' }}
    >
      <YStack gap="$2">
        <XStack jc="space-between" ai="flex-start">
          <Text flex={1} fontSize="$6" fontWeight="700" color="$color">
            {service.title}
          </Text>
          <Text color="$secondary" fontWeight="800" fontSize="$5">
            ${(service.price_cents / 100).toFixed(0)}
          </Text>
        </XStack>
        <Text color="$gray9" fontSize="$3" numberOfLines={2} lineHeight={18}>
          {service.description}
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {service.tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              bg="rgba(57, 255, 20, 0.1)"
              px="$2"
              py="$1"
              br="$2"
              borderColor="rgba(57, 255, 20, 0.3)"
              borderWidth={1}
            >
              <Text fontSize="$1" color="$tertiary" fontWeight="700">
                {tag.toUpperCase()}
              </Text>
            </View>
          ))}
        </XStack>
      </YStack>
    </GlassCard>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  const router = useRouter();

  return (
    <TarotCard
      onPress={() => router.push(`/provider/${provider.id}`)}
      jc="center"
      ai="center"
      p="$4"
    >
      <YStack gap="$4" ai="center">
        <View
          width={80}
          height={80}
          borderRadius={40}
          borderColor="$secondary"
          borderWidth={2}
          ai="center"
          jc="center"
          bg="$deepVoid"
          shadowColor="$secondary"
          shadowRadius={10}
          shadowOpacity={0.5}
        >
          <Text color="$secondary" fontSize="$8" fontWeight="900">
            {provider.display_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <YStack ai="center" gap="$1">
          <Text
            fontSize="$5"
            fontWeight="800"
            color="$color"
            textAlign="center"
          >
            {provider.display_name}
          </Text>
          {provider.is_verified && (
            <XStack gap="$1" ai="center">
              <Star size={14} color="$tertiary" fill="$tertiary" />
              <Text
                fontSize="$1"
                color="$tertiary"
                fontWeight="700"
                letterSpacing={1}
              >
                VERIFIED
              </Text>
            </XStack>
          )}
        </YStack>
      </YStack>
    </TarotCard>
  );
}
