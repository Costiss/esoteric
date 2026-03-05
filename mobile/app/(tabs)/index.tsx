import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  H1,
  H2,
  Paragraph,
  Spinner,
  ScrollView,
  View,
} from 'tamagui';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, type Service, type Provider } from '@/lib/api-client';
import { Sparkles, Star, ArrowRight, Search } from '@tamagui/lucide-icons';

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
      setFeaturedServices(servicesResponse.services);
      setTopProviders(providersResponse.providers);
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
      <YStack f={1} jc="center" ai="center" bg="$background">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <ScrollView f={1} bg="$background">
      <YStack p="$4" space="$6">
        {/* Header */}
        <YStack space="$2">
          <XStack ai="center" space="$2">
            <Sparkles size={24} color="#8B5CF6" />
            <Text color="$primary" fontSize="$4" fontWeight="600">
              Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
            </Text>
          </XStack>
          <H1 color="$color" fontSize="$9">
            Discover Esoteric Services
          </H1>
          <Paragraph color="$gray10" fontSize="$4">
            Connect with talented practitioners for tarot readings, astrology, reiki, and more.
          </Paragraph>
        </YStack>

        {/* Search Button */}
        <Button
          size="$5"
          theme="secondary"
          icon={<Search size={20} />}
          onPress={() => router.push('/(tabs)/explore')}
        >
          Search Services
        </Button>

        {/* Featured Services */}
        <YStack space="$3">
          <XStack jc="space-between" ai="center">
            <H2 color="$color" fontSize="$6">
              Featured Services
            </H2>
            <Button
              size="$2"
              variant="outlined"
              iconAfter={<ArrowRight size={16} />}
              onPress={() => router.push('/(tabs)/explore')}
            >
              See All
            </Button>
          </XStack>

          <YStack space="$3">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </YStack>
        </YStack>

        {/* Top Providers */}
        <YStack space="$3">
          <XStack jc="space-between" ai="center">
            <H2 color="$color" fontSize="$6">
              Top Providers
            </H2>
            <Button
              size="$2"
              variant="outlined"
              iconAfter={<ArrowRight size={16} />}
              onPress={() => router.push('/(tabs)/explore')}
            >
              See All
            </Button>
          </XStack>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack space="$3">
              {topProviders.map((provider) => (
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
    <Card
      elevate
      bordered
      p="$4"
      pressStyle={{ scale: 0.98 }}
      onPress={() => router.push(`/service/${service.id}`)}
    >
      <YStack space="$2">
        <XStack jc="space-between" ai="flex-start">
          <Text flex={1} fontSize="$5" fontWeight="600" color="$color">
            {service.title}
          </Text>
          <Text color="$primary" fontWeight="600">
            R$ {(service.price_cents / 100).toFixed(2)}
          </Text>
        </XStack>
        <Text color="$gray10" fontSize="$3" numberOfLines={2}>
          {service.description}
        </Text>
        <XStack space="$2" flexWrap="wrap">
          {service.tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              bg="$backgroundHover"
              px="$2"
              py="$1"
              br="$2"
            >
              <Text fontSize="$2" color="$gray10">
                {tag}
              </Text>
            </View>
          ))}
        </XStack>
      </YStack>
    </Card>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  const router = useRouter();

  return (
    <Card
      elevate
      bordered
      p="$4"
      width={200}
      pressStyle={{ scale: 0.98 }}
      onPress={() => router.push(`/provider/${provider.id}`)}
    >
      <YStack space="$2" ai="center">
        <View
          width={60}
          height={60}
          borderRadius={30}
          bg="$primary"
          ai="center"
          jc="center"
        >
          <Text color="white" fontSize="$6" fontWeight="600">
            {provider.display_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text fontSize="$4" fontWeight="600" color="$color" textAlign="center">
          {provider.display_name}
        </Text>
        {provider.is_verified && (
          <XStack space="$1" ai="center">
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text fontSize="$2" color="gray">
              Verified
            </Text>
          </XStack>
        )}
      </YStack>
    </Card>
  );
}
