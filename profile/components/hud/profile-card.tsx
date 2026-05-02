"use client"

import * as React from "react"
import { gsap } from "gsap"
import {
  MapPinIcon,
  BuildingsIcon,
  LinkIcon as PhLinkIcon,
} from "@phosphor-icons/react/dist/ssr"
import {
  type GitHubUser,
  type GitHubOrg,
  blogHref,
  blogLabel,
  normalizeBlog,
} from "@/lib/github"
import { DecodedText } from "./decoded-text"

const TILT_RANGE = 16
const IDLE_RESUME_DELAY = 1500

function formatAgentId(id: number): string {
  const hex = id.toString(16).toUpperCase().padStart(8, "0")
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

function nowIsoSeconds(): string {
  return new Date().toISOString().slice(0, 19) + "Z"
}

export function ProfileCard({
  user,
  orgs,
}: {
  user: GitHubUser
  orgs: GitHubOrg[]
}) {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const idleTlRef = React.useRef<gsap.core.Timeline | null>(null)
  const idleResumeTimerRef = React.useRef<number | null>(null)
  const hoveredRef = React.useRef(false)

  const [enabled, setEnabled] = React.useState(false)
  const [timestamp, setTimestamp] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const t = window.setTimeout(() => {
      const ok =
        window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      setEnabled(ok)
      setTimestamp(nowIsoSeconds())
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  const stopIdle = React.useCallback(() => {
    idleTlRef.current?.kill()
    idleTlRef.current = null
    if (idleResumeTimerRef.current) {
      window.clearTimeout(idleResumeTimerRef.current)
      idleResumeTimerRef.current = null
    }
  }, [])

  const startIdle = React.useCallback(() => {
    if (!enabled || !cardRef.current || hoveredRef.current) return
    idleTlRef.current?.kill()
    const tl = gsap.timeline({ repeat: -1, yoyo: true })
    tl.to(cardRef.current, {
      "--rx": "1.8deg",
      "--ry": "-2deg",
      duration: 4.2,
      ease: "sine.inOut",
    }).to(cardRef.current, {
      "--rx": "-1.6deg",
      "--ry": "1.4deg",
      duration: 4.2,
      ease: "sine.inOut",
    })
    idleTlRef.current = tl
  }, [enabled])

  React.useEffect(() => {
    if (!enabled) return
    const t = window.setTimeout(startIdle, 800)
    return () => {
      window.clearTimeout(t)
      stopIdle()
    }
  }, [enabled, startIdle, stopIdle])

  function onPointerEnter() {
    hoveredRef.current = true
    stopIdle()
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || !cardRef.current) return
    if (idleTlRef.current) stopIdle()

    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rx = (0.5 - y) * TILT_RANGE
    const ry = (x - 0.5) * TILT_RANGE

    cardRef.current.style.setProperty("--mx", `${x * 100}%`)
    cardRef.current.style.setProperty("--my", `${y * 100}%`)

    gsap.to(cardRef.current, {
      "--rx": `${rx}deg`,
      "--ry": `${ry}deg`,
      duration: 0.6,
      ease: "power3.out",
      overwrite: "auto",
    })
  }

  function onPointerLeave() {
    hoveredRef.current = false
    if (!cardRef.current) return

    gsap.to(cardRef.current, {
      "--rx": "0deg",
      "--ry": "0deg",
      duration: 1.2,
      ease: "elastic.out(1, 0.5)",
      overwrite: "auto",
    })

    if (enabled) {
      if (idleResumeTimerRef.current) {
        window.clearTimeout(idleResumeTimerRef.current)
      }
      idleResumeTimerRef.current = window.setTimeout(() => {
        startIdle()
      }, IDLE_RESUME_DELAY)
    }
  }

  const displayName = user.name?.trim() || user.login
  const blog = normalizeBlog(user.blog)
  const visibleOrgs = orgs.slice(0, 8)
  const agentId = formatAgentId(user.id)

  return (
    <div className="profile-card-frame w-full max-w-[720px]">
      <div
        ref={cardRef}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="profile-card profile-card-surface relative px-6 py-6 sm:px-8 sm:py-8"
      >
        <span aria-hidden className="profile-card-corner corner-tl" />
        <span aria-hidden className="profile-card-corner corner-tr" />
        <span aria-hidden className="profile-card-corner corner-bl" />
        <span aria-hidden className="profile-card-corner corner-br" />

        <span aria-hidden className="profile-card-particles" />
        <span aria-hidden className="profile-card-shimmer" />
        <span aria-hidden className="profile-card-snake" />
        <span aria-hidden className="profile-card-spotlight" />
        <span aria-hidden className="profile-card-scan" />

        <div aria-hidden className="profile-card-status flex items-center gap-3 mb-6 relative z-20">
          <span className="profile-card-status-dot w-2 h-2 bg-hud shadow-[0_0_8px_var(--hud)] animate-pulse" />
          <span className="text-hud font-bold tracking-widest text-[0.65rem] uppercase">SECURE_LINK</span>
          <span className="profile-card-status-id text-hud/60 tracking-widest text-[0.65rem]">
            ID::{agentId}
          </span>
          {timestamp && (
            <span className="profile-card-status-id hidden md:inline text-hud/60 tracking-widest text-[0.65rem]">
              SYS.T:{timestamp}
            </span>
          )}
        </div>

        <div className="profile-card-body relative grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr] sm:gap-7">
          <div className="profile-card-avatar relative size-32 shrink-0 sm:size-36 p-1.5 border border-hud/40 bg-hud/5 group/avatar">
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-hud transition-transform duration-300 group-hover/avatar:-translate-x-1 group-hover/avatar:-translate-y-1" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-hud transition-transform duration-300 group-hover/avatar:translate-x-1 group-hover/avatar:translate-y-1" />
            
            <div className="absolute inset-1.5 overflow-hidden border border-hud/30 bg-card">
              <div className="hud-scanner absolute inset-0 pointer-events-none opacity-40 z-10">
                <div className="hud-scanner-line" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar_url}
                alt=""
                aria-hidden
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
                className="size-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-500 opacity-90 group-hover/avatar:opacity-100"
              />
            </div>
          </div>

          <div className="profile-card-info flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[0.55rem] text-hud uppercase tracking-widest border-b border-hud/30 pb-px">{"// TARGET_NAME"}</span>
              </div>
              <h1 className="truncate font-mono text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl uppercase hud-glow-text">
                <span
                  className="profile-card-glitch"
                  data-text={displayName}
                >
                  <DecodedText text={displayName} duration={900} />
                </span>
              </h1>
              <a
                href={user.html_url}
                target="_blank"
                rel="noreferrer noopener"
                className="self-start font-mono text-sm text-hud underline-offset-4 transition-colors duration-150 hover:text-hud-glow relative group/link"
              >
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-hud/50 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left duration-200" />
                <DecodedText text={`@${user.login}`} duration={650} delay={250} />
              </a>
            </div>

            {user.bio && (
              <div className="relative mt-2 p-3 border-l-2 border-hud bg-card/10 backdrop-blur-sm">
                <span className="absolute top-0 left-0 w-2 h-[2px] bg-hud" />
                <span className="absolute bottom-0 left-0 w-2 h-[2px] bg-hud" />
                <p className="line-clamp-3 font-mono text-sm leading-relaxed text-foreground/90">
                  {user.bio}
                </p>
              </div>
            )}

            {(user.location || user.company || blog) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs text-muted-foreground">
                {user.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinIcon
                      className="size-3.5"
                      weight="bold"
                      aria-hidden
                    />
                    {user.location}
                  </span>
                )}
                {user.company && (
                  <span className="inline-flex items-center gap-1.5">
                    <BuildingsIcon
                      className="size-3.5"
                      weight="bold"
                      aria-hidden
                    />
                    {user.company}
                  </span>
                )}
                {blog && (
                  <a
                    href={blogHref(blog)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 underline-offset-4 transition-colors duration-150 hover:text-hud hover:underline"
                  >
                    <PhLinkIcon
                      className="size-3.5"
                      weight="bold"
                      aria-hidden
                    />
                    {blogLabel(blog)}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <dl className="profile-card-stats relative mt-8 grid grid-cols-4 gap-4 border-t border-hud/20 pt-6">
          <div className="absolute top-0 left-0 w-16 h-[2px] bg-hud/50" />
          <Stat label="FLWR" value={user.followers} />
          <Stat label="FLWG" value={user.following} />
          <Stat label="REPO" value={user.public_repos} />
          <Stat label="GIST" value={user.public_gists} />
        </dl>

        {visibleOrgs.length > 0 && (
          <div className="profile-card-orgs relative mt-8 flex flex-wrap items-center gap-4 border-t border-hud/20 pt-6">
            <div className="absolute top-0 right-0 w-16 h-[2px] bg-hud/50" />
            <span className="font-mono text-[0.65rem] tracking-[0.16em] uppercase text-hud border border-hud/30 px-2 py-1 bg-hud/10">
              ORGS_LINKED
            </span>
            <ul className="flex flex-wrap gap-2">
              {visibleOrgs.map((o) => (
                <li key={o.id}>
                  <a
                    href={`https://github.com/${o.login}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={`@${o.login}`}
                    aria-label={`@${o.login}`}
                    className="group block size-8 overflow-hidden border border-hud/40 bg-card transition-colors duration-200 hover:border-hud hover:shadow-[0_0_8px_var(--hud)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={o.avatar_url}
                      alt=""
                      aria-hidden
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  const [display, setDisplay] = React.useState(0)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = window.setTimeout(() => setDisplay(value), 0)
      return () => window.clearTimeout(t)
    }
    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: value,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => setDisplay(Math.round(obj.v)),
      onComplete: () => setDisplay(value),
    })
    return () => {
      tween.kill()
    }
  }, [value])

  return (
    <div className="flex flex-col gap-1 p-2 bg-hud/5 border border-hud/10 relative group">
      <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-hud/50 group-hover:border-hud transition-colors" />
      <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-hud/50 group-hover:border-hud transition-colors" />
      <dt className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-hud/70 group-hover:text-hud transition-colors">
        {label}
      </dt>
      <dd className="font-mono text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl group-hover:text-hud-glow transition-colors">
        {display.toLocaleString()}
      </dd>
    </div>
  )
}
