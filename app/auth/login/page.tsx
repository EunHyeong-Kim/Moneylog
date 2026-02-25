'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message === 'Invalid login credentials'
            ? '이메일 또는 비밀번호가 올바르지 않습니다.'
            : error.message
          : '오류가 발생했습니다.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden p-6"
      style={{
        background: 'linear-gradient(145deg, #f3ecff 0%, #ede4ff 20%, #e0d0ff 40%, #f8f4ff 55%, #ddd0ff 70%, #efe8ff 85%, #f5f0ff 100%)',
      }}
    >
      {/* Cloud blobs */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-10%',
          left: '-15%',
          width: '65vw',
          height: '45vw',
          maxWidth: 480,
          maxHeight: 340,
          borderRadius: '60% 50% 55% 45% / 55% 60% 45% 55%',
          background: 'radial-gradient(ellipse at 40% 45%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.45) 55%, transparent 80%)',
          filter: 'blur(18px)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          top: '8%',
          right: '-20%',
          width: '55vw',
          height: '38vw',
          maxWidth: 400,
          maxHeight: 280,
          borderRadius: '50% 60% 45% 55% / 60% 45% 60% 45%',
          background: 'radial-gradient(ellipse at 55% 40%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.38) 55%, transparent 80%)',
          filter: 'blur(22px)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          top: '30%',
          left: '5%',
          width: '45vw',
          height: '30vw',
          maxWidth: 320,
          maxHeight: 210,
          borderRadius: '55% 45% 60% 40% / 45% 55% 45% 60%',
          background: 'radial-gradient(ellipse at 45% 50%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.30) 55%, transparent 80%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '10%',
          right: '-5%',
          width: '60vw',
          height: '40vw',
          maxWidth: 440,
          maxHeight: 300,
          borderRadius: '45% 60% 50% 55% / 55% 45% 60% 50%',
          background: 'radial-gradient(ellipse at 50% 55%, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.35) 55%, transparent 80%)',
          filter: 'blur(24px)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '-5%',
          left: '-10%',
          width: '50vw',
          height: '35vw',
          maxWidth: 360,
          maxHeight: 250,
          borderRadius: '60% 45% 55% 50% / 50% 60% 45% 55%',
          background: 'radial-gradient(ellipse at 40% 45%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.32) 55%, transparent 80%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Title */}
      <div className="relative mb-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold" style={{ color: '#5B3A9E', letterSpacing: '-0.03em' }}>
          Moneylog
        </h1>
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white/70 p-6 shadow-xl backdrop-blur-md border border-white/60">
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-card-foreground">
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl text-card-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-card-foreground">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl text-card-foreground"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="h-12 rounded-xl bg-primary text-primary-foreground text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>

      <p className="relative mt-6 text-xs" style={{ color: 'rgba(91,58,158,0.5)' }}>
        계정이 없으신가요? 관리자에게 문의하세요.
      </p>
    </div>
  )
}
