'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Star, Eye, Heart, Flame, Wind, Droplets, Mountain } from 'lucide-react'
import { StardustBackground } from '@/components/stardust-background'
import { FloatingNav } from '@/components/floating-nav'
import { CosmicHeader } from '@/components/cosmic-header'
import { TarotCard } from '@/components/tarot-card'
import { GlassCard } from '@/components/glass-card'
import { ProviderCard } from '@/components/provider-card'
import { MysticalButton } from '@/components/mystical-button'
import { ZodiacBadge } from '@/components/zodiac-badge'
import { DailyInsight } from '@/components/daily-insight'
import { SparkleEffect, useSparkle } from '@/components/sparkle-effect'

const services = [
  {
    title: 'Tarot Reading',
    subtitle: 'Divination',
    icon: <Eye className="h-7 w-7" />,
    description: 'Unlock the mysteries of your past, present, and future through ancient card wisdom.',
    price: '$29',
    accentColor: 'primary' as const,
  },
  {
    title: 'Birth Chart',
    subtitle: 'Astrology',
    icon: <Star className="h-7 w-7" />,
    description: 'Discover your cosmic blueprint with a personalized natal chart analysis.',
    price: '$49',
    accentColor: 'accent' as const,
  },
  {
    title: 'Energy Healing',
    subtitle: 'Wellness',
    icon: <Heart className="h-7 w-7" />,
    description: 'Restore balance and harmony through chakra alignment and reiki sessions.',
    price: '$65',
    accentColor: 'ethereal' as const,
  },
]

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
]

const zodiacSigns = [
  { sign: 'Aries', symbol: '♈', element: 'fire' as const },
  { sign: 'Taurus', symbol: '♉', element: 'earth' as const },
  { sign: 'Gemini', symbol: '♊', element: 'air' as const },
  { sign: 'Cancer', symbol: '♋', element: 'water' as const },
  { sign: 'Leo', symbol: '♌', element: 'fire' as const },
  { sign: 'Virgo', symbol: '♍', element: 'earth' as const },
]

const moonPhases = [
  { name: 'New Moon', icon: '🌑', active: false },
  { name: 'Waxing', icon: '🌒', active: false },
  { name: 'First Quarter', icon: '🌓', active: true },
  { name: 'Waxing Gibbous', icon: '🌔', active: false },
  { name: 'Full Moon', icon: '🌕', active: false },
]

export default function CelestiaApp() {
  const [activeZodiac, setActiveZodiac] = useState('Leo')
  const { isSparkle, triggerSparkle } = useSparkle()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-28">
      {/* Stardust Canvas Background */}
      <StardustBackground />

      {/* Main Content */}
      <div className="relative z-10">
        <CosmicHeader />

        <motion.main
          className="px-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Daily Insight Card */}
          <motion.section variants={itemVariants} className="mb-8">
            <DailyInsight
              title="Today's Cosmic Message"
              message="The stars align in your favor today. Trust your intuition and embrace the unknown paths that reveal themselves."
              mood="positive"
            />
          </motion.section>

          {/* Moon Phase Tracker */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="mb-4 font-serif text-lg text-foreground">Moon Phase</h2>
            <GlassCard hover={false} className="overflow-hidden">
              <div className="flex items-center justify-between">
                {moonPhases.map((phase) => (
                  <motion.div
                    key={phase.name}
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span
                      className={`text-2xl ${phase.active ? 'animate-pulse-glow' : 'opacity-40'}`}
                    >
                      {phase.icon}
                    </span>
                    {phase.active && (
                      <span className="text-[10px] font-medium text-accent">
                        {phase.name}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.section>

          {/* Zodiac Selection */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">Your Signs</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                View All
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {zodiacSigns.map((zodiac) => (
                <ZodiacBadge
                  key={zodiac.sign}
                  sign={zodiac.sign}
                  symbol={zodiac.symbol}
                  element={zodiac.element}
                  isActive={activeZodiac === zodiac.sign}
                  onClick={() => setActiveZodiac(zodiac.sign)}
                />
              ))}
            </div>
          </motion.section>

          {/* Services Section */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">Mystical Services</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                See All
              </button>
            </div>
            <div className="grid gap-4">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  variants={itemVariants}
                  custom={index}
                >
                  <TarotCard
                    title={service.title}
                    subtitle={service.subtitle}
                    icon={service.icon}
                    description={service.description}
                    price={service.price}
                    accentColor={service.accentColor}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Top Providers */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">Top Guides</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                Browse
              </button>
            </div>
            <div className="space-y-3">
              {providers.map((provider) => (
                <ProviderCard key={provider.name} {...provider} />
              ))}
            </div>
          </motion.section>

          {/* Cosmic Stats */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="mb-4 font-serif text-lg text-foreground">Cosmic Energy</h2>
            <div className="grid grid-cols-2 gap-3">
              <GlassCard>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fire Energy</p>
                    <p className="font-serif text-lg text-foreground">87%</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Wind className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Air Energy</p>
                    <p className="font-serif text-lg text-foreground">62%</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Droplets className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Water Energy</p>
                    <p className="font-serif text-lg text-foreground">45%</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ethereal/10">
                    <Mountain className="h-5 w-5 text-ethereal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Earth Energy</p>
                    <p className="font-serif text-lg text-foreground">73%</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section variants={itemVariants} className="relative mb-8 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-ethereal/10" />
            <div className="glass relative p-6 text-center">
              <SparkleEffect trigger={isSparkle} />
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-4"
              >
                <Moon className="mx-auto h-12 w-12 text-accent" />
              </motion.div>
              <h3 className="mb-2 font-serif text-2xl text-foreground">
                Begin Your Journey
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Connect with the cosmos and unlock your true potential
              </p>
              <MysticalButton
                variant="primary"
                size="lg"
                fullWidth
                sparkleOnClick
                onClick={triggerSparkle}
              >
                Book a Reading
              </MysticalButton>
            </div>
          </motion.section>
        </motion.main>
      </div>

      {/* Floating Navigation */}
      <FloatingNav />
    </div>
  )
}
