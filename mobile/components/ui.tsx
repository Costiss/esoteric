import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from './design-system';
import { SparkleEffect } from './sparkle-effect';

// --- CosmicHeader ---

interface CosmicHeaderProps {
  onNotificationsPress?: () => void;
  onSettingsPress?: () => void;
}

export function CosmicHeader({
  onNotificationsPress,
  onSettingsPress,
}: CosmicHeaderProps) {
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous logo rotation (20s per revolution)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim, slideAnim, opacityAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: 16,
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      {/* Brand */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Animated.View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: rotation }],
          }}
        >
          <Text style={{ fontSize: 20 }}>✦</Text>
        </Animated.View>
        <View>
          <Text
            style={{
              fontFamily: 'CormorantGaramond_500Medium',
              fontSize: 20,
              color: C.fg,
            }}
          >
            Celestia
          </Text>
          <Text style={{ fontSize: 11, color: C.fgMuted }}>
            Discover your path
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onNotificationsPress}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, color: C.fgMuted }}>🔔</Text>
          {/* Red notification dot */}
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: C.primary,
            }}
          />
        </Pressable>
        <Pressable
          onPress={onSettingsPress}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, color: C.fgMuted }}>⚙</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// --- DailyInsight ---

type Mood = 'positive' | 'neutral' | 'challenging';

interface DailyInsightProps {
  title: string;
  message: string;
  mood: Mood;
}

const MOOD_COLORS: Record<Mood, [string, string]> = {
  positive: ['rgba(57,255,20,0.2)', 'rgba(0,242,255,0.1)'],
  neutral: ['rgba(0,242,255,0.2)', 'rgba(255,45,85,0.1)'],
  challenging: ['rgba(255,45,85,0.2)', 'rgba(138,43,226,0.1)'],
};

export function DailyInsight({ title, message, mood }: DailyInsightProps) {
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [sparkleAnim]);

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '15deg', '-15deg', '0deg', '0deg'],
  });

  const [fromColor, toColor] = MOOD_COLORS[mood];

  return (
    <View
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.glassBorder,
      }}
    >
      {/* Background gradient simulation with layered views */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: fromColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: C.glassBg,
        }}
      />

      <View style={{ padding: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Animated.Text
            style={{
              fontSize: 18,
              transform: [{ rotate: sparkleRotate }],
            }}
          >
            ✦
          </Animated.Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              color: C.accent,
            }}
          >
            {title}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: 'CormorantGaramond_400Regular',
            fontSize: 18,
            lineHeight: 28,
            color: C.fg,
            marginBottom: 12,
          }}
        >
          "{message}"
        </Text>

        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text style={{ fontSize: 13, color: C.fgMuted }}>
            Read full horoscope
          </Text>
          <Text style={{ fontSize: 13, color: C.fgMuted }}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

// --- MysticalButton ---

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface MysticalButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  sparkleOnClick?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

const SIZE_STYLES: Record<
  ButtonSize,
  {
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
    borderRadius: number;
  }
> = {
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    borderRadius: 8,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    fontSize: 16,
    borderRadius: 12,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    fontSize: 18,
    borderRadius: 16,
  },
};

export function MysticalButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  sparkleOnClick = false,
  onPress,
  disabled = false,
}: MysticalButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sparkleRef = useRef(false);
  const [showSparkle, setShowSparkle] = React.useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, 100);
  };

  const handlePress = () => {
    if (sparkleOnClick) {
      setShowSparkle((prev) => !prev);
      setTimeout(() => setShowSparkle(false), 50);
    }
    onPress?.();
  };

  const sizeStyle = SIZE_STYLES[size];

  let bgColor = C.primary;
  let textColor = C.primaryFg;
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (variant === 'secondary') {
    bgColor = C.glassBg;
    textColor = C.fg;
    borderColor = C.glassBorder;
    borderWidth = 1;
  } else if (variant === 'ghost') {
    bgColor = 'transparent';
    textColor = C.fg;
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }}
    >
      <Animated.View
        style={{
          backgroundColor: bgColor,
          borderRadius: sizeStyle.borderRadius,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth,
          borderColor,
          overflow: 'hidden',
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {sparkleOnClick && <SparkleEffect trigger={showSparkle} />}
        {typeof children === 'string' ? (
          <Text
            style={{
              color: textColor,
              fontSize: sizeStyle.fontSize,
              fontWeight: '500',
            }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

// Need React import for useState in MysticalButton
import React from 'react';
