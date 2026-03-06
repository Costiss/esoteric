// Design system constants matching the UI reference "Celestia" dark theme
export const C = {
  // Background
  bg: '#050208',
  bgHover: '#130B1C',
  bgPress: '#20142C',

  // Foreground / text
  fg: '#f0e6ff',
  fgMuted: 'rgba(240,230,255,0.6)',
  fgDim: 'rgba(240,230,255,0.4)',

  // Brand colours
  primary: '#FF2D55', // Nebula red-pink
  primaryFg: '#ffffff',
  accent: '#00F2FF', // Electric cyan
  accentFg: '#050208',
  ethereal: '#39FF14', // Neon green
  etherealFg: '#050208',
  deepPurple: '#8A2BE2',
  gold: '#FFD700',

  // Glass surfaces - matching reference exactly
  glassBg: 'rgba(255,255,255,0.03)',
  glassBgHover: 'rgba(255,255,255,0.05)',
  glassBgStrong: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderHover: 'rgba(255,255,255,0.15)',
  glassBorderStrong: 'rgba(255,255,255,0.12)',

  // Muted / input
  muted: 'rgba(255,255,255,0.05)',
  inputBg: 'rgba(255,255,255,0.05)',

  // Element colours for zodiac/cosmic energy
  fire: {
    bg: 'rgba(255,45,85,0.1)',
    border: 'rgba(255,45,85,0.3)',
    text: '#FF2D55',
    glow: 'rgba(255,45,85,0.2)',
  },
  earth: {
    bg: 'rgba(57,255,20,0.1)',
    border: 'rgba(57,255,20,0.3)',
    text: '#39FF14',
    glow: 'rgba(57,255,20,0.2)',
  },
  air: {
    bg: 'rgba(0,242,255,0.1)',
    border: 'rgba(0,242,255,0.3)',
    text: '#00F2FF',
    glow: 'rgba(0,242,255,0.2)',
  },
  water: {
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.3)',
    text: '#60a5fa',
    glow: 'rgba(59,130,246,0.2)',
  },
} as const;

export type ElementType = 'fire' | 'earth' | 'air' | 'water';
export type AccentColor = 'primary' | 'accent' | 'ethereal';

export const ACCENT_COLORS: Record<
  AccentColor,
  { bg: string; border: string; text: string; glow: string }
> = {
  primary: {
    bg: 'rgba(255,45,85,0.1)',
    border: 'rgba(255,45,85,0.3)',
    text: '#FF2D55',
    glow: 'rgba(255,45,85,0.15)',
  },
  accent: {
    bg: 'rgba(0,242,255,0.1)',
    border: 'rgba(0,242,255,0.3)',
    text: '#00F2FF',
    glow: 'rgba(0,242,255,0.15)',
  },
  ethereal: {
    bg: 'rgba(57,255,20,0.1)',
    border: 'rgba(57,255,20,0.3)',
    text: '#39FF14',
    glow: 'rgba(57,255,20,0.15)',
  },
};
