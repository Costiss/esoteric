import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

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

function generateStars(width: number, height: number): Star[] {
  const starCount = Math.floor((width * height) / 8000);
  return Array.from({ length: Math.max(starCount, 50) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 0.5 + Math.random() * 1.5,
    baseOpacity: 0.2 + Math.random() * 0.5,
    anim: new Animated.Value(Math.random()),
    twinkleSpeed: 1200 + Math.random() * 2800,
    color: randomColor(),
  }));
}

export function StardustBackground() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [stars, setStars] = useState<Star[]>([]);
  const animsRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && stars.length === 0) {
      const newStars = generateStars(dimensions.width, dimensions.height);
      setStars(newStars);
    }
  }, [dimensions, stars.length]);

  useEffect(() => {
    if (stars.length === 0) return;

    const loops = stars.map((s) =>
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
  }, [stars]);

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: '#050208' }]}
      pointerEvents="none"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
      }}
    >
      {stars.map((star, i) => (
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
