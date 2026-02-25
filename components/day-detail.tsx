'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/category-icon'
import { formatCurrency } from '@/lib/helpers'
import type { Transaction } from '@/lib/types'

interface DayDetailProps {
  date: string
  transactions: Transaction[]
  onClose: () => void
  onAddTransaction: () => void
}

export function DayDetail({ date, transactions, onClose, onAddTransaction }: DayDetailProps) {
  const d = new Date(date + 'T00:00:00')
  const dayLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[d.getDay()]

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="border-t border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-bold text-card-foreground">{dayLabel}</h3>
          <span className={`text-sm ${d.getDay() === 0 ? 'text-expense' : d.getDay() === 6 ? 'text-primary' : 'text-muted-foreground'}`}>
            {weekday}요일
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onAddTransaction} className="h-8 gap-1 text-primary">
          <Plus className="h-4 w-4" />
          <span className="text-xs">추가</span>
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <p className="text-sm">내역이 없습니다</p>
          <Button variant="outline" size="sm" onClick={onAddTransaction} className="text-xs">
            내역 추가하기
          </Button>
        </div>
      ) : (
        <>
          <div className="flex gap-4 px-4 pb-2">
            {income > 0 && (
              <span className="text-xs text-income font-medium">수입 {formatCurrency(income)}</span>
            )}
            {expense > 0 && (
              <span className="text-xs text-expense font-medium">지출 {formatCurrency(expense)}</span>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto no-scrollbar px-4 pb-4">
            <div className="flex flex-col gap-2">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: (t.categories?.color || '#6B7280') + '20' }}
                  >
                    <CategoryIcon
                      iconName={t.categories?.icon || 'circle'}
                      className="h-4 w-4"
                      style={{ color: t.categories?.color || '#6B7280' }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-card-foreground">
                      {t.description || t.categories?.name || '미분류'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {t.payment_methods?.name || ''}{t.memo ? ` · ${t.memo}` : ''}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
