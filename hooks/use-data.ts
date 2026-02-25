'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Category, PaymentMethod, Transaction, FixedExpense } from '@/lib/types'
import { getMonthRange } from '@/lib/helpers'

const supabase = createClient()

export function useCategories() {
  return useSWR<Category[]>('categories', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  })
}

export function usePaymentMethods() {
  return useSWR<PaymentMethod[]>('payment_methods', async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  })
}

export function useTransactions(year: number, month: number) {
  const { start, end } = getMonthRange(year, month)
  return useSWR<Transaction[]>(
    `transactions-${year}-${month}`,
    async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(*), payment_methods(*)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  )
}

export function useFixedExpenses() {
  return useSWR<FixedExpense[]>('fixed_expenses', async () => {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*, categories(*), payment_methods(*)')
      .order('due_day', { ascending: true })
    if (error) throw error
    return data || []
  })
}

export function useMonthlyStats(year: number, month: number) {
  const { data: transactions } = useTransactions(year, month)

  const income = transactions
    ?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) ?? 0

  const expense = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) ?? 0

  return { income, expense, balance: income - expense }
}
