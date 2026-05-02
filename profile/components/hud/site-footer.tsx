import { GithubLogoIcon, EnvelopeSimpleIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

export function SiteFooter() {
  return (
    <footer className="relative flex flex-col gap-6 border-t border-hud/20 py-8 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="absolute top-0 right-0 w-1/4 h-[1px] bg-hud/60" />
      <div className="absolute -top-[2px] right-0 w-1 h-1 bg-hud" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-hud/30" />
      
      <p className="flex items-center flex-wrap gap-x-1 gap-y-2">
        <span className="group relative flex items-center text-foreground transition-colors duration-200 hover:text-hud-glow">
          <span className="text-hud group-hover:text-hud-glow transition-colors">0</span>.metasploit.io
        </span>
        <span className="text-hud/50 mx-1">{"//"}</span>
        <span>built by</span>
        <a
          href="https://haltman.io"
          target="_blank"
          rel="noreferrer noopener"
          className="relative text-foreground transition-colors duration-200 hover:text-hud group px-1"
        >
          <span className="relative z-10">Haltman.IO</span>
          <span className="absolute bottom-0 left-0 w-full h-px bg-hud/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
        </a>
        <span className="text-hud/50 mx-1">{"//"}</span>
        <span>Free, open-source, no tracking.</span>
      </p>

      <nav aria-label="Footer" className="flex flex-wrap items-center gap-4 sm:gap-6">
        <a
          href="https://github.com/haltman-io/profile.metasploit.io"
          target="_blank"
          rel="noreferrer noopener"
          className="group flex items-center gap-2 border border-transparent px-2 py-1 transition-all duration-200 hover:border-hud/30 hover:bg-hud/5 hover:text-hud"
        >
          <GithubLogoIcon className="size-3.5 group-hover:drop-shadow-[0_0_8px_var(--hud)] transition-all" weight="bold" aria-hidden />
          <span>Source</span>
        </a>
        <a
          href="mailto:root@haltman.io"
          className="group flex items-center gap-2 border border-transparent px-2 py-1 transition-all duration-200 hover:border-hud/30 hover:bg-hud/5 hover:text-hud"
        >
          <EnvelopeSimpleIcon className="size-3.5 group-hover:drop-shadow-[0_0_8px_var(--hud)] transition-all" weight="bold" aria-hidden />
          <span>root@haltman.io</span>
        </a>
        <a
          href="https://haltman.io/join/"
          target="_blank"
          rel="noreferrer noopener"
          className="group flex items-center gap-1.5 border border-hud/40 bg-hud/10 px-3 py-1 text-foreground transition-all duration-200 hover:border-hud hover:bg-hud hover:text-primary-foreground hover:shadow-[0_0_12px_color-mix(in_oklab,var(--hud)_40%,transparent)]"
        >
          <span>Join</span>
          <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" weight="bold" aria-hidden />
        </a>
      </nav>
    </footer>
  )
}
