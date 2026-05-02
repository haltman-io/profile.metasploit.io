"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, AtIcon } from "@phosphor-icons/react/dist/ssr"
import { normalizeLookupLogin } from "@/lib/github"

const SUGGESTIONS = ["extencil", "ohmymex", "skyperthc"]

export function SearchBox() {
  const [value, setValue] = React.useState("")
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    // Don't autofocus on touch devices — yanking up the keyboard on page load is hostile.
    if (typeof window === "undefined") return
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      inputRef.current?.focus()
    }
  }, [])

  function go(slug: string) {
    const clean = normalizeLookupLogin(slug)
    if (!clean) return
    router.push(`/p/${encodeURIComponent(clean)}`)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    go(value)
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={onSubmit}
        className="hud-frame group relative flex items-stretch bg-card/40 transition-shadow duration-200 focus-within:shadow-[0_0_0_1px_var(--hud),0_0_24px_color-mix(in_oklab,var(--hud)_22%,transparent)]"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <span
          aria-hidden
          className="flex items-center pl-4 text-hud"
        >
          <AtIcon className="size-4" weight="bold" />
        </span>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="github-username"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          inputMode="text"
          name="username"
          className="min-w-0 flex-1 bg-transparent px-3 py-3.5 font-mono text-base text-foreground caret-hud placeholder:text-muted-foreground/50 focus:outline-none sm:text-lg"
          aria-label="GitHub username"
        />

        <button
          type="submit"
          className="group/btn inline-flex items-center gap-2 border-l border-border/60 bg-hud/10 px-4 font-mono text-sm text-hud transition-colors duration-150 hover:bg-hud hover:text-primary-foreground active:translate-y-px sm:px-5"
        >
          <span>Look up</span>
          <ArrowRightIcon
            className="size-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5"
            weight="bold"
            aria-hidden
          />
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
        <span>Try</span>
        {SUGGESTIONS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              type="button"
              onClick={() => {
                setValue(s)
                go(s)
              }}
              className="text-foreground underline-offset-4 transition-colors duration-150 hover:text-hud hover:underline"
            >
              @{s}
            </button>
            {i < SUGGESTIONS.length - 1 && (
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
