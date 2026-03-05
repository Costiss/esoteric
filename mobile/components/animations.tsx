import { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  duration: number;
  delay: number;
}

interface StardustBackgroundProps {
  starCount?: number;
  color?: string;
}

export function StardustBackground({ starCount = 50, color = '#8B5CF6' }: StardustBackgroundProps) {
  const stars = useMemo(() => {
    const items: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      items.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
        size: Math.random() * 3 + 1,
        opacity: new Animated.Value(0),
        duration: Math.random() * 3000 + 2000,
        delay: Math.random() * 2000,
      });
    }
    return items;
  }, [starCount]);

  useEffect(() => {
    const animations = stars.map((star) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.5 + 0.3,
            duration: star.duration / 2,
            useNativeDriver: true,
            delay: star.delay,
          }),
          Animated.timing(star.opacity, {
            toValue: 0,
            duration: star.duration / 2,
            useNativeDriver: true,
          }),
        ])
      )
    );

    for (const anim of animations) {
      anim.start();
    }

    return () => {
      for (const anim of animations) {
        anim.stop();
      }
    };
  }, [stars]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star) => (
        <Animated.View
          key={`star-${star.id}`}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              backgroundColor: color,
              opacity: star.opacity,
              borderRadius: star.size / 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

interface SparkleProps {
  size?: number;
  color?: string;
}

export function Sparkle({ size = 20, color = '#F59E0B' }: SparkleProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [scale, opacity, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ scale }, { rotate: spin }],
        opacity,
      }}
    >
      <View
        style={{
          width: size,
          height: size / 4,
          backgroundColor: color,
          position: 'absolute',
          top: (size * 3) / 8,
          borderRadius: size / 8,
        }}
      />
      <View
        style={{
          width: size / 4,
          height: size,
          backgroundColor: color,
          position: 'absolute',
          left: (size * 3) / 8,
          borderRadius: size / 8,
        }}
      />
    </Animated.View>
  );
}

interface FloatingElementProps {
  children: React.ReactNode;
  duration?: number;
  distance?: number;
}

export function FloatingElement({ 
  children, 
  duration = 3000, 
  distance = 10 
}: FloatingElementProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -distance,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [translateY, duration, distance]);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
});
