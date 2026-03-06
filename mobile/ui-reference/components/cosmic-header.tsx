'use client'

import { motion } from 'framer-motion'
import { Bell, Settings } from 'lucide-react'

export function CosmicHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-10 flex items-center justify-between px-5 pb-4 pt-12"
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3">
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.09 8.26L20.18 8.27L15.45 12.14L17.54 18.38L12 14.76L6.46 18.38L8.55 12.14L3.82 8.27L9.91 8.26L12 2Z" />
          </svg>
        </motion.div>
        <div>
          <h1 className="font-serif text-xl font-medium text-foreground">Celestia</h1>
          <p className="text-xs text-muted-foreground">Discover your path</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.header>
  )
}
