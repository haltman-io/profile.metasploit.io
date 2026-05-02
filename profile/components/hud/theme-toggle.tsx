"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { SunIcon, MoonIcon } from "@phosphor-icons/react/dist/ssr"

const subscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  const isDark = mounted ? resolvedTheme === "dark" : true

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "d" && e.key !== "D") return
      const target = e.target as HTMLElement | null
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return
      if (target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      setTheme(isDark ? "light" : "dark")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isDark, setTheme])

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      aria-pressed={isDark}
      title="Toggle theme (D)"
      suppressHydrationWarning
      className={`group relative inline-flex size-8 items-center justify-center text-muted-foreground transition-all duration-200 hover:text-hud hover:bg-hud/10 hover:border-hud/30 border border-transparent ${className ?? ""}`}
    >
      <span className="absolute inset-0 border border-hud/0 group-hover:border-hud/50 transition-colors" />
      <span className="absolute top-0 left-0 w-1 h-1 bg-hud opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 right-0 w-1 h-1 bg-hud opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {isDark ? (
        <SunIcon className="size-4 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_var(--hud)] transition-all" weight="bold" aria-hidden />
      ) : (
        <MoonIcon className="size-4 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_var(--hud)] transition-all" weight="bold" aria-hidden />
      )}
    </button>
  )
}
