import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { View, XStack, YStack } from 'tamagui';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  flex?: number;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  flex,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      width={width}
      height={height}
      borderRadius={borderRadius}
      backgroundColor="rgba(139, 92, 246, 0.1)"
      overflow="hidden"
      flex={flex}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}

export function SkeletonCard() {
  return (
    <YStack
      space="$3"
      p="$4"
      backgroundColor="rgba(139, 92, 246, 0.05)"
      borderRadius="$4"
    >
      <Skeleton width="70%" height={24} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="90%" height={16} />
      <XStack space="$2" mt="$2">
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </XStack>
    </YStack>
  );
}

export function SkeletonStats() {
  return (
    <XStack space="$3" flexWrap="wrap">
      <YStack
        flex={1}
        minWidth={140}
        space="$2"
        p="$3"
        backgroundColor="rgba(139, 92, 246, 0.05)"
        borderRadius="$4"
      >
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={32} />
      </YStack>
      <YStack
        flex={1}
        minWidth={140}
        space="$2"
        p="$3"
        backgroundColor="rgba(139, 92, 246, 0.05)"
        borderRadius="$4"
      >
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={32} />
      </YStack>
    </XStack>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <YStack space="$3">
      {Array.from({ length: count }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton placeholder component
        <SkeletonCard key={`skeleton-item-${index}`} />
      ))}
    </YStack>
  );
}
