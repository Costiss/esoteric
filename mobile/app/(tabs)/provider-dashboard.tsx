import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
} from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  H2,
  H3,
  ScrollView,
  Separator,
  Spinner,
  Tabs,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';
import { FloatingElement, GlassCard, Sparkle } from '@/components/animations';
import { useAuth } from '@/contexts/auth-context';
import {
  apiClient,
  type Booking,
  type ProviderStats,
  type Service,
} from '@/lib/api-client';

export default function ProviderDashboardScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');

  const { providerProfile } = useAuth();
  const router = useRouter();

  const loadDashboardData = useCallback(async () => {
    if (!providerProfile) return;

    try {
      setIsLoading(true);
      setError('');

      const [statsData, bookingsData, servicesData] = await Promise.all([
        apiClient.getProviderStats(providerProfile.id).catch(() => ({
          total_bookings: 0,
          pending_confirmations: 0,
          earnings_this_month_cents: 0,
          active_services: 0,
        })),
        apiClient.getProviderBookings(providerProfile.id, { per_page: 5 }),
        apiClient.getProviderServices(providerProfile.id),
      ]);

      setStats(statsData);
      setRecentBookings(bookingsData.bookings);
      setServices(servicesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data',
      );
    } finally {
      setIsLoading(false);
    }
  }, [providerProfile]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} color="$tertiary" />;
      case 'requested':
        return <AlertCircle size={16} color="$primary" />;
      case 'in_progress':
        return <Clock size={16} color="$secondary" />;
      default:
        return <Clock size={16} color="$gray10" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '$tertiary';
      case 'in_progress':
        return '$secondary';
      case 'cancelled':
        return '$primary';
      case 'completed':
        return '$gray10';
      default:
        return '$yellow10';
    }
  };

  if (isLoading) {
    return (
      <YStack f={1} jc="center" ai="center" bg="transparent">
        <Spinner size="large" color="$secondary" />
        <Text mt="$4" color="$gray10">
          Peer-ing into the veil...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="transparent">
        <AlertCircle size={64} color="$primary" />
        <Text mt="$4" color="$primary" textAlign="center">
          {error}
        </Text>
        <Button mt="$4" onPress={loadDashboardData} backgroundColor="$primary">
          <Text color="white">Retry</Text>
        </Button>
      </YStack>
    );
  }

  return (
    <YStack f={1} bg="transparent">
      <ScrollView>
        <YStack p="$4" gap="$4">
          {/* Header */}
          <XStack jc="space-between" ai="center">
            <YStack gap="$1">
              <H2 color="$color">Sanctum Control</H2>
              <Text color="$gray11">
                Welcome back, {providerProfile?.display_name}
              </Text>
            </YStack>
            {providerProfile?.is_verified && (
              <XStack
                ai="center"
                gap="$1"
                bg="rgba(57, 255, 20, 0.1)"
                px="$2"
                py="$1"
                br="$2"
                borderColor="$tertiary"
                borderWidth={1}
              >
                <Sparkle size={12} color="$tertiary" />
                <Text color="$tertiary" fontSize="$2" fontWeight="700">
                  Verified
                </Text>
              </XStack>
            )}
          </XStack>

          {/* Stats Cards */}
          <XStack flexWrap="wrap" gap="$3">
            <StatCard
              title="Total Visions"
              value={stats?.total_bookings || 0}
              icon={<Calendar size={24} color="$secondary" />}
              flex={1}
            />
            <StatCard
              title="Awaiting"
              value={stats?.pending_confirmations || 0}
              icon={<AlertCircle size={24} color="$primary" />}
              flex={1}
            />
          </XStack>

          <XStack flexWrap="wrap" gap="$3">
            <StatCard
              title="Essence Gained"
              value={formatCurrency(stats?.earnings_this_month_cents || 0)}
              icon={<DollarSign size={24} color="$tertiary" />}
              flex={1}
            />
            <StatCard
              title="Rituals"
              value={stats?.active_services || services.length}
              icon={<Package size={24} color="$secondary" />}
              flex={1}
            />
          </XStack>

          {/* Quick Actions */}
          <GlassCard elevation={5} p="$4">
            <H3 color="$color" mb="$3" fontSize="$5">
              Quick Invocations
            </H3>
            <XStack gap="$2">
              <Button
                flex={1}
                backgroundColor="rgba(255, 45, 85, 0.1)"
                borderColor="$primary"
                borderWidth={1}
                onPress={() => {}}
              >
                <XStack ai="center" gap="$2">
                  <Package size={16} color="white" />
                  <Text color="white" fontWeight="600">
                    New Ritual
                  </Text>
                </XStack>
              </Button>
              <Button
                flex={1}
                backgroundColor="rgba(0, 242, 255, 0.1)"
                borderColor="$secondary"
                borderWidth={1}
                onPress={() => setActiveTab('bookings')}
              >
                <XStack ai="center" gap="$2">
                  <Calendar size={16} color="white" />
                  <Text color="white" fontWeight="600">
                    Bookings
                  </Text>
                </XStack>
              </Button>
            </XStack>
          </GlassCard>

          {/* Tab Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="horizontal"
            flexDirection="column"
          >
            <Tabs.List gap="$2" backgroundColor="transparent" borderWidth={0}>
              <Tabs.Tab
                value="overview"
                flex={1}
                backgroundColor={
                  activeTab === 'overview'
                    ? 'rgba(255,255,255,0.1)'
                    : 'transparent'
                }
              >
                <Text color={activeTab === 'overview' ? 'white' : '$gray10'}>
                  Overview
                </Text>
              </Tabs.Tab>
              <Tabs.Tab
                value="bookings"
                flex={1}
                backgroundColor={
                  activeTab === 'bookings'
                    ? 'rgba(255,255,255,0.1)'
                    : 'transparent'
                }
              >
                <Text color={activeTab === 'bookings' ? 'white' : '$gray10'}>
                  Bookings
                </Text>
              </Tabs.Tab>
              <Tabs.Tab
                value="services"
                flex={1}
                backgroundColor={
                  activeTab === 'services'
                    ? 'rgba(255,255,255,0.1)'
                    : 'transparent'
                }
              >
                <Text color={activeTab === 'services' ? 'white' : '$gray10'}>
                  Services
                </Text>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Content value="overview" pt="$4">
              <OverviewTab
                recentBookings={recentBookings}
                services={services.slice(0, 3)}
                formatDate={formatDate}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            </Tabs.Content>

            <Tabs.Content value="bookings" pt="$4">
              <BookingsTab
                bookings={recentBookings}
                formatDate={formatDate}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            </Tabs.Content>

            <Tabs.Content value="services" pt="$4">
              <ServicesTab services={services} />
            </Tabs.Content>
          </Tabs>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  flex?: number;
}

function StatCard({ title, value, icon, flex }: StatCardProps) {
  return (
    <GlassCard elevation={5} p="$3" flex={flex} minWidth={140}>
      <XStack ai="center" gap="$2" mb="$2">
        {icon}
        <Text fontSize="$2" color="$gray11">
          {title}
        </Text>
      </XStack>
      <Text fontSize="$7" fontWeight="700" color="$color">
        {value}
      </Text>
    </GlassCard>
  );
}

interface OverviewTabProps {
  recentBookings: Booking[];
  services: Service[];
  formatDate: (date: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

function OverviewTab({
  recentBookings,
  services,
  formatDate,
  getStatusIcon,
  getStatusColor,
}: OverviewTabProps) {
  const router = useRouter();

  return (
    <YStack gap="$4">
      {/* Recent Bookings */}
      <GlassCard elevation={5} gap="$3">
        <XStack jc="space-between" ai="center">
          <H3 color="$color" fontSize="$5">
            Recent Visions
          </H3>
          <Button
            size="$2"
            backgroundColor="transparent"
            borderColor="rgba(255,255,255,0.2)"
            borderWidth={1}
          >
            <Text color="white" fontSize="$1">
              View All
            </Text>
          </Button>
        </XStack>

        {recentBookings.length === 0 ? (
          <Text color="$gray11" textAlign="center" py="$4">
            No visions recorded yet
          </Text>
        ) : (
          recentBookings.slice(0, 3).map((booking) => (
            <View
              key={booking.id}
              p="$3"
              br="$4"
              backgroundColor="rgba(255,255,255,0.03)"
              borderColor="rgba(255,255,255,0.05)"
              borderWidth={1}
            >
              <XStack jc="space-between" ai="center">
                <YStack gap="$1">
                  <Text fontWeight="600" color="$color" fontSize="$3">
                    Ref: {booking.id.slice(0, 8)}...
                  </Text>
                  <Text fontSize="$2" color="$gray11">
                    {formatDate(booking.start_ts)}
                  </Text>
                </YStack>
                <XStack ai="center" gap="$2">
                  {getStatusIcon(booking.status)}
                  <View
                    bg={getStatusColor(booking.status)}
                    px="$2"
                    py="$1"
                    br="$2"
                    opacity={0.8}
                  >
                    <Text
                      color="white"
                      fontSize="$1"
                      fontWeight="700"
                      textTransform="capitalize"
                    >
                      {booking.status.replace('_', ' ')}
                    </Text>
                  </View>
                </XStack>
              </XStack>
            </View>
          ))
        )}
      </GlassCard>

      {/* Active Services Preview */}
      <GlassCard elevation={5} gap="$3">
        <XStack jc="space-between" ai="center">
          <H3 color="$color" fontSize="$5">
            Active Rituals
          </H3>
          <Button
            size="$2"
            backgroundColor="transparent"
            borderColor="rgba(255,255,255,0.2)"
            borderWidth={1}
          >
            <Text color="white" fontSize="$1">
              Manage
            </Text>
          </Button>
        </XStack>

        {services.length === 0 ? (
          <Text color="$gray11" textAlign="center" py="$4">
            No active rituals. Manifest your first one!
          </Text>
        ) : (
          services.map((service) => (
            <View
              key={service.id}
              p="$3"
              br="$4"
              backgroundColor="rgba(255,255,255,0.03)"
              borderColor="rgba(255,255,255,0.05)"
              borderWidth={1}
              onPress={() => router.push(`/service/${service.id}`)}
            >
              <XStack jc="space-between" ai="center">
                <YStack flex={1} gap="$1">
                  <Text fontWeight="600" color="$color" numberOfLines={1}>
                    {service.title}
                  </Text>
                  <Text fontSize="$2" color="$gray11">
                    {service.duration_minutes} min • R${' '}
                    {(service.price_cents / 100).toFixed(2)}
                  </Text>
                </YStack>
                <View
                  bg={service.is_published ? '$tertiary' : '$primary'}
                  px="$2"
                  py="$1"
                  br="$2"
                  opacity={0.8}
                >
                  <Text color="white" fontSize="$1" fontWeight="700">
                    {service.is_published ? 'Active' : 'Draft'}
                  </Text>
                </View>
              </XStack>
            </View>
          ))
        )}
      </GlassCard>
    </YStack>
  );
}

interface BookingsTabProps {
  bookings: Booking[];
  formatDate: (date: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

function BookingsTab({
  bookings,
  formatDate,
  getStatusIcon,
  getStatusColor,
}: BookingsTabProps) {
  const router = useRouter();

  return (
    <YStack gap="$3" pb="$8">
      {bookings.length === 0 ? (
        <GlassCard elevation={5} p="$8">
          <YStack ai="center" gap="$3">
            <FloatingElement>
              <Calendar size={64} color="$secondary" opacity={0.5} />
            </FloatingElement>
            <Text color="$gray11" textAlign="center">
              No rituals in the registry
            </Text>
          </YStack>
        </GlassCard>
      ) : (
        bookings.map((booking) => (
          <GlassCard
            key={booking.id}
            elevation={5}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <YStack gap="$3">
              <XStack jc="space-between" ai="center">
                <Text fontWeight="600" color="$color">
                  Ritual ID: {booking.id.slice(0, 8)}...
                </Text>
                <XStack ai="center" gap="$2">
                  {getStatusIcon(booking.status)}
                  <View
                    bg={getStatusColor(booking.status)}
                    px="$2"
                    py="$1"
                    br="$2"
                    opacity={0.8}
                  >
                    <Text
                      color="white"
                      fontSize="$2"
                      fontWeight="700"
                      textTransform="capitalize"
                    >
                      {booking.status.replace('_', ' ')}
                    </Text>
                  </View>
                </XStack>
              </XStack>

              <Separator borderColor="rgba(255,255,255,0.1)" />

              <XStack gap="$2" ai="center">
                <Clock size={16} color="$secondary" />
                <Text color="$gray11">{formatDate(booking.start_ts)}</Text>
              </XStack>

              <Text fontWeight="700" color="$primary" fontSize="$5">
                R$ {(booking.price_cents / 100).toFixed(2)}
              </Text>
            </YStack>
          </GlassCard>
        ))
      )}
    </YStack>
  );
}

interface ServicesTabProps {
  services: Service[];
}

function ServicesTab({ services }: ServicesTabProps) {
  const router = useRouter();

  return (
    <YStack gap="$3" pb="$8">
      <Button backgroundColor="$primary" onPress={() => {}}>
        <XStack ai="center" gap="$2">
          <Package size={16} color="white" />
          <Text color="white" fontWeight="700">
            Forge New Ritual
          </Text>
        </XStack>
      </Button>

      {services.length === 0 ? (
        <GlassCard elevation={5} p="$8">
          <YStack ai="center" gap="$3">
            <Package size={64} color="$secondary" opacity={0.5} />
            <Text color="$gray11" textAlign="center">
              Your sanctum is empty. Forge rituals to welcome seekers.
            </Text>
          </YStack>
        </GlassCard>
      ) : (
        services.map((service) => (
          <GlassCard
            key={service.id}
            elevation={5}
            onPress={() => router.push(`/service/${service.id}`)}
          >
            <YStack gap="$3">
              <XStack jc="space-between" ai="flex-start">
                <Text flex={1} fontSize="$5" fontWeight="600" color="$color">
                  {service.title}
                </Text>
                <View
                  bg={service.is_published ? '$tertiary' : '$primary'}
                  px="$2"
                  py="$1"
                  br="$2"
                  opacity={0.8}
                >
                  <Text color="white" fontSize="$2" fontWeight="700">
                    {service.is_published ? 'Active' : 'Draft'}
                  </Text>
                </View>
              </XStack>

              <Text color="$gray11" fontSize="$3" numberOfLines={2}>
                {service.description}
              </Text>

              <XStack jc="space-between" ai="center">
                <Text color="$primary" fontWeight="700" fontSize="$4">
                  R$ {(service.price_cents / 100).toFixed(2)}
                </Text>
                <XStack gap="$1" ai="center">
                  <Clock size={14} color="$secondary" />
                  <Text fontSize="$2" color="$gray11">
                    {service.duration_minutes} min
                  </Text>
                </XStack>
              </XStack>
            </YStack>
          </GlassCard>
        ))
      )}
    </YStack>
  );
}
