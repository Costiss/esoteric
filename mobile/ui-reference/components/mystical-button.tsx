'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SparkleEffect, useSparkle } from './sparkle-effect'

interface MysticalButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  sparkleOnClick?: boolean
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function MysticalButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  sparkleOnClick = false,
  onClick,
  className,
  disabled = false,
}: MysticalButtonProps) {
  const { isSparkle, triggerSparkle } = useSparkle()
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    if (disabled) return
    if (sparkleOnClick) triggerSparkle()
    onClick?.()
  }

  const variantStyles = {
    primary: cn(
      'bg-primary text-primary-foreground',
      'hover:bg-primary/90',
      'glow-primary'
    ),
    secondary: cn(
      'glass text-foreground',
      'hover:bg-white/[0.08]',
      'hover:border-white/20'
    ),
    ghost: cn(
      'bg-transparent text-foreground',
      'hover:bg-white/[0.05]'
    ),
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  }

  return (
    <motion.button
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center font-medium transition-all duration-300',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      animate={{
        boxShadow: isPressed
          ? '0 0 30px rgba(255, 45, 85, 0.4)'
          : '0 0 20px rgba(255, 45, 85, 0.2)',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {sparkleOnClick && <SparkleEffect trigger={isSparkle} />}
      {children}
    </motion.button>
  )
}
