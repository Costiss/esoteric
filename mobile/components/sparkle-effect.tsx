import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  anim: Animated.Value;
  rotate: Animated.Value;
}

interface SparkleEffectProps {
  trigger?: boolean;
  count?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#FF2D55', '#00F2FF', '#39FF14', '#ffffff'];

export function SparkleEffect({
  trigger,
  count = 12,
  colors = DEFAULT_COLORS,
}: SparkleEffectProps) {
  const sparklesRef = useRef<SparkleParticle[]>([]);
  const visibleRef = useRef(false);
  const forceUpdate = useRef<(() => void) | null>(null);

  // Re-render hack
  const renderCount = useRef(new Animated.Value(0));

  useEffect(() => {
    if (!trigger) return;

    sparklesRef.current = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      anim: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }));
    visibleRef.current = true;
    renderCount.current.setValue(1);

    for (const s of sparklesRef.current) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(s.anim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(s.anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(s.rotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }

    const timer = setTimeout(() => {
      sparklesRef.current = [];
      visibleRef.current = false;
      renderCount.current.setValue(0);
    }, 1000);
    return () => clearTimeout(timer);
  }, [trigger, count, colors]);

  if (!visibleRef.current) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {sparklesRef.current.map((s) => {
        const rotation = s.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        });
        const scale = s.anim;
        return (
          <Animated.View
            key={s.id}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.anim,
              transform: [{ scale }, { rotate: rotation }],
            }}
          >
            {/* 4-pointed star shape using two rotated rects */}
            <View
              style={{
                position: 'absolute',
                width: s.size,
                height: s.size / 3,
                backgroundColor: s.color,
                top: s.size / 3,
                borderRadius: 2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: s.size / 3,
                height: s.size,
                backgroundColor: s.color,
                left: s.size / 3,
                borderRadius: 2,
              }}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}
