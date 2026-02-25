'use client'

import { useMemo, useState } from 'react'
import { Pencil, RotateCcw, Plus, X, Trash2 } from 'lucide-react'
import { useCategories, useTransactions, useFixedExpenses } from '@/hooks/use-data'
import { CategoryIcon } from '@/components/category-icon'
import { formatCurrency, getBudgetStatus, getBudgetColor } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { mutate } from 'swr'
import type { Category } from '@/lib/types'

interface BudgetViewProps {
  year: number
  month: number
}

const CATEGORY_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#6B7280', '#78716C',
]


export function BudgetView({ year, month }: BudgetViewProps) {
  const { data: categories } = useCategories()
  const { data: transactions } = useTransactions(year, month)
  const { data: fixedExpenses } = useFixedExpenses()
  const [isEditing, setIsEditing] = useState(false)
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const enterEditMode = () => {
    if (!categories) return
    const draft: Record<string, string> = {}
    categories.forEach(c => {
      draft[c.id] = c.budget_amount > 0 ? String(c.budget_amount) : ''
    })
    setBudgetDraft(draft)
    setIsEditing(true)
  }

  const resetAll = () => {
    if (!categories) return
    const draft: Record<string, string> = {}
    categories.forEach(c => { draft[c.id] = '' })
    setBudgetDraft(draft)
  }

  const handleDeleteBudget = async (catId: string) => {
    const supabase = createClient()
    await supabase.from('categories').update({ budget_amount: 0 }).eq('id', catId)
    await mutate('categories')
  }

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`'${cat.name}' 카테고리를 삭제하시겠습니까?\n관련 지출 내역은 카테고리 없음으로 처리됩니다.`)) return
    const supabase = createClient()
    await supabase.from('categories').delete().eq('id', cat.id)
    await mutate('categories')
  }

  const saveAll = async () => {
    if (!categories) return
    setIsSaving(true)
    const supabase = createClient()

    for (const cat of categories) {
      const newBudget = Number(budgetDraft[cat.id] || 0)
      if (newBudget !== cat.budget_amount) {
        await supabase
          .from('categories')
          .update({ budget_amount: newBudget })
          .eq('id', cat.id)
      }
    }

    await mutate('categories')
    setIsEditing(false)
    setIsSaving(false)
  }

  const budgetCategories = useMemo(() => {
    if (!categories) return []
    return categories.filter(c => c.budget_amount > 0)
  }, [categories])

  const spendingByCategory = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      ?.filter(t => t.type === 'expense')
      .forEach(t => {
        if (t.category_id) {
          const cur = map.get(t.category_id) || 0
          map.set(t.category_id, cur + t.amount)
        }
      })
    return map
  }, [transactions])

  const totalBudget = budgetCategories.reduce((s, c) => s + c.budget_amount, 0)
  const totalSpent = budgetCategories.reduce((s, c) => s + (spendingByCategory.get(c.id) || 0), 0)
  const totalRemaining = totalBudget - totalSpent

  const activeFixedExpenses = fixedExpenses?.filter(fe => fe.is_active) || []
  const totalFixed = activeFixedExpenses.reduce((s, fe) => s + fe.amount, 0)

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="bg-primary px-4 pb-5 pt-4">
        <h2 className="mb-3 text-lg font-bold text-primary-foreground">
          {month + 1}월 예산 현황
        </h2>
        <div className="rounded-xl bg-primary-foreground/10 p-4">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-primary-foreground/60">총 예산</span>
            <span className="text-sm font-bold text-primary-foreground">{formatCurrency(totalBudget)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-primary-foreground/60">총 지출</span>
            <span className="text-sm font-bold text-primary-foreground">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="h-px bg-primary-foreground/20 my-2" />
          <div className="flex justify-between">
            <span className="text-xs text-primary-foreground/60">남은 예산</span>
            <span className={`text-base font-bold ${totalRemaining >= 0 ? 'text-primary-foreground' : 'text-red-300'}`}>
              {formatCurrency(Math.abs(totalRemaining))}
              {totalRemaining < 0 && ' 초과'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">카테고리별 예산</h3>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={enterEditMode}
              className="h-8 gap-1 text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="text-xs">수정</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="h-8 gap-1 text-destructive text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                전체 초기화
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-8 text-xs text-muted-foreground"
              >
                취소
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-muted-foreground">
              각 카테고리의 월 예산 금액을 입력하세요. 0원 또는 빈칸은 예산 미설정입니다.
            </p>
            {categories?.map(cat => (
              <div key={cat.id} className="rounded-xl bg-card p-3 shadow-sm border border-border">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <CategoryIcon iconName={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-card-foreground">{cat.name}</span>
                  <div className="relative w-28 shrink-0">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="미설정"
                      value={budgetDraft[cat.id] || ''}
                      onChange={e => setBudgetDraft(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      className="h-9 rounded-xl pr-6 text-right text-sm font-medium"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">원</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-1">
              <Button
                onClick={saveAll}
                disabled={isSaving}
                className="h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-6"
              >
                {isSaving ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {budgetCategories.map(cat => {
              const spent = spendingByCategory.get(cat.id) || 0
              const remaining = cat.budget_amount - spent
              const percentage = cat.budget_amount > 0 ? Math.min((spent / cat.budget_amount) * 100, 100) : 0
              const status = getBudgetStatus(spent, cat.budget_amount)
              const barColor = getBudgetColor(status)

              return (
                <div key={cat.id} className="rounded-xl bg-card p-4 shadow-sm border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <CategoryIcon
                        iconName={cat.icon}
                        className="h-4 w-4"
                        style={{ color: cat.color }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold text-card-foreground">{cat.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        예산 {formatCurrency(cat.budget_amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${remaining >= 0 ? 'text-card-foreground' : 'text-expense'}`}>
                          {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {remaining >= 0 ? '남음' : '초과'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteBudget(cat.id)}
                        className="ml-1 p-1 rounded-lg hover:bg-secondary transition-colors"
                        aria-label="예산 삭제"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-[10px] text-muted-foreground">{formatCurrency(spent)} 사용</span>
                    <span className="text-[10px] text-muted-foreground">{Math.round(percentage)}%</span>
                  </div>
                </div>
              )
            })}
            {budgetCategories.length === 0 && (
              <div className="rounded-xl bg-card p-6 text-center border border-border">
                <p className="text-sm text-muted-foreground mb-3">설정된 예산이 없습니다</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enterEditMode}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">예산 설정하기</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Management */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">카테고리 관리</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditingCategory(null); setShowCategoryForm(true) }}
            className="h-8 gap-1 text-primary"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">추가</span>
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {categories?.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm border border-border">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: cat.color + '20' }}
              >
                <CategoryIcon iconName={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-card-foreground">{cat.name}</span>
              <div className="flex gap-0.5 shrink-0">
                <button
                  onClick={() => { setEditingCategory(cat); setShowCategoryForm(true) }}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="카테고리 수정"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="카테고리 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
          {(!categories || categories.length === 0) && (
            <div className="rounded-xl bg-card p-6 text-center border border-border">
              <p className="text-sm text-muted-foreground">카테고리가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Expenses */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">고정 지출</h3>
          <span className="text-xs text-muted-foreground">월 {formatCurrency(totalFixed)}</span>
        </div>
        <div className="flex flex-col gap-2">
          {activeFixedExpenses.map(fe => (
            <div key={fe.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm border border-border">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: (fe.categories?.color || '#6B7280') + '20' }}
              >
                <CategoryIcon
                  iconName={fe.categories?.icon || 'circle'}
                  className="h-4 w-4"
                  style={{ color: fe.categories?.color || '#6B7280' }}
                />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-card-foreground">{fe.description}</span>
                <span className="text-[11px] text-muted-foreground">
                  매월 {fe.due_day}일{fe.payment_methods ? ` · ${fe.payment_methods.name}` : ''}
                </span>
              </div>
              <span className="text-sm font-bold text-card-foreground">{formatCurrency(fe.amount)}</span>
            </div>
          ))}
          {activeFixedExpenses.length === 0 && (
            <div className="rounded-xl bg-card p-6 text-center border border-border">
              <p className="text-sm text-muted-foreground">등록된 고정 지출이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <CategoryForm
          existing={editingCategory ?? undefined}
          onClose={() => { setShowCategoryForm(false); setEditingCategory(null) }}
        />
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────── */
/*  CategoryForm — add / edit a category                      */
/* ────────────────────────────────────────────────────────── */

interface CategoryFormProps {
  existing?: Category
  onClose: () => void
}

function CategoryForm({ existing, onClose }: CategoryFormProps) {
  const [name, setName] = useState(existing?.name || '')
  const [icon, setIcon] = useState(existing?.icon || '✨')
  const [color, setColor] = useState(existing?.color || '#6B7280')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setIsSubmitting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSubmitting(false); return }

    if (existing) {
      await supabase
        .from('categories')
        .update({ name: name.trim(), icon, color })
        .eq('id', existing.id)
    } else {
      await supabase.from('categories').insert({
        user_id: user.id,
        name: name.trim(),
        icon,
        color,
        budget_amount: 0,
        is_default: false,
      })
    }

    await mutate('categories')
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative z-10 mx-auto w-full max-w-lg rounded-t-2xl bg-card max-h-[88vh] overflow-y-auto no-scrollbar">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
            <h3 className="text-base font-bold text-card-foreground">
              {existing ? '카테고리 수정' : '카테고리 추가'}
            </h3>
            <div className="w-5" />
          </div>

          <div className="flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">카테고리 이름</Label>
              <Input
                placeholder="예: 교통비"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11 rounded-xl text-card-foreground"
                autoFocus
              />
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">색상</Label>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORY_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Emoji icon picker */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">아이콘 (이모지)</Label>

              {/* Direct input row */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl select-none"
                  style={{ backgroundColor: color + '20' }}
                >
                  {icon || '?'}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    placeholder="이모지 직접 입력"
                    value={icon}
                    onChange={e => {
                      const chars = [...e.target.value]
                      // keep only the last grapheme (the most recent emoji typed)
                      setIcon(chars.slice(-1).join('') || '')
                    }}
                    className="h-10 rounded-xl text-card-foreground text-center text-lg"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    키보드 이모지 버튼으로 입력하거나 아래에서 선택하세요
                  </p>
                </div>
              </div>

            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: color + '25' }}
              >
                {icon || '?'}
              </div>
              <span className="text-sm font-semibold text-card-foreground">
                {name.trim() || '카테고리 이름'}
              </span>
            </div>

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
