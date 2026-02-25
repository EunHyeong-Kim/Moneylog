'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransactions, useMonthlyStats } from '@/hooks/use-data'
import { formatCurrency, getDaysInMonth, getFirstDayOfMonth, getWeekdayName, formatDate } from '@/lib/helpers'
import type { Transaction } from '@/lib/types'
import { DayDetail } from './day-detail'
import { getKoreanHolidays } from '@/lib/korean-holidays'

interface CalendarViewProps {
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
  onAddTransaction: (date?: string) => void
}

export function CalendarView({ year, month, onMonthChange, onAddTransaction }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { data: transactions, isLoading } = useTransactions(year, month)
  const { income, expense, balance } = useMonthlyStats(year, month)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const holidayMap = useMemo(() => getKoreanHolidays(year), [year])

  const dailyTotals = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    transactions?.forEach(t => {
      const existing = map.get(t.date) || { income: 0, expense: 0 }
      if (t.type === 'income') existing.income += t.amount
      else existing.expense += t.amount
      map.set(t.date, existing)
    })
    return map
  }, [transactions])

  const selectedTransactions = useMemo(() => {
    if (!selectedDate || !transactions) return []
    return transactions.filter(t => t.date === selectedDate)
  }, [selectedDate, transactions])

  const goToPrevMonth = () => {
    if (month === 0) onMonthChange(year - 1, 11)
    else onMonthChange(year, month - 1)
  }

  const goToNextMonth = () => {
    if (month === 11) onMonthChange(year + 1, 0)
    else onMonthChange(year, month + 1)
  }

  const today = formatDate(new Date())

  return (
    <div className="flex flex-col">
      {/* Monthly Summary */}
      <div className="bg-primary px-4 pb-5 pt-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <button onClick={goToPrevMonth} className="p-1 text-primary-foreground/80 -translate-y-0.5" aria-label="이전 달">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-primary-foreground">
            {year}년 {month + 1}월
          </h2>
          <button onClick={goToNextMonth} className="p-1 text-primary-foreground/80 -translate-y-0.5" aria-label="다음 달">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 rounded-xl bg-primary-foreground/10 px-4 py-3">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-primary-foreground/60">수입</span>
            <span className="text-sm font-bold text-primary-foreground">
              {formatCurrency(income)}
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-primary-foreground/20">
            <span className="text-[10px] text-primary-foreground/60">지출</span>
            <span className="text-sm font-bold text-primary-foreground">
              {formatCurrency(expense)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-primary-foreground/60">잔액</span>
            <span
              className="text-sm font-bold"
              style={{ color: balance >= 0 ? '#5D6DBE' : '#F08080' }}
            >
              {formatCurrency(Math.abs(balance))}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card px-2 pt-2 pb-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {[0, 1, 2, 3, 4, 5, 6].map(d => (
            <div
              key={d}
              className={`py-1 text-center text-[11px] font-medium ${
                d === 0 ? 'text-expense' : d === 6 ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {getWeekdayName(d)}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[76px]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const totals = dailyTotals.get(dateStr)
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const dayOfWeek = (firstDay + i) % 7
            const holidayName = holidayMap.get(dateStr)
            const isHoliday = !!holidayName
            const isRed = dayOfWeek === 0 || isHoliday

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className="flex flex-col items-center min-h-[84px] p-1 rounded-lg transition-colors relative"
              >
                <span className={`text-xs font-medium leading-5 ${
                  isToday
                    ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]'
                    : isSelected
                      ? `flex h-5 w-5 items-center justify-center rounded-full bg-primary/40 ${isRed ? 'text-expense' : dayOfWeek === 6 ? 'text-primary' : 'text-card-foreground'}`
                      : isRed
                        ? 'text-expense'
                        : dayOfWeek === 6
                          ? 'text-primary'
                          : 'text-card-foreground'
                }`}>
                  {day}
                </span>
                {holidayName && (
                  <span className="block text-[7px] leading-[1.6] text-expense w-full text-center px-0.5 overflow-hidden whitespace-nowrap text-ellipsis opacity-80" style={{ marginTop: 1 }}>
                    {holidayName}
                  </span>
                )}
                {!isLoading && totals && (
                  <div className="flex flex-col items-center gap-0.5 mt-0.5 w-full">
                    {totals.income > 0 && (
                      <span className="text-[9px] leading-tight font-medium text-income w-full text-center px-0.5" style={{ wordBreak: 'break-all' }}>
                        +{totals.income >= 100000
                          ? `${Math.floor(totals.income / 10000)}만`
                          : totals.income >= 10000
                            ? `${(totals.income / 10000).toFixed(1)}만`
                            : totals.income.toLocaleString()}
                      </span>
                    )}
                    {totals.expense > 0 && (
                      <span className="text-[9px] leading-tight font-medium text-expense w-full text-center px-0.5" style={{ wordBreak: 'break-all' }}>
                        -{totals.expense >= 100000
                          ? `${Math.floor(totals.expense / 10000)}만`
                          : totals.expense >= 10000
                            ? `${(totals.expense / 10000).toFixed(1)}만`
                            : totals.expense.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day Detail Bottom Sheet */}
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          transactions={selectedTransactions}
          onClose={() => setSelectedDate(null)}
          onAddTransaction={() => onAddTransaction(selectedDate)}
        />
      )}
    </div>
  )
}
