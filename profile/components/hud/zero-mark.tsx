import * as React from "react"
import { cn } from "@/lib/utils"

export function ZeroWordmark({ className, showSuffix = true }: { className?: string; showSuffix?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline font-mono font-semibold tracking-tight text-foreground", className)}>
      <span aria-hidden="true">ZER</span>
      <span className="relative inline-block text-hud ml-[0.02em]">
        0
        <span className="absolute left-[-15%] right-[-15%] top-1/2 h-[0.08em] bg-hud -translate-y-1/2 shadow-[0_0_8px_var(--hud)]" aria-hidden="true" />
      </span>
      {showSuffix && (
        <span className="text-muted-foreground ml-1">
          <span className="text-hud">.</span>metasploit<span className="text-hud">.</span>io
        </span>
      )}
      <span className="sr-only">Zero — 0.metasploit.io</span>
    </span>
  )
}
