import { Clock, Search, Star } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Button,
  H2,
  Input,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';
import { FloatingElement, GlassCard, Sparkle } from '@/components/animations';
import { apiClient, type Provider, type Service } from '@/lib/api-client';

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
        setServices(response?.services || []);
      } else {
        const response = await apiClient.listProviders({
          per_page: 20,
        });
        setProviders(response?.providers || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  return (
    <YStack f={1} bg="transparent">
      <YStack p="$4" gap="$4">
        <XStack ai="center" gap="$2">
          <H2 color="$color">Discover</H2>
          <Sparkle size={24} color="$secondary" />
        </XStack>

        {/* Search Bar */}
        <XStack gap="$2" ai="center">
          <View f={1} pos="relative">
            <Input
              size="$4"
              placeholder={
                activeTab === 'services'
                  ? 'Search services (tarot, reiki, astrology...)'
                  : 'Search providers...'
              }
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              backgroundColor="rgba(255,255,255,0.05)"
              borderColor="rgba(255,255,255,0.1)"
              pl="$8"
            />
            <View pos="absolute" l="$3" t="50%" mt={-10}>
              <Search size={20} color="gray" />
            </View>
          </View>
          <Button size="$4" onPress={handleSearch} backgroundColor="$primary">
            <Text color="white" fontWeight="600">
              Search
            </Text>
          </Button>
        </XStack>

        {/* Tabs */}
        <XStack gap="$2">
          <Button
            flex={1}
            onPress={() => setActiveTab('services')}
            backgroundColor={
              activeTab === 'services' ? '$primary' : 'rgba(255,255,255,0.05)'
            }
            borderColor={
              activeTab === 'services' ? '$primary' : 'rgba(255,255,255,0.1)'
            }
            borderWidth={1}
          >
            <Text
              color="white"
              fontWeight={activeTab === 'services' ? '700' : '400'}
            >
              Services
            </Text>
          </Button>
          <Button
            flex={1}
            onPress={() => setActiveTab('providers')}
            backgroundColor={
              activeTab === 'providers' ? '$primary' : 'rgba(255,255,255,0.05)'
            }
            borderColor={
              activeTab === 'providers' ? '$primary' : 'rgba(255,255,255,0.1)'
            }
            borderWidth={1}
          >
            <Text
              color="white"
              fontWeight={activeTab === 'providers' ? '700' : '400'}
            >
              Providers
            </Text>
          </Button>
        </XStack>
      </YStack>

      {/* Content */}
      <ScrollView f={1} p="$4">
        {isLoading ? (
          <YStack f={1} jc="center" ai="center" p="$8">
            <Spinner size="large" color="$secondary" />
            <Text mt="$4" color="$gray10">
              Consulting the stars...
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
      <FloatingElement>
        <YStack ai="center" jc="center" p="$8" gap="$4">
          <Search size={64} color="$secondary" opacity={0.5} />
          <Text color="$gray10" textAlign="center">
            Search for services like tarot readings, astrology, reiki, and more
          </Text>
        </YStack>
      </FloatingElement>
    );
  }

  return (
    <YStack gap="$3" pb="$8">
      {services.map((service) => (
        <GlassCard
          key={service.id}
          elevation={5}
          pressStyle={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.1)' }}
          onPress={() => router.push(`/service/${service.id}`)}
        >
          <YStack gap="$2">
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
              <XStack gap="$2" flexWrap="wrap">
                {service.tags.slice(0, 3).map((tag) => (
                  <View
                    key={tag}
                    bg="rgba(0, 242, 255, 0.1)"
                    px="$2"
                    py="$1"
                    br="$2"
                    borderColor="rgba(0, 242, 255, 0.2)"
                    borderWidth={1}
                  >
                    <Text fontSize="$2" color="$secondary">
                      {tag}
                    </Text>
                  </View>
                ))}
              </XStack>
              <XStack gap="$1" ai="center">
                <Clock size={14} color="$secondary" />
                <Text fontSize="$2" color="$gray10">
                  {service.duration_minutes} min
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </GlassCard>
      ))}
    </YStack>
  );
}

function ProvidersList({ providers }: { providers: Provider[] }) {
  const router = useRouter();

  if (providers.length === 0) {
    return (
      <FloatingElement>
        <YStack ai="center" jc="center" p="$8" gap="$4">
          <Search size={64} color="$secondary" opacity={0.5} />
          <Text color="$gray10" textAlign="center">
            No practitioners found in this realm
          </Text>
        </YStack>
      </FloatingElement>
    );
  }

  return (
    <YStack gap="$3" pb="$8">
      {providers.map((provider) => (
        <GlassCard
          key={provider.id}
          elevation={5}
          pressStyle={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.1)' }}
          onPress={() => router.push(`/provider/${provider.id}`)}
        >
          <XStack gap="$3" ai="center">
            <View
              width={60}
              height={60}
              borderRadius={30}
              bg="$primary"
              ai="center"
              jc="center"
              shadowColor="$primary"
              shadowRadius={10}
              shadowOpacity={0.5}
            >
              <Text color="white" fontSize="$6" fontWeight="600">
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
              {provider.bio && (
                <Text color="$gray10" fontSize="$3" numberOfLines={2}>
                  {provider.bio}
                </Text>
              )}
            </YStack>
          </XStack>
        </GlassCard>
      ))}
    </YStack>
  );
}
