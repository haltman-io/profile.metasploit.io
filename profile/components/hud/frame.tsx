import * as React from "react"
import { cn } from "@/lib/utils"

type FrameProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string
  meta?: React.ReactNode
  scan?: boolean
}

function HudFrame({ className, label, meta, scan, children, ...props }: FrameProps) {
  return (
    <div
      className={cn(
        "hud-frame",
        scan && "scanline",
        className
      )}
      {...props}
    >
      <span className="hud-corner-bl" />
      <span className="hud-corner-br" />
      {(label || meta) && (
        <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-2">
          {label ? (
            <span className="hud-label">{label}</span>
          ) : (
            <span />
          )}
          {meta && <div className="flex items-center gap-3 text-[0.625rem] tracking-[0.14em] uppercase text-muted-foreground">{meta}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

function HudDivider({ className }: { className?: string }) {
  return <div className={cn("hud-divider w-full", className)} role="separator" />
}

function HudTag({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("hud-tag", className)} {...props}>
      {children}
    </span>
  )
}

function HudLabel({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("hud-label", className)} {...props}>
      {children}
    </span>
  )
}

export { HudFrame, HudDivider, HudTag, HudLabel }
