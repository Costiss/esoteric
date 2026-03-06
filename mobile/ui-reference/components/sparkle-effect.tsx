'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  color: string
}

interface SparkleEffectProps {
  trigger?: boolean
  count?: number
  colors?: string[]
}

export function SparkleEffect({ 
  trigger = false, 
  count = 12,
  colors = ['#FF2D55', '#00F2FF', '#39FF14', '#ffffff']
}: SparkleEffectProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  useEffect(() => {
    if (trigger) {
      const newSparkles: Sparkle[] = []
      for (let i = 0; i < count; i++) {
        newSparkles.push({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
      setSparkles(newSparkles)

      const timer = setTimeout(() => {
        setSparkles([])
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [trigger, count, colors])

  return (
    <AnimatePresence>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="pointer-events-none absolute"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ 
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            rotate: [0, 180]
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <svg
            width={sparkle.size}
            height={sparkle.size}
            viewBox="0 0 24 24"
            fill={sparkle.color}
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

// Hook for triggering sparkles
export function useSparkle() {
  const [isSparkle, setIsSparkle] = useState(false)

  const triggerSparkle = () => {
    setIsSparkle(true)
    setTimeout(() => setIsSparkle(false), 100)
  }

  return { isSparkle, triggerSparkle }
}
