'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  if (!hover) {
    return (
      <div
        className={cn(
          'glass rounded-2xl p-5',
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={cn(
        'glass cursor-pointer rounded-2xl p-5 transition-all duration-300',
        'hover:border-white/15 hover:bg-white/[0.05]',
        className
      )}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  )
}
