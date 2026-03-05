import { useState, useCallback } from 'react';
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  Input,
  H2,
  Spinner,
  ScrollView,
  View,
} from 'tamagui';
import { apiClient, type Service, type Provider } from '@/lib/api-client';
import { Search, Star, Clock } from '@tamagui/lucide-icons';

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'services') {
        const response = await apiClient.searchServices({
          tag: searchQuery || undefined,
          per_page: 20,
        });
        setServices(response.services);
      } else {
        const response = await apiClient.listProviders({
          per_page: 20,
        });
        setProviders(response.providers);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  return (
    <YStack f={1} bg="$background">
      <YStack p="$4" space="$4">
        <H2 color="$color">Discover</H2>

        {/* Search Bar */}
        <XStack space="$2">
          <Input
            flex={1}
            size="$4"
            placeholder={
              activeTab === 'services'
                ? 'Search services (tarot, reiki, astrology...)'
                : 'Search providers...'
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            icon={<Search size={20} color="gray" />}
          />
          <Button size="$4" onPress={handleSearch}>
            Search
          </Button>
        </XStack>

        {/* Tabs */}
        <XStack space="$2">
          <Button
            flex={1}
            theme={activeTab === 'services' ? 'active' : undefined}
            onPress={() => setActiveTab('services')}
          >
            Services
          </Button>
          <Button
            flex={1}
            theme={activeTab === 'providers' ? 'active' : undefined}
            onPress={() => setActiveTab('providers')}
          >
            Providers
          </Button>
        </XStack>
      </YStack>

      {/* Content */}
      <ScrollView f={1} p="$4">
        {isLoading ? (
          <YStack f={1} jc="center" ai="center" p="$8">
            <Spinner size="large" />
            <Text mt="$4" color="$gray10">
              Searching...
            </Text>
          </YStack>
        ) : activeTab === 'services' ? (
          <ServicesList services={services} />
        ) : (
          <ProvidersList providers={providers} />
        )}
      </ScrollView>
    </YStack>
  );
}

function ServicesList({ services }: { services: Service[] }) {
  const router = useRouter();

  if (services.length === 0) {
    return (
      <YStack ai="center" jc="center" p="$8" space="$4">
        <Search size={64} color="gray" />
        <Text color="$gray10" textAlign="center">
          Search for services like tarot readings, astrology, reiki, and more
        </Text>
      </YStack>
    );
  }

  return (
    <YStack space="$3">
      {services.map((service) => (
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
            <XStack jc="space-between" ai="center">
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
              <XStack space="$1" ai="center">
                <Clock size={14} color="gray" />
                <Text fontSize="$2" color="$gray10">
                  {service.duration_minutes} min
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </Card>
      ))}
    </YStack>
  );
}

function ProvidersList({ providers }: { providers: Provider[] }) {
  const router = useRouter();

  if (providers.length === 0) {
    return (
      <YStack ai="center" jc="center" p="$8" space="$4">
        <Search size={64} color="gray" />
        <Text color="$gray10" textAlign="center">
          No providers found
        </Text>
      </YStack>
    );
  }

  return (
    <YStack space="$3">
      {providers.map((provider) => (
        <Card
          key={provider.id}
          elevate
          bordered
          p="$4"
          pressStyle={{ scale: 0.98 }}
          onPress={() => router.push(`/provider/${provider.id}`)}
        >
          <XStack space="$3" ai="center">
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
            <YStack flex={1} space="$1">
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
      ))}
    </YStack>
  );
}
