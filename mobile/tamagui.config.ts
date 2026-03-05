import { createTamagui } from '@tamagui/core';
import { createTokens } from '@tamagui/core';

const tokens = createTokens({
  color: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    tertiary: '#C4B5FD',
    accent: '#F59E0B',
    dark: '#1E1B4B',
    darker: '#0F0D1A',
    light: '#F5F3FF',
    lighter: '#EDE9FE',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#6B7280',
    grayLight: '#9CA3AF',
    grayDark: '#374151',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  font: {
    body: 'System',
    heading: 'System',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.02,
    normal: 0,
    wide: 0.02,
  },
  zIndex: {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
    4: 40,
    5: 50,
  },
});

const config = createTamagui({
  tokens,
  themes: {
    light: {
      background: '#FFFFFF',
      backgroundHover: '#F5F3FF',
      backgroundPress: '#EDE9FE',
      backgroundFocus: '#C4B5FD',
      color: '#1E1B4B',
      colorHover: '#374151',
      colorPress: '#1E1B4B',
      colorFocus: '#8B5CF6',
      borderColor: '#E5E7EB',
      borderColorHover: '#C4B5FD',
      borderColorPress: '#8B5CF6',
      shadowColor: '#000000',
    },
    dark: {
      background: '#0F0D1A',
      backgroundHover: '#1E1B4B',
      backgroundPress: '#312E81',
      backgroundFocus: '#4C1D95',
      color: '#F5F3FF',
      colorHover: '#EDE9FE',
      colorPress: '#C4B5FD',
      colorFocus: '#A78BFA',
      borderColor: '#374151',
      borderColorHover: '#4C1D95',
      borderColorPress: '#8B5CF6',
      shadowColor: '#000000',
    },
  },
});

export default config;
