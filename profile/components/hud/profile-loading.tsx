export function ProfileLoading({ login }: { login: string }) {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-[auto_1fr]">
        <div className="size-24 animate-pulse border border-border/50 bg-card sm:size-28 md:size-32" />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="h-9 w-48 animate-pulse bg-card sm:h-10 sm:w-64" />
            <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="text-hud">@{login}</span>
              <span aria-hidden className="text-muted-foreground/40">·</span>
              <span className="h-4 w-24 animate-pulse bg-card" />
            </div>
          </div>

          <div className="flex max-w-2xl flex-col gap-2">
            <div className="h-4 w-full animate-pulse bg-card" />
            <div className="h-4 w-2/3 animate-pulse bg-card" />
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span className="h-4 w-24 animate-pulse bg-card" />
            <span className="h-4 w-32 animate-pulse bg-card" />
            <span className="h-4 w-28 animate-pulse bg-card" />
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-12 sm:pt-14">
        <div className="mb-5 h-5 w-40 animate-pulse bg-card" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-32 animate-pulse flex-col gap-3 border border-border/50 bg-card/40 p-4"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
