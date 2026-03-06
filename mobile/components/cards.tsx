import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text, View } from 'tamagui';
import { ACCENT_COLORS, type AccentColor, C } from './design-system';

interface GlassCardProps {
  children: ReactNode;
  hover?: boolean;
  onPress?: () => void;
  style?: object;
}

export function GlassCard({
  children,
  hover = true,
  onPress,
  style,
}: GlassCardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    if (!hover) return;
    scale.value = withSpring(0.98, { damping: 25, stiffness: 400 });
    translateY.value = withSpring(-2, { damping: 25, stiffness: 400 });
  };

  const handlePressOut = () => {
    if (!hover) return;
    scale.value = withSpring(1, { damping: 25, stiffness: 400 });
    translateY.value = withSpring(0, { damping: 25, stiffness: 400 });
  };

  const containerStyle = [
    {
      backgroundColor: C.glassBg,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: C.glassBorder,
      // Add subtle shadow to simulate blur depth
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    style,
  ];

  if (!hover) {
    return (
      <View style={{ position: 'relative' }}>
        {/* Blur simulation layer */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderRadius: 24,
          }}
        />
        <View style={containerStyle}>{children}</View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[...containerStyle, animStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// --- TarotCard ---

interface TarotCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  description: string;
  price?: string;
  accentColor: AccentColor;
  onPress?: () => void;
}

export function TarotCard({
  title,
  subtitle,
  icon,
  description,
  price,
  accentColor,
  onPress,
}: TarotCardProps) {
  const ac = ACCENT_COLORS[accentColor];
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 25, stiffness: 400 });
        translateY.value = withSpring(-4, { damping: 25, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.02, { damping: 25, stiffness: 400 });
        translateY.value = withSpring(0, { damping: 25, stiffness: 400 });
        setTimeout(() => {
          scale.value = withSpring(1, { damping: 25, stiffness: 400 });
        }, 150);
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: C.glassBg,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: C.glassBorder,
            // Add subtle shadow to simulate blur depth
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          },
          animStyle,
        ]}
      >
        {/* Corner accents */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            width: 32,
            height: 32,
            borderBottomWidth: 1,
            borderLeftWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        />

        {/* Icon */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: ac.bg,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          {icon}
        </View>

        {subtitle && (
          <Text
            style={{
              fontSize: 10,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              color: C.fgMuted,
              marginBottom: 4,
            }}
          >
            {subtitle}
          </Text>
        )}
        <Text
          style={{
            fontFamily: 'CormorantGaramond_500Medium',
            fontSize: 20,
            color: C.fg,
            marginBottom: 8,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 22,
            color: C.fgMuted,
            marginBottom: price ? 16 : 0,
          }}
        >
          {description}
        </Text>

        {price && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.05)',
              paddingTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 12, color: C.fgMuted }}>Starting at</Text>
            <Text
              style={{
                fontFamily: 'CormorantGaramond_500Medium',
                fontSize: 18,
                color: ac.text,
              }}
            >
              {price}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// --- ProviderCard ---

interface ProviderCardProps {
  name: string;
  specialty: string;
  avatar: string;
  rating: number;
  reviews: number;
  isVerified?: boolean;
  available?: boolean;
  onPress?: () => void;
}

export function ProviderCard({
  name,
  specialty,
  avatar,
  rating,
  reviews,
  isVerified,
  available,
  onPress,
}: ProviderCardProps) {
  const translateX = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        translateX.value = withSpring(4, { damping: 25, stiffness: 400 });
      }}
      onPressOut={() => {
        translateX.value = withSpring(0, { damping: 25, stiffness: 400 });
      }}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            borderRadius: 24,
            backgroundColor: C.glassBg,
            borderWidth: 1,
            borderColor: C.glassBorder,
            // Add subtle shadow to simulate blur depth
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          },
          animStyle,
        ]}
      >
        {/* Avatar */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: 'rgba(255,45,85,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: C.bg,
            }}
          >
            <Text style={{ fontSize: 24 }}>{avatar}</Text>
          </View>
          {available && (
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: C.ethereal,
                borderWidth: 2,
                borderColor: C.bg,
              }}
            />
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                fontWeight: '500',
                color: C.fg,
                fontSize: 15,
              }}
            >
              {name}
            </Text>
            {isVerified && (
              <Text style={{ color: C.accent, fontSize: 12 }}>✓</Text>
            )}
          </View>
          <Text style={{ fontSize: 13, color: C.fgMuted, marginTop: 2 }}>
            {specialty}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
            }}
          >
            <Text style={{ color: C.primary, fontSize: 12 }}>★</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: C.fg }}>
              {rating}
            </Text>
            <Text style={{ fontSize: 12, color: C.fgMuted }}>
              ({reviews} reviews)
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <Text style={{ color: C.fgMuted, fontSize: 18 }}>›</Text>
      </Animated.View>
    </Pressable>
  );
}

// --- ZodiacBadge ---

type ElementType = 'fire' | 'earth' | 'air' | 'water';

interface ZodiacBadgeProps {
  sign: string;
  symbol: string;
  element: ElementType;
  isActive?: boolean;
  onPress?: () => void;
}

export function ZodiacBadge({
  sign,
  symbol,
  element,
  isActive,
  onPress,
}: ZodiacBadgeProps) {
  const el = C[element];
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 25, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.05, { damping: 25, stiffness: 400 });
        translateY.value = withSpring(-2, { damping: 25, stiffness: 400 });
        setTimeout(() => {
          scale.value = withSpring(1, { damping: 25, stiffness: 400 });
          translateY.value = withSpring(0, { damping: 25, stiffness: 400 });
        }, 200);
      }}
    >
      <Animated.View
        style={[
          {
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 1,
            backgroundColor: isActive ? el.bg : 'rgba(255,255,255,0.02)',
            borderColor: isActive ? el.border : C.glassBorder,
          },
          isActive && {
            shadowColor: el.glow,
            shadowRadius: 12,
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: 0 },
          },
          animStyle,
        ]}
      >
        <Text style={{ fontSize: 24, color: el.text }}>{symbol}</Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '500',
            color: isActive ? C.fg : C.fgMuted,
          }}
        >
          {sign}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
