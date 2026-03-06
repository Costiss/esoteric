import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const STAR_COUNT = Math.floor((width * height) / 8000);

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  anim: Animated.Value;
  twinkleSpeed: number;
  color: string;
}

function randomColor(): string {
  const r = Math.random();
  if (r < 0.7) return 'rgba(255,255,255,';
  if (r < 0.85) return 'rgba(180,245,255,'; // cyan-ish
  return 'rgba(255,200,220,'; // pink-ish
}

export function StardustBackground() {
  const starsRef = useRef<Star[]>([]);
  const animsRef = useRef<Animated.CompositeAnimation | null>(null);

  // Build stars once
  if (starsRef.current.length === 0) {
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 1.5,
      baseOpacity: 0.2 + Math.random() * 0.5,
      anim: new Animated.Value(Math.random()),
      twinkleSpeed: 1200 + Math.random() * 2800,
      color: randomColor(),
    }));
  }

  useEffect(() => {
    const loops = starsRef.current.map((s) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(s.anim, {
            toValue: 1,
            duration: s.twinkleSpeed,
            useNativeDriver: true,
          }),
          Animated.timing(s.anim, {
            toValue: 0.15,
            duration: s.twinkleSpeed,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    animsRef.current = Animated.parallel(loops);
    animsRef.current.start();
    return () => animsRef.current?.stop();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {starsRef.current.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: star.x,
            top: star.y,
            width: star.size * 2,
            height: star.size * 2,
            borderRadius: star.size,
            backgroundColor: `${star.color}${star.baseOpacity})`,
            opacity: star.anim,
          }}
        />
      ))}
    </View>
  );
}
