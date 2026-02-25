export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  budget_amount: number
  is_default: boolean
  created_at: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  name: string
  type: 'card' | 'bank' | 'cash' | 'other'
  color: string
  icon: string
  is_default: boolean
  billing_day?: number | null
  billing_start_day?: number | null
  billing_end_day?: number | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  category_id: string | null
  payment_method_id: string | null
  description: string | null
  memo: string | null
  date: string
  is_fixed: boolean
  installment_months?: number | null
  created_at: string
  updated_at: string
  // joined fields
  categories?: Category | null
  payment_methods?: PaymentMethod | null
}

export interface FixedExpense {
  id: string
  user_id: string
  category_id: string | null
  payment_method_id: string | null
  description: string
  amount: number
  due_day: number | null
  is_active: boolean
  created_at: string
  categories?: Category | null
  payment_methods?: PaymentMethod | null
}

export type TabType = 'calendar' | 'budget' | 'wallet' | 'stats'
