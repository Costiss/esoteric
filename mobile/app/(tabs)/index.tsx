import {
  Droplets,
  Eye,
  Flame,
  Heart,
  Moon,
  Mountain,
  Star,
  Wind,
} from '@tamagui/lucide-icons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import {
  GlassCard,
  ProviderCard,
  TarotCard,
  ZodiacBadge,
} from '@/components/cards';
import { type AccentColor, C } from '@/components/design-system';
import { SparkleEffect } from '@/components/sparkle-effect';
import { StardustBackground } from '@/components/stardust-background';
import { CosmicHeader, DailyInsight, MysticalButton } from '@/components/ui';

const services = [
  {
    title: 'Tarot Reading',
    subtitle: 'Divination',
    icon: <Eye size={28} color={C.fg} />,
    description:
      'Unlock the mysteries of your past, present, and future through ancient card wisdom.',
    price: '$29',
    accentColor: 'primary' as AccentColor,
  },
  {
    title: 'Birth Chart',
    subtitle: 'Astrology',
    icon: <Star size={28} color={C.fg} />,
    description:
      'Discover your cosmic blueprint with a personalized natal chart analysis.',
    price: '$49',
    accentColor: 'accent' as AccentColor,
  },
  {
    title: 'Energy Healing',
    subtitle: 'Wellness',
    icon: <Heart size={28} color={C.fg} />,
    description:
      'Restore balance and harmony through chakra alignment and reiki sessions.',
    price: '$65',
    accentColor: 'ethereal' as AccentColor,
  },
];

const providers = [
  {
    name: 'Luna Moonstone',
    specialty: 'Tarot & Oracle Cards',
    avatar: '🌙',
    rating: 4.9,
    reviews: 342,
    isVerified: true,
    available: true,
  },
  {
    name: 'Orion Starweaver',
    specialty: 'Astrology & Birth Charts',
    avatar: '⭐',
    rating: 4.8,
    reviews: 256,
    isVerified: true,
    available: true,
  },
  {
    name: 'Crystal Ravenwood',
    specialty: 'Energy Healing',
    avatar: '💎',
    rating: 4.7,
    reviews: 189,
    isVerified: false,
    available: false,
  },
];

const zodiacSigns = [
  { sign: 'Aries', symbol: '♈', element: 'fire' as const },
  { sign: 'Taurus', symbol: '♉', element: 'earth' as const },
  { sign: 'Gemini', symbol: '♊', element: 'air' as const },
  { sign: 'Cancer', symbol: '♋', element: 'water' as const },
  { sign: 'Leo', symbol: '♌', element: 'fire' as const },
  { sign: 'Virgo', symbol: '♍', element: 'earth' as const },
];

const moonPhases = [
  { name: 'New Moon', icon: '🌑', active: false },
  { name: 'Waxing', icon: '🌒', active: false },
  { name: 'First Quarter', icon: '🌓', active: true },
  { name: 'Waxing Gibbous', icon: '🌔', active: false },
  { name: 'Full Moon', icon: '🌕', active: false },
];

export default function HomeScreen() {
  const [activeZodiac, setActiveZodiac] = useState('Leo');
  const [showSparkle, setShowSparkle] = useState(false);
  const router = useRouter();

  const handleBookReading = () => {
    setShowSparkle(true);
    setTimeout(() => setShowSparkle(false), 50);
    router.push('/services' as Href);
  };

  return (
    <View style={{ flex: 1 }}>
      <StardustBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <CosmicHeader />

        <View style={{ paddingHorizontal: 20 }}>
          {/* Daily Insight Card */}
          <View style={{ marginBottom: 32 }}>
            <DailyInsight
              title="Today's Cosmic Message"
              message="The stars align in your favor today. Trust your intuition and embrace the unknown paths that reveal themselves."
              mood="positive"
            />
          </View>

          {/* Moon Phase Tracker */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontFamily: 'CormorantGaramond_500Medium',
                fontSize: 18,
                color: C.fg,
                marginBottom: 16,
              }}
            >
              Moon Phase
            </Text>
            <GlassCard hover={false}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {moonPhases.map((phase) => (
                  <View
                    key={phase.name}
                    style={{ alignItems: 'center', gap: 8 }}
                  >
                    <Text
                      style={{
                        fontSize: 28,
                        opacity: phase.active ? 1 : 0.4,
                      }}
                    >
                      {phase.icon}
                    </Text>
                    {phase.active && (
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '500',
                          color: C.accent,
                        }}
                      >
                        {phase.name}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>

          {/* Zodiac Selection */}
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: 'CormorantGaramond_500Medium',
                  fontSize: 18,
                  color: C.fg,
                }}
              >
                Your Signs
              </Text>
              <Pressable>
                <Text style={{ fontSize: 14, color: C.fgMuted }}>View All</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            >
              {zodiacSigns.map((zodiac) => (
                <ZodiacBadge
                  key={zodiac.sign}
                  sign={zodiac.sign}
                  symbol={zodiac.symbol}
                  element={zodiac.element}
                  isActive={activeZodiac === zodiac.sign}
                  onPress={() => setActiveZodiac(zodiac.sign)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Services Section */}
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: 'CormorantGaramond_500Medium',
                  fontSize: 18,
                  color: C.fg,
                }}
              >
                Mystical Services
              </Text>
              <Pressable>
                <Text style={{ fontSize: 14, color: C.fgMuted }}>See All</Text>
              </Pressable>
            </View>
            <View style={{ gap: 16 }}>
              {services.map((service) => (
                <TarotCard
                  key={service.title}
                  title={service.title}
                  subtitle={service.subtitle}
                  icon={service.icon}
                  description={service.description}
                  price={service.price}
                  accentColor={service.accentColor}
                  onPress={() => router.push('/services' as Href)}
                />
              ))}
            </View>
          </View>

          {/* Top Providers */}
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: 'CormorantGaramond_500Medium',
                  fontSize: 18,
                  color: C.fg,
                }}
              >
                Top Guides
              </Text>
              <Pressable>
                <Text style={{ fontSize: 14, color: C.fgMuted }}>Browse</Text>
              </Pressable>
            </View>
            <View style={{ gap: 12 }}>
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.name}
                  {...provider}
                  onPress={() => router.push('/explore' as Href)}
                />
              ))}
            </View>
          </View>

          {/* Cosmic Stats */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontFamily: 'CormorantGaramond_500Medium',
                fontSize: 18,
                color: C.fg,
                marginBottom: 16,
              }}
            >
              Cosmic Energy
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <View style={{ width: '48%' }}>
                <GlassCard>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: C.fire.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Flame size={20} color={C.fire.text} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: C.fgMuted }}>
                        Fire Energy
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'CormorantGaramond_500Medium',
                          fontSize: 20,
                          color: C.fg,
                        }}
                      >
                        87%
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </View>
              <View style={{ width: '48%' }}>
                <GlassCard>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: C.air.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Wind size={20} color={C.air.text} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: C.fgMuted }}>
                        Air Energy
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'CormorantGaramond_500Medium',
                          fontSize: 20,
                          color: C.fg,
                        }}
                      >
                        62%
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </View>
              <View style={{ width: '48%' }}>
                <GlassCard>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: C.water.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Droplets size={20} color={C.water.text} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: C.fgMuted }}>
                        Water Energy
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'CormorantGaramond_500Medium',
                          fontSize: 20,
                          color: C.fg,
                        }}
                      >
                        45%
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </View>
              <View style={{ width: '48%' }}>
                <GlassCard>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: C.earth.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Mountain size={20} color={C.earth.text} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: C.fgMuted }}>
                        Earth Energy
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'CormorantGaramond_500Medium',
                          fontSize: 20,
                          color: C.fg,
                        }}
                      >
                        73%
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </View>
            </View>
          </View>

          {/* CTA Section */}
          <View
            style={{
              marginBottom: 32,
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255,45,85,0.1)',
              }}
            />
            <View
              style={{
                backgroundColor: C.glassBg,
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: C.glassBorder,
                alignItems: 'center',
              }}
            >
              <SparkleEffect trigger={showSparkle} />
              <Animated.View style={{ marginBottom: 16 }}>
                <Moon size={48} color={C.accent} />
              </Animated.View>
              <Text
                style={{
                  fontFamily: 'CormorantGaramond_500Medium',
                  fontSize: 24,
                  color: C.fg,
                  marginBottom: 8,
                }}
              >
                Begin Your Journey
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: C.fgMuted,
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                Connect with the cosmos and unlock your true potential
              </Text>
              <MysticalButton
                variant="primary"
                size="lg"
                fullWidth
                sparkleOnClick
                onPress={handleBookReading}
              >
                Book a Reading
              </MysticalButton>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
