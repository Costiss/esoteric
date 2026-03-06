import { createAnimations } from '@tamagui/animations-react-native';
import { createFont, createTamagui, createTokens } from '@tamagui/core';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';

const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  // Matches Framer Motion spring(stiffness:400, damping:25) used in reference
  snappy: {
    type: 'spring',
    damping: 25,
    stiffness: 400,
  },
  // Nav shared-layout transition spring(stiffness:300, damping:25)
  navIndicator: {
    type: 'spring',
    damping: 25,
    stiffness: 300,
  },
});

// Inter for body/UI text
const bodyFont = createInterFont();

// Cormorant Garamond for headings/display — loaded via useFonts in _layout
const headingFont = createFont({
  family: 'CormorantGaramond_400Regular',
  size: {
    1: 12,
    2: 14,
    3: 15,
    4: 16,
    5: 18,
    6: 20,
    7: 22,
    8: 24,
    9: 28,
    10: 34,
    true: 16,
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 22,
    4: 24,
    5: 26,
    6: 28,
    7: 30,
    8: 32,
    9: 36,
    10: 42,
    true: 24,
  },
  weight: {
    1: '300',
    4: '400',
    6: '500',
    7: '600',
    9: '700',
    true: '400',
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    300: { normal: 'CormorantGaramond_300Light' },
    400: { normal: 'CormorantGaramond_400Regular' },
    500: { normal: 'CormorantGaramond_500Medium' },
    600: { normal: 'CormorantGaramond_600SemiBold' },
    700: { normal: 'CormorantGaramond_700Bold' },
  },
});

const tokens = createTokens({
  size: {
    '0': 0,
    '1': 14,
    '2': 18,
    '3': 22,
    '4': 28,
    '5': 34,
    '6': 42,
    '7': 50,
    '8': 58,
    '9': 66,
    '10': 74,
    true: 44,
  },
  space: {
    '0': 0,
    '0.5': 2,
    '1': 4,
    '1.5': 6,
    '2': 8,
    '2.5': 10,
    '3': 12,
    '3.5': 14,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 28,
    '8': 32,
    '9': 36,
    '10': 40,
    true: 16,
  },
  radius: {
    '0': 0,
    '1': 4,
    '2': 8,
    '3': 12,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 9999,
    true: 8,
  },
  zIndex: {
    '0': 0,
    '1': 10,
    '2': 20,
    '3': 30,
    '4': 40,
    '5': 50,
  },
  color: {
    // Brand / accent colors
    primary: '#FF2D55',
    primaryForeground: '#ffffff',
    accent: '#00F2FF',
    accentForeground: '#050208',
    ethereal: '#39FF14',
    etherealForeground: '#050208',
    deepPurple: '#8A2BE2',
    gold: '#FFD700',
    // Named aliases
    nebulaPrimary: '#FF2D55',
    electricCyan: '#00F2FF',
    etherealGreen: '#39FF14',
    // Base palette
    deepVoid: '#050208',
    foreground: '#f0e6ff',
    mutedForeground: 'rgba(240,230,255,0.6)',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBgHover: 'rgba(255,255,255,0.05)',
    glassBorder: 'rgba(255,255,255,0.08)',
    glassBorderHover: 'rgba(255,255,255,0.15)',
    glassBorderStrong: 'rgba(255,255,255,0.12)',
    glassStrongBg: 'rgba(255,255,255,0.06)',
    muted: 'rgba(255,255,255,0.05)',
    popoverBg: 'rgba(15,10,25,0.95)',
    sidebarBg: 'rgba(10,5,20,0.9)',
    white: '#FFFFFF',
    black: '#000000',
    // Required gray scale tokens for Tamagui internals
    gray1: '#fcfcfc',
    gray2: '#f8f8f8',
    gray3: '#f3f3f3',
    gray4: '#ededed',
    gray5: '#e8e8e8',
    gray6: '#e1e1e1',
    gray7: '#d9d9d9',
    gray8: '#cecece',
    gray9: '#bbbbbb',
    gray10: 'rgba(240,230,255,0.6)',
    gray11: 'rgba(240,230,255,0.4)',
    gray12: '#202020',
  },
});

const config = createTamagui({
  animations,
  defaultTheme: 'dark',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes: {
    dark: {
      background: '#050208',
      backgroundHover: '#130B1C',
      backgroundPress: '#20142C',
      backgroundFocus: '#2D1D3F',
      color: '#f0e6ff',
      colorHover: '#EDE9FE',
      colorPress: '#00F2FF',
      colorFocus: '#FF2D55',
      borderColor: 'rgba(255,255,255,0.08)',
      borderColorHover: 'rgba(255,255,255,0.15)',
      borderColorPress: '#00F2FF',
      shadowColor: '#000000',
    },
    // Light theme mirrors dark — app is permanently dark
    light: {
      background: '#050208',
      backgroundHover: '#130B1C',
      backgroundPress: '#20142C',
      backgroundFocus: '#2D1D3F',
      color: '#f0e6ff',
      colorHover: '#EDE9FE',
      colorPress: '#00F2FF',
      colorFocus: '#FF2D55',
      borderColor: 'rgba(255,255,255,0.08)',
      borderColorHover: 'rgba(255,255,255,0.15)',
      borderColorPress: '#00F2FF',
      shadowColor: '#000000',
    },
  },
  tokens,
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
