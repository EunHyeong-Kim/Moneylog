'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useCategories, usePaymentMethods, useTransactions } from '@/hooks/use-data'
import { formatCurrency } from '@/lib/helpers'
import { CategoryIcon } from '@/components/category-icon'

interface StatsViewProps {
  year: number
  month: number
}

export function StatsView({ year, month }: StatsViewProps) {
  const { data: categories } = useCategories()
  const { data: paymentMethods } = usePaymentMethods()
  const { data: transactions } = useTransactions(year, month)

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      ?.filter(t => t.type === 'expense')
      .forEach(t => {
        if (t.category_id) {
          map.set(t.category_id, (map.get(t.category_id) || 0) + t.amount)
        }
      })

    return Array.from(map.entries())
      .map(([id, amount]) => {
        const cat = categories?.find(c => c.id === id)
        return {
          id,
          name: cat?.name || '미분류',
          icon: cat?.icon || 'circle',
          color: cat?.color || '#6B7280',
          amount,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, categories])

  const paymentStats = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      ?.filter(t => t.type === 'expense')
      .forEach(t => {
        if (t.payment_method_id) {
          map.set(t.payment_method_id, (map.get(t.payment_method_id) || 0) + t.amount)
        }
      })

    return Array.from(map.entries())
      .map(([id, amount]) => {
        const pm = paymentMethods?.find(p => p.id === id)
        return {
          id,
          name: pm?.name || '미분류',
          color: pm?.color || '#6B7280',
          amount,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, paymentMethods])

  const totalExpense = categoryStats.reduce((s, c) => s + c.amount, 0)
  const totalIncome = transactions
    ?.filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0) ?? 0

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="bg-primary px-4 pb-5 pt-4">
        <h2 className="mb-3 text-lg font-bold text-primary-foreground">
          {month + 1}월 통계
        </h2>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-primary-foreground/10 p-3">
            <span className="text-[10px] text-primary-foreground/60">총 수입</span>
            <p className="text-sm font-bold text-primary-foreground">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex-1 rounded-xl bg-primary-foreground/10 p-3">
            <span className="text-[10px] text-primary-foreground/60">총 지출</span>
            <p className="text-sm font-bold text-primary-foreground">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Category Donut Chart */}
      <div className="px-4">
        <h3 className="mb-3 text-sm font-bold text-foreground">카테고리별 지출</h3>
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          {categoryStats.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="amount"
                    >
                      {categoryStats.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">총 지출</span>
                  <span className="text-xs font-bold text-card-foreground">
                    {totalExpense >= 10000 ? `${Math.floor(totalExpense / 10000)}만원` : formatCurrency(totalExpense)}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {categoryStats.slice(0, 5).map(stat => {
                  const pct = totalExpense > 0 ? Math.round((stat.amount / totalExpense) * 100) : 0
                  return (
                    <div key={stat.id} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                      <span className="text-xs text-card-foreground flex-1 truncate">{stat.name}</span>
                      <span className="text-[11px] font-medium text-muted-foreground">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">지출 데이터가 없습니다</p>
          )}
        </div>

        {/* Category List */}
        <div className="mt-3 flex flex-col gap-2">
          {categoryStats.map(stat => {
            const pct = totalExpense > 0 ? Math.round((stat.amount / totalExpense) * 100) : 0
            return (
              <div key={stat.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm border border-border">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: stat.color + '20' }}
                >
                  <CategoryIcon iconName={stat.icon} className="h-4 w-4" style={{ color: stat.color }} />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-card-foreground">{stat.name}</span>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: stat.color }} />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-card-foreground">{formatCurrency(stat.amount)}</span>
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Method Bar Chart */}
      <div className="px-4">
        <h3 className="mb-3 text-sm font-bold text-foreground">결제 수단별 지출</h3>
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          {paymentStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(paymentStats.length * 50, 100)}>
              <BarChart data={paymentStats} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={60}
                  tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--card-foreground)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                  {paymentStats.map(entry => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">결제 데이터가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
