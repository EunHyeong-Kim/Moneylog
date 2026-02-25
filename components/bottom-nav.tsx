'use client'

import { Calendar, PieChart, Wallet, Target } from 'lucide-react'
import type { TabType } from '@/lib/types'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'calendar', label: '달력', icon: Calendar },
  { id: 'budget', label: '예산', icon: Target },
  { id: 'wallet', label: '지갑', icon: Wallet },
  { id: 'stats', label: '통계', icon: PieChart },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 pt-3 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
