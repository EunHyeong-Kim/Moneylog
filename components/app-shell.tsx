'use client'

import { useState } from 'react'
import { Plus, LogOut } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { CalendarView } from '@/components/calendar-view'
import { BudgetView } from '@/components/budget-view'
import { WalletView } from '@/components/wallet-view'
import { StatsView } from '@/components/stats-view'
import { TransactionForm } from '@/components/transaction-form'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { TabType } from '@/lib/types'

export function AppShell() {
  const router = useRouter()
  const now = new Date()
  const [activeTab, setActiveTab] = useState<TabType>('calendar')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [formDate, setFormDate] = useState<string | undefined>()

  const handleMonthChange = (y: number, m: number) => {
    setYear(y)
    setMonth(m)
  }

  const handleAddTransaction = (date?: string) => {
    setFormDate(date)
    setShowTransactionForm(true)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-background">
      {/* Top Header (minimal for non-calendar tabs) */}
      {activeTab !== 'calendar' && activeTab !== 'budget' && activeTab !== 'wallet' && activeTab !== 'stats' ? null : null}

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'calendar' && (
          <CalendarView
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
            onAddTransaction={handleAddTransaction}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetView year={year} month={month} />
        )}
        {activeTab === 'wallet' && (
          <WalletView year={year} month={month} />
        )}
        {activeTab === 'stats' && (
          <StatsView year={year} month={month} />
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => handleAddTransaction()}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        aria-label="내역 추가"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="fixed top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 text-muted-foreground shadow-sm backdrop-blur-sm border border-border"
        aria-label="로그아웃"
      >
        <LogOut className="h-4 w-4" />
      </button>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Transaction Form */}
      {showTransactionForm && (
        <TransactionForm
          initialDate={formDate}
          onClose={() => setShowTransactionForm(false)}
          year={year}
          month={month}
        />
      )}
    </div>
  )
}
