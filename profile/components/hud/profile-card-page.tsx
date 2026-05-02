"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr"
import { ThemeToggle } from "./theme-toggle"
import { ProfileCard } from "./profile-card"
import { ProfileError } from "./profile-error"
import {
  fetchCardData,
  normalizeLookupLogin,
  type CardPayload,
  type GitHubError,
} from "@/lib/github"

type State =
  | { status: "loading" }
  | { status: "success"; data: CardPayload }
  | { status: "error"; error: GitHubError }

export function ProfileCardPage({ username }: { username: string }) {
  const login = normalizeLookupLogin(username)
  const [state, setState] = React.useState<State>({ status: "loading" })
  const [showTitle, setShowTitle] = React.useState(true)
  const [showButtons, setShowButtons] = React.useState(true)
  const [menuOpen, setMenuOpen] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    const ac = new AbortController()

    const reset = window.setTimeout(() => {
      if (!cancelled) setState({ status: "loading" })
    }, 0)

    fetchCardData(login, ac.signal)
      .then((res) => {
        if (cancelled) return
        window.clearTimeout(reset)
        if ("error" in res) setState({ status: "error", error: res.error })
        else setState({ status: "success", data: res })
      })
      .catch((e: unknown) => {
        if ((e as Error).name === "AbortError") return
        if (cancelled) return
        window.clearTimeout(reset)
        setState({ status: "error", error: { kind: "network" } })
      })

    return () => {
      cancelled = true
      window.clearTimeout(reset)
      ac.abort()
    }
  }, [login])

  return (
    <main
      id="main"
      className="relative flex min-h-svh flex-col items-stretch px-4 py-6 sm:px-6 sm:py-8"
    >
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="fixed top-6 left-6 z-50 flex flex-col items-start gap-2">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="border border-hud/40 bg-card/10 backdrop-blur-md px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest text-hud transition-colors hover:bg-hud/20"
        >
          {menuOpen ? "[-] UI_CONTROLS" : "[+] UI_CONTROLS"}
        </button>
        
        {menuOpen && (
          <div className="border border-hud/20 bg-card/40 backdrop-blur-md p-4 flex flex-col gap-4 min-w-[200px]">
            <label className="flex items-center justify-between gap-4 cursor-pointer group">
              <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground group-hover:text-hud transition-colors">SHOW_TITLE</span>
              <input 
                type="checkbox" 
                checked={showTitle} 
                onChange={(e) => setShowTitle(e.target.checked)}
                className="appearance-none w-8 h-4 border border-hud/40 bg-card/50 checked:bg-hud relative transition-colors cursor-pointer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-2.5 after:h-2.5 after:bg-hud after:transition-transform checked:after:bg-black checked:after:translate-x-4"
              />
            </label>
            <label className="flex items-center justify-between gap-4 cursor-pointer group">
              <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground group-hover:text-hud transition-colors">SHOW_BUTTONS</span>
              <input 
                type="checkbox" 
                checked={showButtons} 
                onChange={(e) => setShowButtons(e.target.checked)}
                className="appearance-none w-8 h-4 border border-hud/40 bg-card/50 checked:bg-hud relative transition-colors cursor-pointer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-2.5 after:h-2.5 after:bg-hud after:transition-transform checked:after:bg-black checked:after:translate-x-4"
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-16 relative z-10 w-full">
        {showTitle && (
          <div className="mb-14 w-full max-w-[720px] text-left flex flex-col items-start transition-opacity duration-300">
            <div className="text-hud text-[0.65rem] uppercase tracking-widest font-mono opacity-80 mb-3 border-l-2 border-hud pl-2">
              {"// SECURE_TERMINAL_ACCESS"}
            </div>
            <Link
              href="/"
              className="group relative inline-flex items-center font-mono text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground transition-colors duration-200"
            >
              <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-hud scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              <span className="text-hud group-hover:drop-shadow-[0_0_12px_var(--hud)] transition-all">0</span>
              <span className="group-hover:text-hud transition-colors">.metasploit.io</span>
              <span className="text-muted-foreground/40 font-normal ml-1">/c/{login}</span>
              <span className="w-3 h-6 bg-hud ml-3 animate-pulse opacity-80" />
            </Link>
          </div>
        )}

        {state.status === "loading" && <CardSkeleton login={login} />}
        {state.status === "error" && (
          <ProfileError login={login} error={state.error} />
        )}
        {state.status === "success" && (
          <>
            <ProfileCard user={state.data.user} orgs={state.data.orgs} />
            {showButtons && (
              <div className="mt-14 flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full max-w-[720px] transition-opacity duration-300">
                <CopyUrlButton />
                
                <Link
                  href={`/p/${state.data.user.login}`}
                  className="group relative inline-flex items-center justify-center gap-2 border border-border/40 bg-card/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all duration-200 hover:border-hud/50 hover:bg-hud/5 hover:text-hud w-full sm:w-auto"
                >
                  <span className="absolute top-0 right-0 w-2 h-px bg-hud/50 group-hover:w-full transition-all duration-300" />
                  <span className="absolute bottom-0 left-0 w-2 h-px bg-hud/50 group-hover:w-full transition-all duration-300" />
                  <span className="w-1.5 h-1.5 border border-hud/50 group-hover:bg-hud transition-colors" />
                  FULL_PROFILE
                  <ArrowUpRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" weight="bold" aria-hidden />
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <div className="w-full mx-auto mt-auto pt-16 pb-2 flex justify-center">
        <a 
          href="https://haltman.io" 
          target="_blank" 
          rel="noreferrer noopener"
          className="group flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-hud"
        >
          <span className="w-1.5 h-1.5 bg-hud/20 group-hover:bg-hud group-hover:shadow-[0_0_8px_var(--hud)] transition-all" />
          <span>
            Powered by <span className="font-bold text-foreground/80 group-hover:text-hud transition-colors">Haltman.IO</span>
          </span>
          <span className="w-1.5 h-1.5 bg-hud/20 group-hover:bg-hud group-hover:shadow-[0_0_8px_var(--hud)] transition-all" />
        </a>
      </div>
    </main>
  )
}

function CardSkeleton({ login }: { login: string }) {
  return (
    <div className="profile-card-shell relative w-full max-w-[720px] border border-hud/20 bg-card/5 p-6 sm:p-8">
      <span aria-hidden className="absolute -top-px -left-px size-5 border-t-2 border-l-2 border-hud" />
      <span aria-hidden className="absolute -top-px -right-px size-5 border-t-2 border-r-2 border-hud" />
      <span aria-hidden className="absolute -bottom-px -left-px size-5 border-b-2 border-l-2 border-hud" />
      <span aria-hidden className="absolute -bottom-px -right-px size-5 border-b-2 border-r-2 border-hud" />
      <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-screen dot-noise" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr] sm:gap-7 relative z-10">
        <div className="size-32 animate-pulse border border-hud/40 bg-hud/5 sm:size-36 flex items-center justify-center">
           <div className="w-10 h-px bg-hud/50" />
           <div className="h-10 w-px bg-hud/50 absolute" />
        </div>
        <div className="flex flex-col gap-4 justify-center">
          <div className="h-8 w-64 animate-pulse bg-hud/20" />
          <div className="font-mono text-xs tracking-widest text-hud uppercase animate-pulse">
            OBJ::{login} {"// LOADING"}
          </div>
          <div className="h-5 w-full animate-pulse bg-hud/10" />
          <div className="h-5 w-2/3 animate-pulse bg-hud/10" />
        </div>
      </div>
    </div>
  )
}

function CopyUrlButton() {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group relative inline-flex items-center justify-center gap-2 border border-hud/40 bg-hud/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-foreground transition-all duration-200 hover:border-hud hover:bg-hud hover:text-primary-foreground hover:shadow-[0_0_15px_color-mix(in_oklab,var(--hud)_40%,transparent)] w-full sm:w-auto"
    >
      <span className="absolute left-0 top-0 w-1.5 h-1.5 bg-hud opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute right-0 bottom-0 w-1.5 h-1.5 bg-hud opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {copied ? (
        <>
          <span className="text-primary-foreground">{"[ OK ]"}</span>
          LINK_COPIED
        </>
      ) : (
        <>
          <span className="text-hud group-hover:text-primary-foreground transition-colors">{"//"}</span>
          COPY_URL
        </>
      )}
    </button>
  )
}
