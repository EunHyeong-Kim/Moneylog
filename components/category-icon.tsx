'use client'

import {
  Utensils, Car, ShoppingBag, Home, Music, HeartPulse, BookOpen,
  Banknote, PlusCircle, MinusCircle, CreditCard, CircleDot, Wallet,
  Coffee, Plane, Gift, Smartphone, Dumbbell, Scissors, Baby,
  type LucideProps
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  home: Home,
  music: Music,
  'heart-pulse': HeartPulse,
  'book-open': BookOpen,
  banknote: Banknote,
  'plus-circle': PlusCircle,
  'minus-circle': MinusCircle,
  'credit-card': CreditCard,
  circle: CircleDot,
  wallet: Wallet,
  coffee: Coffee,
  plane: Plane,
  gift: Gift,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
  scissors: Scissors,
  baby: Baby,
}

interface CategoryIconProps extends LucideProps {
  iconName: string
}

export function CategoryIcon({ iconName, className, style }: CategoryIconProps) {
  const Icon = iconMap[iconName]

  // Lucide icon
  if (Icon) return <Icon className={className} style={style} />

  // Emoji or custom text — render as inline span
  return (
    <span
      className={className}
      style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style, color: undefined }}
      aria-hidden="true"
    >
      {iconName || '●'}
    </span>
  )
}
