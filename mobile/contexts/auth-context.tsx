import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiClient, type ProviderProfile } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthContextType {
  user: User | null;
  providerProfile: ProviderProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProvider: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  loadProviderProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const EXPIRES_AT_KEY = 'expires_at';
const USER_KEY = 'user_data';
const PROVIDER_KEY = 'provider_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const load = async () => {
      await loadStoredAuth();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    
    if (!isLoading) {
      if (!user && !inAuthGroup && !inOnboarding) {
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, segments, isLoading]);

  const loadStoredAuth = async () => {
    try {
      const [accessToken, refreshToken, expiresAtStr, userData, providerData] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(EXPIRES_AT_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(PROVIDER_KEY),
      ]);

      if (accessToken && refreshToken && expiresAtStr) {
        const expiresAt = parseInt(expiresAtStr, 10);
        
        if (Date.now() >= expiresAt) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            await clearAuth();
          }
        } else {
          if (userData) {
            setUser(JSON.parse(userData));
          }
          if (providerData) {
            setProviderProfile(JSON.parse(providerData));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProviderProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await apiClient.getProviderByUserId(user.id);
      setProviderProfile(profile);
      await SecureStore.setItemAsync(PROVIDER_KEY, JSON.stringify(profile));
    } catch (_error) {
      // User is not a provider, that's ok
      setProviderProfile(null);
      await SecureStore.deleteItemAsync(PROVIDER_KEY);
    }
  };

  const saveAuth = async (tokens: AuthTokens, userData: User) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
        SecureStore.setItemAsync(EXPIRES_AT_KEY, tokens.expires_at.toString()),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData)),
      ]);
      setUser(userData);
    } catch (error) {
      console.error('Failed to save auth:', error);
      throw new Error('Failed to save authentication data');
    }
  };

  const clearAuth = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
        SecureStore.deleteItemAsync(PROVIDER_KEY),
      ]);
      setUser(null);
      setProviderProfile(null);
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      const tokens: AuthTokens = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_at: Date.now() + response.expires_in * 1000,
      };
      
      const userData: User = {
        id: response.user_id,
        email,
        full_name: response.full_name,
        phone: response.phone,
      };

      await saveAuth(tokens, userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      const response = await apiClient.register(email, password, fullName);
      const tokens: AuthTokens = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_at: Date.now() + response.expires_in * 1000,
      };
      
      const userData: User = {
        id: response.user_id,
        email,
        full_name: fullName,
        phone: null,
      };

      await saveAuth(tokens, userData);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await clearAuth();
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return false;
      }

      const response = await apiClient.refreshToken(refreshToken);
      
      if (response && response.access_token) {
        const tokens: AuthTokens = {
          access_token: response.access_token,
          refresh_token: response.refresh_token || refreshToken,
          expires_at: Date.now() + response.expires_in * 1000,
        };

        await Promise.all([
          SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token),
          SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
          SecureStore.setItemAsync(EXPIRES_AT_KEY, tokens.expires_at.toString()),
        ]);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        providerProfile,
        isLoading,
        isAuthenticated: !!user,
        isProvider: !!providerProfile,
        login,
        register,
        logout,
        refreshAccessToken,
        loadProviderProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
