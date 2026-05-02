"use client"

import * as React from "react"

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+-=<>/"

function randChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeReduced(cb: () => void): () => void {
  const mql = window.matchMedia(REDUCED_QUERY)
  mql.addEventListener("change", cb)
  return () => mql.removeEventListener("change", cb)
}

function getReducedSnapshot(): boolean {
  return window.matchMedia(REDUCED_QUERY).matches
}

function getReducedServerSnapshot(): boolean {
  return false
}

export function DecodedText({
  text,
  duration = 800,
  delay = 0,
  className,
}: {
  text: string
  duration?: number
  delay?: number
  className?: string
}) {
  const reduced = React.useSyncExternalStore(
    subscribeReduced,
    getReducedSnapshot,
    getReducedServerSnapshot,
  )
  const [animated, setAnimated] = React.useState(text)

  React.useEffect(() => {
    if (reduced) return
    const len = text.length
    if (len === 0) return

    let raf = 0
    const start = performance.now() + delay

    function frame(now: number) {
      const elapsed = now - start
      if (elapsed < 0) {
        raf = requestAnimationFrame(frame)
        return
      }
      const progress = Math.min(1, elapsed / duration)
      const revealedCount = Math.floor(progress * len)
      let out = ""
      for (let i = 0; i < len; i++) {
        const ch = text[i]
        out += i < revealedCount || ch === " " ? ch : randChar()
      }
      setAnimated(out)
      if (progress < 1) {
        raf = requestAnimationFrame(frame)
      } else {
        setAnimated(text)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [text, duration, delay, reduced])

  const display = reduced ? text : animated
  return <span className={className}>{display}</span>
}
