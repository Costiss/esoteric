'use client'

import { motion } from 'framer-motion'
import { Star, Verified } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProviderCardProps {
  name: string
  specialty: string
  avatar: string
  rating: number
  reviews: number
  isVerified?: boolean
  available?: boolean
  onClick?: () => void
}

export function ProviderCard({
  name,
  specialty,
  avatar,
  rating,
  reviews,
  isVerified = false,
  available = true,
  onClick,
}: ProviderCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="glass group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05]"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-0.5">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-2xl">
            {avatar}
          </div>
        </div>
        {available && (
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background bg-ethereal" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground">{name}</h4>
          {isVerified && (
            <Verified className="h-4 w-4 text-accent" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{specialty}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs font-medium text-foreground">{rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({reviews} reviews)</span>
        </div>
      </div>

      {/* Arrow indicator */}
      <motion.div
        className="text-muted-foreground transition-colors group-hover:text-foreground"
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>
    </motion.button>
  )
}
