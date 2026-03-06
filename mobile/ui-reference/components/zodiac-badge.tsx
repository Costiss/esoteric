'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ZodiacBadgeProps {
  sign: string
  symbol: string
  element: 'fire' | 'earth' | 'air' | 'water'
  isActive?: boolean
  onClick?: () => void
}

const elementColors = {
  fire: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    glow: 'shadow-[0_0_15px_rgba(255,45,85,0.2)]',
  },
  earth: {
    bg: 'bg-ethereal/10',
    border: 'border-ethereal/30',
    text: 'text-ethereal',
    glow: 'shadow-[0_0_15px_rgba(57,255,20,0.2)]',
  },
  air: {
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    text: 'text-accent',
    glow: 'shadow-[0_0_15px_rgba(0,242,255,0.2)]',
  },
  water: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
  },
}

export function ZodiacBadge({
  sign,
  symbol,
  element,
  isActive = false,
  onClick,
}: ZodiacBadgeProps) {
  const colors = elementColors[element]

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border p-3 transition-all',
        colors.bg,
        colors.border,
        isActive && colors.glow
      )}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className={cn('text-2xl', colors.text)}>{symbol}</span>
      <span className="text-xs font-medium text-foreground">{sign}</span>
    </motion.button>
  )
}
