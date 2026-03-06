'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Compass, Calendar, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', href: '#home' },
  { icon: Compass, label: 'Explore', href: '#explore' },
  { icon: Sparkles, label: 'Services', href: '#services' },
  { icon: Calendar, label: 'Book', href: '#book' },
  { icon: User, label: 'Profile', href: '#profile' },
]

export function FloatingNav() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
      className="glass-strong fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-2 py-3"
    >
      <ul className="flex items-center gap-1">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = activeIndex === index

          return (
            <li key={item.label}>
              <motion.a
                href={item.href}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-full p-3 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute inset-0 rounded-full bg-primary/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                </AnimatePresence>
                <Icon className="relative z-10 h-5 w-5" />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-6 text-[10px] font-medium text-primary"
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.a>
            </li>
          )
        })}
      </ul>
    </motion.nav>
  )
}
