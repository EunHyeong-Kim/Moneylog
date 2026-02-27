'use client'

import { useState, useMemo } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryIcon } from '@/components/category-icon'
import { createClient } from '@/lib/supabase/client'
import { useCategories, usePaymentMethods } from '@/hooks/use-data'
import { formatDate } from '@/lib/helpers'
import { mutate } from 'swr'
import type { Transaction } from '@/lib/types'

interface TransactionFormProps {
  initialDate?: string
  existing?: Transaction
  onClose: () => void
  year: number
  month: number
}

const INSTALLMENT_OPTIONS = [
  { value: 1, label: '일시불' },
  { value: 2, label: '2개월' },
  { value: 3, label: '3개월' },
  { value: 6, label: '6개월' },
  { value: 12, label: '12개월' },
  { value: 24, label: '24개월' },
]

export function TransactionForm({ initialDate, existing, onClose, year, month }: TransactionFormProps) {
  const { data: categories } = useCategories()
  const { data: paymentMethods } = usePaymentMethods()
  const [type, setType] = useState<'expense' | 'income'>(existing?.type || 'expense')
  const [amount, setAmount] = useState(existing ? existing.amount.toLocaleString() : '')

  const amountNumber = Number(amount.replace(/,/g, ''))

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    setAmount(digits ? Number(digits).toLocaleString() : '')
  }
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id || null)
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(existing?.payment_method_id || null)
  const [installmentMonths, setInstallmentMonths] = useState(existing?.installment_months || 1)
  const [description, setDescription] = useState(existing?.description || '')
  const [memo, setMemo] = useState(existing?.memo || '')
  const [date, setDate] = useState(existing?.date || initialDate || formatDate(new Date()))
  const [isRecurring, setIsRecurring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Day of month derived from selected date (e.g., 25 for 2025-02-25)
  const dueDay = useMemo(() => {
    if (!date) return null
    return new Date(date).getDate()
  }, [date])

  const filteredCategories = categories?.filter(c => {
    if (type === 'income') return c.name === '급여' || c.name === '기타수입'
    return c.name !== '급여' && c.name !== '기타수입'
  })

  const selectedPaymentMethod = useMemo(
    () => paymentMethods?.find(pm => pm.id === paymentMethodId),
    [paymentMethods, paymentMethodId]
  )

  const isCardPayment = selectedPaymentMethod?.type === 'card'

  const handleTypeChange = (t: 'expense' | 'income') => {
    setType(t)
    setCategoryId(null)
    if (t === 'income') setIsRecurring(false)
  }

  const handlePaymentMethodSelect = (pmId: string) => {
    const newId = paymentMethodId === pmId ? null : pmId
    setPaymentMethodId(newId)
    if (!newId) {
      setInstallmentMonths(1)
    } else {
      const pm = paymentMethods?.find(p => p.id === newId)
      if (pm?.type !== 'card') setInstallmentMonths(1)
    }
  }

  const handleSubmit = async () => {
    if (!amount || amountNumber <= 0) return
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsSubmitting(false); return }

      const payload: Record<string, unknown> = {
        type,
        amount: amountNumber,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        description: description || null,
        memo: memo || null,
        date,
        is_fixed: existing ? existing.is_fixed : isRecurring,
      }

      if (existing) {
        // 수정 모드
        const { error } = await supabase.from('transactions').update(payload).eq('id', existing.id)
        if (error) {
          setErrorMsg('저장 실패: ' + error.message)
        } else {
          await mutate(`transactions-${year}-${month}`)
          onClose()
        }
      } else {
        // 신규 추가 모드 — installment_months는 추가 시에만 포함
        if (isCardPayment && installmentMonths > 1) {
          payload.installment_months = installmentMonths
        }
        const { error } = await supabase.from('transactions').insert({ ...payload, user_id: user.id })
        if (error) {
          setErrorMsg('저장 실패: ' + error.message)
        } else {
          if (isRecurring && dueDay) {
            await supabase.from('fixed_expenses').insert({
              user_id: user.id,
              category_id: categoryId,
              payment_method_id: paymentMethodId,
              description: description.trim() || '반복 지출',
              amount: amountNumber,
              due_day: dueDay,
              is_active: true,
            })
            await mutate('fixed_expenses')
          }
          await mutate(`transactions-${year}-${month}`)
          onClose()
        }
      }
    } catch (e) {
      setErrorMsg('오류가 발생했습니다: ' + String(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative z-10 mx-auto w-full max-w-lg flex max-h-[85vh] flex-col rounded-t-2xl bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button onClick={onClose} aria-label="닫기">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <h3 className="text-base font-bold text-card-foreground">{existing ? '내역 수정' : '내역 추가'}</h3>
          <div className="w-5" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
          <div className="flex flex-col gap-5">
            {/* Type Toggle */}
            <div className="flex rounded-xl bg-secondary p-1">
              <button
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  type === 'expense'
                    ? 'bg-card text-expense shadow-sm'
                    : 'text-muted-foreground'
                }`}
                onClick={() => handleTypeChange('expense')}
              >
                지출
              </button>
              <button
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  type === 'income'
                    ? 'bg-card text-income shadow-sm'
                    : 'text-muted-foreground'
                }`}
                onClick={() => handleTypeChange('income')}
              >
                수입
              </button>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">금액</Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={handleAmountChange}
                  className="h-14 rounded-xl pr-10 text-right text-2xl font-bold text-card-foreground"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">원</span>
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">날짜</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-11 rounded-xl text-card-foreground"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">카테고리</Label>
              <div className="flex flex-wrap gap-2">
                {filteredCategories?.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      categoryId === c.id
                        ? 'text-card shadow-sm ring-1 ring-border'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                    style={categoryId === c.id ? { backgroundColor: c.color, color: '#fff' } : undefined}
                  >
                    <CategoryIcon iconName={c.icon} className="h-3.5 w-3.5" />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">결제 수단</Label>
              <div className="flex flex-wrap gap-2">
                {paymentMethods?.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => handlePaymentMethodSelect(pm.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      paymentMethodId === pm.id
                        ? 'text-card shadow-sm ring-1 ring-border'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                    style={paymentMethodId === pm.id ? { backgroundColor: pm.color, color: '#fff' } : undefined}
                  >
                    <CategoryIcon iconName={pm.icon} className="h-3.5 w-3.5" />
                    {pm.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Installment — only shown when a card is selected and type is expense */}
            {isCardPayment && type === 'expense' && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground">결제 방식</Label>
                <div className="flex flex-wrap gap-2">
                  {INSTALLMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setInstallmentMonths(opt.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        installmentMonths === opt.value
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {installmentMonths > 1 && amountNumber > 0 && (
                  <p className="text-[11px] text-primary">
                    월 {Math.ceil(amountNumber / installmentMonths).toLocaleString()}원 × {installmentMonths}개월
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">내용</Label>
              <Input
                placeholder="어디에 사용했나요?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="h-11 rounded-xl text-card-foreground"
              />
            </div>

            {/* Memo */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">메모</Label>
              <Input
                placeholder="추가 메모 (선택)"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className="h-11 rounded-xl text-card-foreground"
              />
            </div>

            {/* Recurring toggle — only for new expense */}
            {!existing && type === 'expense' && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsRecurring(v => !v)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors border ${
                    isRecurring
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-secondary border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className={`h-4 w-4 ${isRecurring ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex flex-col items-start">
                      <span className={`text-sm font-semibold ${isRecurring ? 'text-primary' : 'text-card-foreground'}`}>
                        반복 지출
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        매월 같은 날짜에 자동 등록
                      </span>
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <div className={`relative h-6 w-11 rounded-full transition-colors ${isRecurring ? 'bg-primary' : 'bg-border'}`}>
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isRecurring ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </button>

                {/* Recurring detail */}
                {isRecurring && dueDay && (
                  <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium text-primary">
                          매월 {dueDay}일에 반복 등록됩니다
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          저장 시 고정 지출로도 함께 등록돼 예산 탭에서 확인할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t border-border p-4 safe-bottom">
          {errorMsg && (
            <p className="mb-2 text-xs text-expense bg-expense/10 rounded-xl px-3 py-2">{errorMsg}</p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!amount || amountNumber <= 0 || isSubmitting}
            className="w-full h-12 rounded-xl text-base font-semibold bg-primary text-primary-foreground"
          >
            {isSubmitting
              ? '저장 중...'
              : existing
                ? '수정하기'
                : isRecurring
                  ? '저장 + 반복 등록'
                  : '저장하기'}
          </Button>
        </div>
      </div>
    </div>
  )
}
