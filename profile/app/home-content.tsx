"use client"

import * as React from "react"
import gsap from "gsap"
import { EnvelopeSimpleIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr"
import { SiteHeader } from "@/components/hud/site-header"
import { SiteFooter } from "@/components/hud/site-footer"
import { SearchBox } from "@/components/hud/search-box"
import { ZeroWordmark } from "@/components/hud/zero-mark"

export function HomeContent() {
  const container = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.from(".hud-reveal", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
      })
        .from(".hud-border-draw", {
          scaleX: 0,
          opacity: 0,
          duration: 0.6,
          transformOrigin: "left center",
          ease: "power2.out"
        }, "-=0.6")
        .from(".hud-side-element", {
          x: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out"
        }, "-=0.4")

    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={container} className="relative flex min-h-svh flex-col overflow-hidden selection:bg-hud/30 selection:text-hud-glow">
      {/* Decorative ambient background for the homepage */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-10 mix-blend-screen dot-noise" />
      <div className="hud-scanner absolute inset-0 pointer-events-none opacity-20">
        <div className="hud-scanner-line" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-8 relative z-10">
        <div className="hud-reveal w-full">
          <SiteHeader />
        </div>

        <main id="main" className="flex-1 flex flex-col justify-center w-full py-12 sm:py-20">
          {/* HERO ============================================================ */}
          <section
            aria-labelledby="hero-title"
            className="relative w-full"
          >
            {/* Ambient side data (only visible on wide screens) */}
            <aside className="absolute -left-12 top-0 bottom-0 hidden lg:flex flex-col justify-center hud-side-element" aria-hidden="true">
              <div className="flex flex-col items-center gap-4 text-hud/40">
                <span className="text-[0.6rem] rotate-180 tracking-widest" style={{ writingMode: 'vertical-rl' }}>SEC_LINK_ACTIVE</span>
                <div className="w-px h-24 hud-divider-v" />
                <span className="text-[0.6rem] rotate-180 tracking-widest" style={{ writingMode: 'vertical-rl' }}>NODE_001_A</span>
              </div>
            </aside>

            <div className="hud-target relative w-full border border-hud/10 bg-card/5 backdrop-blur-sm px-6 py-10 sm:px-12 sm:py-16">
              <span className="hud-target-bl opacity-70" />
              <span className="hud-target-br opacity-70" />

              <div className="max-w-3xl">
                <h1 id="hero-title" className="flex flex-col gap-6 relative z-10 hud-reveal">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <ZeroWordmark
                      showSuffix={false}
                      className="gap-3 text-6xl leading-none tracking-[-0.04em] sm:gap-4 sm:text-[7.5rem] md:text-[8.5rem] hud-glow-text"
                    />
                    <div className="hidden sm:flex flex-col gap-1.5 mt-2">
                      <div className="hud-tag text-[0.6rem]">STATUS: ONLINE</div>
                      <div className="flex gap-2 items-center text-[0.6rem] text-hud font-mono opacity-80 pl-1">
                        <span className="w-1.5 h-1.5 bg-hud hud-pulse" /> UPLINK SECURE
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-lg font-normal leading-relaxed tracking-tight text-balance text-foreground/85 sm:text-2xl mt-2">
                    <span className="hud-type">GitHub profiles, for hackers.</span>
                    <span className="text-hud hud-blink ml-1" aria-hidden>.</span>
                  </div>
                  <span className="sr-only">
                    Zero — GitHub profiles, for hackers.
                  </span>
                </h1>

                <div className="w-full max-w-xl pt-8 sm:pt-12 hud-reveal">
                  <SearchBox />
                </div>
              </div>

              <div className="absolute right-4 bottom-4 text-[0.55rem] text-hud/40 font-mono tracking-widest hud-side-element hidden sm:block" aria-hidden="true">
                {"// REQ_DIRECT_ACCESS"}
              </div>
            </div>
          </section>

          <div className="hud-border-draw w-full h-px hud-divider my-10 sm:my-16 opacity-50" aria-hidden="true" />

          {/* ABOUT =========================================================== */}
          <section
            aria-labelledby="about-title"
            className="w-full max-w-3xl hud-reveal relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 diag-stripes opacity-5 pointer-events-none hud-side-element" aria-hidden="true" />

            <div className="flex flex-wrap items-center gap-4 mb-6 relative z-10">
              <div className="relative w-14 h-14 border border-hud bg-hud/5 p-1.5 group shrink-0 shadow-[0_0_12px_color-mix(in_oklab,var(--hud)_10%,transparent)]">
                <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-hud transition-transform duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-hud transition-transform duration-200 group-hover:translate-x-1 group-hover:translate-y-1" />
                <img src="/haltman-logo.png" alt="Haltman.IO" className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
              </div>

              <h2
                id="about-title"
                className="font-mono text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl flex items-center gap-3"
              >
                Built by{" "}
                <a
                  href="https://haltman.io"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-hud underline-offset-4 transition-colors duration-200 hover:text-hud-glow relative group"
                >
                  Haltman.IO
                  <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-hud/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
                </a>
                <span className="text-hud hud-blink" aria-hidden>.</span>
              </h2>
            </div>

            <div className="mt-6 p-5 sm:p-6 hud-frame bg-card/5 backdrop-blur-sm border-hud/20 relative group">
              <span className="hud-corner-bl opacity-40 group-hover:opacity-100 transition-opacity" />
              <span className="hud-corner-br opacity-40 group-hover:opacity-100 transition-opacity" />
              <p className="font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
                A Brazilian collective of ethical hackers. Non-profit, open-source,
                no contracts — anyone joins by showing up and contributing to free
                knowledge.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 font-mono text-sm">
              <a
                href="https://haltman.io/join/"
                target="_blank"
                rel="noreferrer noopener"
                className="group relative inline-flex items-center gap-2 border border-hud/40 bg-hud/5 px-5 py-2.5 text-foreground transition-all duration-200 hover:border-hud hover:bg-hud/15 hover:text-hud hover:shadow-[0_0_15px_color-mix(in_oklab,var(--hud)_20%,transparent)]"
              >
                <span className="absolute left-0 top-0 w-1 h-1 bg-hud opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute right-0 bottom-0 w-1 h-1 bg-hud opacity-0 group-hover:opacity-100 transition-opacity" />
                Join the collective
                <ArrowUpRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" weight="bold" aria-hidden />
              </a>
              <a
                href="mailto:root@haltman.io"
                className="inline-flex items-center gap-2 px-2 py-1 text-muted-foreground transition-colors duration-200 hover:text-hud group"
              >
                <EnvelopeSimpleIcon className="size-4 group-hover:drop-shadow-[0_0_8px_var(--hud)] transition-all" weight="bold" aria-hidden />
                <span className="border-b border-transparent group-hover:border-hud/50 transition-colors pb-0.5">root@haltman.io</span>
              </a>
            </div>
          </section>
        </main>

        <div className="hud-reveal mt-auto pt-6">
          <SiteFooter />
        </div>
      </div>
    </div>
  )
}
