import { createAnimations } from '@tamagui/animations-react-native';
import { createTamagui, createTokens } from '@tamagui/core';
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
});

const headingFont = createInterFont();
const bodyFont = createInterFont();

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
    primary: '#FF2D55', // Nebula Red
    secondary: '#00F2FF', // Electric Cyan
    tertiary: '#39FF14', // Ethereal Green
    accent: '#8B5CF6', // Keeping a purple accent
    deepVoid: '#050208',
    white: '#FFFFFF',
    black: '#000000',
    gray1: '#fcfcfc',
    gray2: '#f8f8f8',
    gray3: '#f3f3f3',
    gray4: '#ededed',
    gray5: '#e8e8e8',
    gray6: '#e1e1e1',
    gray7: '#d9d9d9',
    gray8: '#cecece',
    gray9: '#bbbbbb',
    gray10: '#8d8d8d',
    gray11: '#646464',
    gray12: '#202020',
  },
});

const config = createTamagui({
  animations,
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes: {
    light: {
      background: '#FFFFFF',
      backgroundHover: '#F5F3FF',
      backgroundPress: '#EDE9FE',
      backgroundFocus: '#C4B5FD',
      color: '#1E1B4B',
      colorHover: '#374151',
      colorPress: '#1E1B4B',
      colorFocus: '#FF2D55',
      borderColor: '#E5E7EB',
      borderColorHover: '#00F2FF',
      borderColorPress: '#FF2D55',
      shadowColor: '#000000',
    },
    dark: {
      background: '#050208',
      backgroundHover: '#130B1C',
      backgroundPress: '#20142C',
      backgroundFocus: '#2D1D3F',
      color: '#F5F3FF',
      colorHover: '#EDE9FE',
      colorPress: '#00F2FF',
      colorFocus: '#FF2D55',
      borderColor: '#2D1D3F',
      borderColorHover: '#FF2D55',
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
