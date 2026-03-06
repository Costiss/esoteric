import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from './design-system';

interface NavItem {
  key: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'index', label: 'Home', icon: '⌂' },
  { key: 'explore', label: 'Explore', icon: '◉' },
  { key: 'services', label: 'Services', icon: '✦' },
  { key: 'bookings', label: 'Book', icon: '◫' },
  { key: 'profile', label: 'Profile', icon: '◯' },
];

interface FloatingNavProps {
  activeTab: string;
  onTabPress: (key: string) => void;
}

export function FloatingNav({ activeTab, onTabPress }: FloatingNavProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
        delay: 500,
      } as Parameters<typeof Animated.spring>[1]),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 24,
        left: 0,
        right: 0,
        alignItems: 'center',
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.glassBgStrong,
          borderRadius: 9999,
          paddingVertical: 8,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: C.glassBorderStrong,
          gap: 4,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <NavTabItem
              key={item.key}
              item={item}
              isActive={isActive}
              onPress={() => onTabPress(item.key)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

interface NavTabItemProps {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
}

function NavTabItem({ item, isActive, onPress }: NavTabItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 44,
          borderRadius: 9999,
          backgroundColor: isActive ? 'rgba(255,45,85,0.1)' : 'transparent',
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: isActive ? C.primary : C.fgMuted,
          }}
        >
          {item.icon}
        </Text>
        {isActive && (
          <Text
            style={{
              fontSize: 9,
              fontWeight: '500',
              color: C.primary,
              marginTop: 1,
            }}
          >
            {item.label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
