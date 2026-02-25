export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000)
    const remainder = amount % 10000
    if (remainder === 0) return `${man}만`
    return `${man}만${new Intl.NumberFormat('ko-KR').format(remainder)}`
  }
  return new Intl.NumberFormat('ko-KR').format(amount)
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameDay(d1: string, d2: string): boolean {
  return d1 === d2
}

export function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = getDaysInMonth(year, month)
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
export function getWeekdayName(dayIndex: number): string {
  return WEEKDAY_NAMES[dayIndex]
}

export function getBudgetStatus(spent: number, budget: number): 'safe' | 'warning' | 'danger' {
  if (budget === 0) return 'safe'
  const ratio = spent / budget
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.7) return 'warning'
  return 'safe'
}

export function getBudgetColor(status: 'safe' | 'warning' | 'danger'): string {
  switch (status) {
    case 'safe': return 'bg-primary'
    case 'warning': return 'bg-warning'
    case 'danger': return 'bg-destructive'
  }
}
