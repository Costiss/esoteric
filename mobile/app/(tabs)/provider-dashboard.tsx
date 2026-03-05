import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  H2,
  H3,
  Spinner,
  ScrollView,
  View,
  Separator,
  Tabs,
} from 'tamagui';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, type Booking, type Service, type ProviderStats } from '@/lib/api-client';
import { 
  Calendar, 
  DollarSign, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle
} from '@tamagui/lucide-icons';

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
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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
        return <CheckCircle size={16} color="#10B981" />;
      case 'requested':
        return <AlertCircle size={16} color="#F59E0B" />;
      case 'in_progress':
        return <Clock size={16} color="#3B82F6" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '$green10';
      case 'in_progress':
        return '$blue10';
      case 'cancelled':
        return '$red10';
      case 'completed':
        return '$gray10';
      default:
        return '$yellow10';
    }
  };

  if (isLoading) {
    return (
      <YStack f={1} jc="center" ai="center" bg="$background">
        <Spinner size="large" />
        <Text mt="$4" color="$gray10">
          Loading dashboard...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack f={1} jc="center" ai="center" p="$4" bg="$background">
        <AlertCircle size={64} color="#EF4444" />
        <Text mt="$4" color="$red10" textAlign="center">
          {error}
        </Text>
        <Button mt="$4" onPress={loadDashboardData}>
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <YStack f={1} bg="$background">
      <ScrollView>
        <YStack p="$4" space="$4">
          {/* Header */}
          <XStack jc="space-between" ai="center">
            <YStack>
              <H2 color="$color">Provider Dashboard</H2>
              <Text color="$gray10">
                Welcome back, {providerProfile?.display_name}
              </Text>
            </YStack>
            {providerProfile?.is_verified && (
              <View bg="$green10" px="$2" py="$1" br="$2">
                <Text color="white" fontSize="$2" fontWeight="600">
                  Verified
                </Text>
              </View>
            )}
          </XStack>

          {/* Stats Cards */}
          <XStack flexWrap="wrap" gap="$3">
            <StatCard
              title="Total Bookings"
              value={stats?.total_bookings || 0}
              icon={<Calendar size={24} color="#8B5CF6" />}
              flex={1}
            />
            <StatCard
              title="Pending"
              value={stats?.pending_confirmations || 0}
              icon={<AlertCircle size={24} color="#F59E0B" />}
              flex={1}
            />
          </XStack>

          <XStack flexWrap="wrap" gap="$3">
            <StatCard
              title="This Month"
              value={formatCurrency(stats?.earnings_this_month_cents || 0)}
              icon={<DollarSign size={24} color="#10B981" />}
              flex={1}
            />
            <StatCard
              title="Services"
              value={stats?.active_services || services.length}
              icon={<Package size={24} color="#3B82F6" />}
              flex={1}
            />
          </XStack>

          {/* Quick Actions */}
          <Card elevate bordered p="$4">
            <H3 color="$color" mb="$3">
              Quick Actions
            </H3>
            <XStack flexWrap="wrap" gap="$2">
              <Button
                flex={1}
                icon={<Package size={16} />}
                onPress={() => router.push('/provider/services/new')}
              >
                New Service
              </Button>
              <Button
                flex={1}
                icon={<Calendar size={16} />}
                onPress={() => setActiveTab('bookings')}
              >
                View Bookings
              </Button>
            </XStack>
          </Card>

          {/* Tab Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="horizontal"
            flexDirection="column"
          >
            <Tabs.List>
              <Tabs.Tab value="overview" flex={1}>
                <Text>Overview</Text>
              </Tabs.Tab>
              <Tabs.Tab value="bookings" flex={1}>
                <Text>Bookings</Text>
              </Tabs.Tab>
              <Tabs.Tab value="services" flex={1}>
                <Text>Services</Text>
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
    <Card elevate bordered p="$3" flex={flex} minWidth={140}>
      <XStack ai="center" space="$2" mb="$2">
        {icon}
        <Text fontSize="$2" color="$gray10">
          {title}
        </Text>
      </XStack>
      <Text fontSize="$7" fontWeight="700" color="$color">
        {value}
      </Text>
    </Card>
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
  getStatusColor 
}: OverviewTabProps) {
  const router = useRouter();

  return (
    <YStack space="$4">
      {/* Recent Bookings */}
      <Card elevate bordered>
        <YStack p="$4" space="$3">
          <XStack jc="space-between" ai="center">
            <H3 color="$color">Recent Bookings</H3>
            <Button size="$2" onPress={() => {}}>
              View All
            </Button>
          </XStack>
          
          {recentBookings.length === 0 ? (
            <Text color="$gray10" textAlign="center" py="$4">
              No bookings yet
            </Text>
          ) : (
            recentBookings.slice(0, 3).map((booking) => (
              <Card key={booking.id} bordered p="$3">
                <XStack jc="space-between" ai="center">
                  <YStack>
                    <Text fontWeight="600" color="$color">
                      Service ID: {booking.service_id.slice(0, 8)}...
                    </Text>
                    <Text fontSize="$2" color="$gray10">
                      {formatDate(booking.start_ts)}
                    </Text>
                  </YStack>
                  <XStack ai="center" space="$2">
                    {getStatusIcon(booking.status)}
                    <View bg={getStatusColor(booking.status)} px="$2" py="$1" br="$2">
                      <Text color="white" fontSize="$1" textTransform="capitalize">
                        {booking.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </XStack>
                </XStack>
              </Card>
            ))
          )}
        </YStack>
      </Card>

      {/* Active Services Preview */}
      <Card elevate bordered>
        <YStack p="$4" space="$3">
          <XStack jc="space-between" ai="center">
            <H3 color="$color">Active Services</H3>
            <Button size="$2" onPress={() => {}}>
              Manage
            </Button>
          </XStack>
          
          {services.length === 0 ? (
            <Text color="$gray10" textAlign="center" py="$4">
              No services yet. Create your first service!
            </Text>
          ) : (
            services.map((service) => (
              <Card 
                key={service.id} 
                bordered 
                p="$3"
                pressStyle={{ bg: '$backgroundHover' }}
                onPress={() => router.push(`/service/${service.id}`)}
              >
                <XStack jc="space-between" ai="center">
                  <YStack flex={1}>
                    <Text fontWeight="600" color="$color" numberOfLines={1}>
                      {service.title}
                    </Text>
                    <Text fontSize="$2" color="$gray10">
                      {service.duration_minutes} min • R$ {(service.price_cents / 100).toFixed(2)}
                    </Text>
                  </YStack>
                  <View
                    bg={service.is_published ? '$green10' : '$yellow10'}
                    px="$2"
                    py="$1"
                    br="$2"
                  >
                    <Text color="white" fontSize="$1">
                      {service.is_published ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </XStack>
              </Card>
            ))
          )}
        </YStack>
      </Card>
    </YStack>
  );
}

interface BookingsTabProps {
  bookings: Booking[];
  formatDate: (date: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

function BookingsTab({ bookings, formatDate, getStatusIcon, getStatusColor }: BookingsTabProps) {
  const router = useRouter();

  return (
    <YStack space="$3">
      {bookings.length === 0 ? (
        <Card elevate bordered p="$8">
          <YStack ai="center" space="$3">
            <Calendar size={64} color="gray" />
            <Text color="$gray10" textAlign="center">
              No bookings found
            </Text>
          </YStack>
        </Card>
      ) : (
        bookings.map((booking) => (
          <Card 
            key={booking.id} 
            elevate 
            bordered 
            p="$4"
            pressStyle={{ scale: 0.98 }}
            onPress={() => router.push(`/booking/${booking.id}`)}
          >
            <YStack space="$3">
              <XStack jc="space-between" ai="center">
                <Text fontWeight="600" color="$color">
                  Service ID: {booking.service_id.slice(0, 8)}...
                </Text>
                <XStack ai="center" space="$2">
                  {getStatusIcon(booking.status)}
                  <View bg={getStatusColor(booking.status)} px="$2" py="$1" br="$2">
                    <Text color="white" fontSize="$2" textTransform="capitalize">
                      {booking.status.replace('_', ' ')}
                    </Text>
                  </View>
                </XStack>
              </XStack>
              
              <Separator />
              
              <XStack space="$2" ai="center">
                <Clock size={16} color="gray" />
                <Text color="$gray10">{formatDate(booking.start_ts)}</Text>
              </XStack>
              
              <Text fontWeight="600" color="$primary">
                R$ {(booking.price_cents / 100).toFixed(2)}
              </Text>
            </YStack>
          </Card>
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
    <YStack space="$3">
      <Button 
        icon={<Package size={16} />}
        onPress={() => router.push('/provider/services/new')}
      >
        Create New Service
      </Button>

      {services.length === 0 ? (
        <Card elevate bordered p="$8">
          <YStack ai="center" space="$3">
            <Package size={64} color="gray" />
            <Text color="$gray10" textAlign="center">
              No services yet. Create your first service to start receiving bookings!
            </Text>
          </YStack>
        </Card>
      ) : (
        services.map((service) => (
          <Card 
            key={service.id} 
            elevate 
            bordered 
            p="$4"
            pressStyle={{ scale: 0.98 }}
            onPress={() => router.push(`/service/${service.id}`)}
          >
            <YStack space="$3">
              <XStack jc="space-between" ai="flex-start">
                <Text flex={1} fontSize="$5" fontWeight="600" color="$color">
                  {service.title}
                </Text>
                <View
                  bg={service.is_published ? '$green10' : '$yellow10'}
                  px="$2"
                  py="$1"
                  br="$2"
                >
                  <Text color="white" fontSize="$2">
                    {service.is_published ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </XStack>
              
              <Text color="$gray10" fontSize="$3" numberOfLines={2}>
                {service.description}
              </Text>
              
              <XStack jc="space-between" ai="center">
                <Text color="$primary" fontWeight="600">
                  R$ {(service.price_cents / 100).toFixed(2)}
                </Text>
                <XStack space="$1" ai="center">
                  <Clock size={14} color="gray" />
                  <Text fontSize="$2" color="$gray10">
                    {service.duration_minutes} min
                  </Text>
                </XStack>
              </XStack>
            </YStack>
          </Card>
        ))
      )}
    </YStack>
  );
}
