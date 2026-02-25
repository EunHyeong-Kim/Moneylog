export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-lg border border-border">
        <h1 className="mb-2 text-xl font-bold text-card-foreground">오류가 발생했습니다</h1>
        {params?.error ? (
          <p className="text-sm text-muted-foreground">오류 코드: {params.error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">알 수 없는 오류가 발생했습니다.</p>
        )}
        <a
          href="/auth/login"
          className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
        >
          로그인으로 돌아가기
        </a>
      </div>
    </div>
  )
}
