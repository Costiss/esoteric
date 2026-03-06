'use client'

import { motion } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'

interface DailyInsightProps {
  title: string
  message: string
  mood?: 'positive' | 'neutral' | 'challenging'
}

export function DailyInsight({ title, message, mood = 'positive' }: DailyInsightProps) {
  const moodGradients = {
    positive: 'from-ethereal/20 via-accent/10 to-transparent',
    neutral: 'from-accent/20 via-primary/10 to-transparent',
    challenging: 'from-primary/20 via-purple-500/10 to-transparent',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-5"
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${moodGradients[mood]} opacity-50`}
      />
      <div className="glass absolute inset-0" />

      {/* Content */}
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-5 w-5 text-accent" />
          </motion.div>
          <span className="text-xs font-medium uppercase tracking-wider text-accent">
            {title}
          </span>
        </div>

        <p className="mb-4 font-serif text-lg leading-relaxed text-foreground">
          {'"'}{message}{'"'}
        </p>

        <motion.button
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          whileHover={{ x: 4 }}
        >
          Read full horoscope
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}
