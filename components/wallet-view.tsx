'use client'

import { useMemo, useState } from 'react'
import { Plus, X, Pencil, Trash2, CreditCard, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryIcon } from '@/components/category-icon'
import { usePaymentMethods, useTransactions } from '@/hooks/use-data'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/helpers'
import { mutate } from 'swr'
import type { PaymentMethod } from '@/lib/types'

interface WalletViewProps {
  year: number
  month: number
}

const typeOptions: { value: PaymentMethod['type']; label: string }[] = [
  { value: 'card', label: '카드' },
  { value: 'bank', label: '은행' },
  { value: 'cash', label: '현금' },
  { value: 'other', label: '기타' },
]

const colorMap: Record<string, string> = {
  card: '#3B82F6',
  bank: '#10B981',
  cash: '#22C55E',
  other: '#6B7280',
}

const iconMap: Record<string, string> = {
  card: 'credit-card',
  bank: 'wallet',
  cash: 'banknote',
  other: 'circle',
}

export function WalletView({ year, month }: WalletViewProps) {
  const { data: paymentMethods } = usePaymentMethods()
  const { data: transactions } = useTransactions(year, month)
  const [showAdd, setShowAdd] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)

  const spendingByMethod = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      ?.filter(t => t.type === 'expense')
      .forEach(t => {
        if (t.payment_method_id) {
          const cur = map.get(t.payment_method_id) || 0
          map.set(t.payment_method_id, cur + t.amount)
        }
      })
    return map
  }, [transactions])

  const totalSpent = Array.from(spendingByMethod.values()).reduce((s, v) => s + v, 0)

  const handleDelete = async (id: string) => {
    if (!confirm('이 결제 수단을 삭제하시겠습니까?')) return
    const supabase = createClient()
    await supabase.from('payment_methods').delete().eq('id', id)
    await mutate('payment_methods')
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="bg-primary px-4 pb-5 pt-4">
        <h2 className="mb-3 text-lg font-bold text-primary-foreground">
          {month + 1}월 결제 수단별 현황
        </h2>
        <div className="rounded-xl bg-primary-foreground/10 p-4">
          <div className="flex justify-between">
            <span className="text-xs text-primary-foreground/60">총 결제 금액</span>
            <span className="text-base font-bold text-primary-foreground">{formatCurrency(totalSpent)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Cards */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">결제 수단</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdd(true)}
            className="h-8 gap-1 text-primary"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">추가</span>
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {paymentMethods?.map(pm => {
            const spent = spendingByMethod.get(pm.id) || 0
            const ratio = totalSpent > 0 ? (spent / totalSpent) * 100 : 0

            return (
              <div key={pm.id} className="rounded-xl bg-card p-4 shadow-sm border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: pm.color + '20' }}
                  >
                    <CategoryIcon
                      iconName={pm.icon}
                      className="h-5 w-5"
                      style={{ color: pm.color }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-sm font-semibold text-card-foreground">{pm.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {pm.type === 'card' ? '카드' : pm.type === 'bank' ? '은행' : pm.type === 'cash' ? '현금' : '기타'}
                      {pm.type === 'card' && pm.billing_day && (
                        <span className="ml-1">· 매월 {pm.billing_day}일 결제</span>
                      )}
                      {pm.type === 'card' && pm.billing_start_day != null && pm.billing_end_day != null && (
                        <span className="ml-1">
                          ({pm.billing_start_day}일~{pm.billing_end_day === 0 ? '말일' : `${pm.billing_end_day}일`} 사용분)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-base font-bold text-card-foreground">{formatCurrency(spent)}</span>
                    <button
                      onClick={() => setEditingMethod(pm)}
                      className="ml-1 p-1.5 rounded-lg hover:bg-secondary transition-colors"
                      aria-label="수정"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(pm.id)}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                      aria-label="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${ratio}%`, backgroundColor: pm.color }}
                  />
                </div>
                <div className="mt-1 flex justify-end">
                  <span className="text-[10px] text-muted-foreground">{Math.round(ratio)}%</span>
                </div>
              </div>
            )
          })}
          {(!paymentMethods || paymentMethods.length === 0) && (
            <div className="rounded-xl bg-card p-6 text-center border border-border">
              <p className="text-sm text-muted-foreground">등록된 결제 수단이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAdd && <PaymentMethodForm onClose={() => setShowAdd(false)} />}

      {/* Edit Payment Method Modal */}
      {editingMethod && (
        <PaymentMethodForm
          existing={editingMethod}
          onClose={() => setEditingMethod(null)}
        />
      )}
    </div>
  )
}

interface PaymentMethodFormProps {
  existing?: PaymentMethod
  onClose: () => void
}

function PaymentMethodForm({ existing, onClose }: PaymentMethodFormProps) {
  const [name, setName] = useState(existing?.name || '')
  const [type, setType] = useState<PaymentMethod['type']>(existing?.type || 'card')
  const [billingDay, setBillingDay] = useState<string>(
    existing?.billing_day != null ? String(existing.billing_day) : ''
  )
  const [billingStartDay, setBillingStartDay] = useState<string>(
    existing?.billing_start_day != null ? String(existing.billing_start_day) : ''
  )
  const [billingEndDay, setBillingEndDay] = useState<string>(
    existing?.billing_end_day != null
      ? existing.billing_end_day === 0 ? '말일' : String(existing.billing_end_day)
      : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setIsSubmitting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSubmitting(false); return }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      type,
      color: colorMap[type],
      icon: iconMap[type],
    }

    if (type === 'card') {
      payload.billing_day = billingDay ? Number(billingDay) : null
      payload.billing_start_day = billingStartDay ? Number(billingStartDay) : null
      payload.billing_end_day = billingEndDay
        ? billingEndDay === '말일' ? 0 : Number(billingEndDay)
        : null
    } else {
      payload.billing_day = null
      payload.billing_start_day = null
      payload.billing_end_day = null
    }

    if (existing) {
      await supabase.from('payment_methods').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('payment_methods').insert({ ...payload, user_id: user.id })
    }

    await mutate('payment_methods')
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative z-10 mx-auto w-full max-w-lg rounded-t-2xl bg-card max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
            <h3 className="text-base font-bold text-card-foreground">
              {existing ? '결제 수단 수정' : '결제 수단 추가'}
            </h3>
            <div className="w-5" />
          </div>

          <div className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">이름</Label>
              <Input
                placeholder="예: 삼성카드"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11 rounded-xl text-card-foreground"
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">유형</Label>
              <div className="flex gap-2">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                      type === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Credit card billing settings */}
            {type === 'card' && (
              <div className="flex flex-col gap-3 rounded-xl bg-secondary/50 p-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">신용카드 결제 설정</span>
                </div>

                {/* Billing day — number input */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">결제일 (매월 청구대금이 빠지는 날)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">매월</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="28"
                      placeholder="--"
                      value={billingDay}
                      onChange={e => {
                        const v = e.target.value
                        if (v === '' || (Number(v) >= 1 && Number(v) <= 28)) setBillingDay(v)
                      }}
                      className="h-9 w-16 rounded-xl text-center text-sm font-bold text-card-foreground"
                    />
                    <span className="text-xs text-muted-foreground">일에 결제</span>
                  </div>
                </div>

                {/* Billing period — dropdowns */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">정산 기간 (사용 내역 집계 기간)</Label>
                  <div className="flex items-center gap-2">
                    <select
                      value={billingStartDay}
                      onChange={e => setBillingStartDay(e.target.value)}
                      className="h-9 flex-1 rounded-xl border border-border bg-card px-2 text-sm text-card-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">시작일</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={String(d)}>{d}일</option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground shrink-0">~</span>
                    <select
                      value={billingEndDay}
                      onChange={e => setBillingEndDay(e.target.value)}
                      className="h-9 flex-1 rounded-xl border border-border bg-card px-2 text-sm text-card-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">종료일</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={String(d)}>{d}일</option>
                      ))}
                      <option value="말일">말일</option>
                    </select>
                  </div>
                  {billingStartDay && billingEndDay && billingDay && (
                    <p className="text-[11px] text-primary">
                      {billingStartDay}일 ~ {billingEndDay === '말일' ? '말일' : `${billingEndDay}일`} 사용분 → 매월 {billingDay}일 청구
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-1.5 rounded-lg bg-primary/10 p-2">
                  <AlertCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-primary">
                    예: 1일~말일 사용분이 다음달 15일 결제라면 → 시작 1일, 종료 말일, 결제일 15
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              {isSubmitting ? '저장 중...' : existing ? '수정하기' : '추가하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
