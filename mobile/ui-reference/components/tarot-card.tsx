'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TarotCardProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  description: string
  price?: string
  accentColor?: 'primary' | 'accent' | 'ethereal'
  onClick?: () => void
  className?: string
}

export function TarotCard({
  title,
  subtitle,
  icon,
  description,
  price,
  accentColor = 'primary',
  onClick,
  className,
}: TarotCardProps) {
  const accentStyles = {
    primary: {
      border: 'hover:border-primary/30',
      glow: 'hover:shadow-[0_0_30px_rgba(255,45,85,0.15)]',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    accent: {
      border: 'hover:border-accent/30',
      glow: 'hover:shadow-[0_0_30px_rgba(0,242,255,0.15)]',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
    },
    ethereal: {
      border: 'hover:border-ethereal/30',
      glow: 'hover:shadow-[0_0_30px_rgba(57,255,20,0.15)]',
      iconBg: 'bg-ethereal/10',
      iconColor: 'text-ethereal',
    },
  }

  const styles = accentStyles[accentColor]

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'glass group relative flex w-full flex-col overflow-hidden rounded-2xl p-6 text-left transition-all duration-500',
        styles.border,
        styles.glow,
        className
      )}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Decorative corner elements */}
      <div className="absolute right-3 top-3 h-8 w-8 border-r border-t border-white/10 transition-colors group-hover:border-white/20" />
      <div className="absolute bottom-3 left-3 h-8 w-8 border-b border-l border-white/10 transition-colors group-hover:border-white/20" />

      {/* Icon */}
      <div
        className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300',
          styles.iconBg,
          styles.iconColor
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        {subtitle && (
          <span className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </span>
        )}
        <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
          {title}
        </h3>
        <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        {price && (
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <span className="text-xs text-muted-foreground">Starting at</span>
            <span className={cn('font-serif text-lg font-medium', styles.iconColor)}>
              {price}
            </span>
          </div>
        )}
      </div>

      {/* Hover gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.button>
  )
}
