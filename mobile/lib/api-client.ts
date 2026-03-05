import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = 
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  full_name: string | null;
  phone: string | null;
}

interface RegisterResponse {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  full_name: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  tags: string[];
  metadata: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Provider {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  working_hours: Record<string, unknown>;
  availability_settings: Record<string, unknown>;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: string;
  service_id: string;
  customer_id: string;
  provider_id: string;
  start_ts: string;
  end_ts: string;
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price_cents: number;
  currency: string;
  client_notes: string | null;
  provider_notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export const apiClient = {
  // Auth
  login: (email: string, password: string): Promise<LoginResponse> =>
    apiRequest<LoginResponse>('/api/v1/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, fullName: string): Promise<RegisterResponse> =>
    apiRequest<RegisterResponse>('/api/v1/users/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    }),

  logout: (refreshToken: string): Promise<void> =>
    apiRequest<void>('/oauth/revoke', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  refreshToken: (refreshToken: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> =>
    apiRequest('/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    }),

  // User
  getUser: (userId: string): Promise<User> =>
    apiRequest<User>(`/api/v1/users/${userId}`),

  updateUser: (userId: string, data: Partial<User>): Promise<User> =>
    apiRequest<User>(`/api/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Services
  listServices: (params?: { page?: number; per_page?: number; published_only?: boolean }): Promise<{ services: Service[]; total: number }> =>
    apiRequest(`/api/v1/services?${new URLSearchParams(params as Record<string, string>).toString()}`),

  searchServices: (params: {
    tag?: string;
    min_price?: number;
    max_price?: number;
    provider_verified_only?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<{ services: Service[]; total: number }> =>
    apiRequest(`/api/v1/services/search?${new URLSearchParams(params as Record<string, string>).toString()}`),

  getService: (serviceId: string): Promise<Service> =>
    apiRequest<Service>(`/api/v1/services/${serviceId}`),

  // Providers
  listProviders: (params?: { page?: number; per_page?: number; verified_only?: boolean }): Promise<{ providers: Provider[]; total: number }> =>
    apiRequest(`/api/v1/providers?${new URLSearchParams(params as Record<string, string>).toString()}`),

  getProvider: (providerId: string): Promise<Provider> =>
    apiRequest<Provider>(`/api/v1/providers/${providerId}`),

  getProviderServices: (providerId: string): Promise<Service[]> =>
    apiRequest<Service[]>(`/api/v1/providers/${providerId}/services`),

  // Bookings
  createBooking: (data: {
    service_id: string;
    start_ts: string;
    client_notes?: string;
  }): Promise<Booking> =>
    apiRequest<Booking>('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBooking: (bookingId: string): Promise<Booking> =>
    apiRequest<Booking>(`/api/v1/bookings/${bookingId}`),

  listBookings: (params?: { page?: number; per_page?: number; status?: string }): Promise<{ bookings: Booking[]; total: number }> =>
    apiRequest(`/api/v1/bookings?${new URLSearchParams(params as Record<string, string>).toString()}`),

  confirmBooking: (bookingId: string): Promise<Booking> =>
    apiRequest<Booking>(`/api/v1/bookings/${bookingId}/confirm`, {
      method: 'POST',
    }),

  cancelBooking: (bookingId: string, reason?: string): Promise<Booking> =>
    apiRequest<Booking>(`/api/v1/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellation_reason: reason }),
    }),

  getCustomerBookings: (customerId: string, params?: { page?: number; per_page?: number }): Promise<{ bookings: Booking[]; total: number }> =>
    apiRequest(`/api/v1/customers/${customerId}/bookings?${new URLSearchParams(params as Record<string, string>).toString()}`),

  getProviderBookings: (providerId: string, params?: { page?: number; per_page?: number }): Promise<{ bookings: Booking[]; total: number }> =>
    apiRequest(`/api/v1/providers/${providerId}/bookings?${new URLSearchParams(params as Record<string, string>).toString()}`),

  checkAvailability: (providerId: string, startTs: string, endTs: string): Promise<{ available: boolean }> =>
    apiRequest(`/api/v1/providers/${providerId}/availability?start_ts=${startTs}&end_ts=${endTs}`),
};

export type { User, Service, Provider, Booking, LoginResponse, RegisterResponse };
