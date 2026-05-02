import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-3 font-mono text-sm border-b border-hud/20 relative">
      <div className="absolute bottom-0 left-0 w-1/4 h-[1px] bg-hud/60" />
      <div className="absolute -bottom-[2px] left-0 w-1 h-1 bg-hud" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-hud/30" />
      
      <Link
        href="/"
        className="group relative flex items-center text-foreground transition-colors duration-200 hover:text-hud-glow px-2"
      >
        <span className="absolute left-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 text-hud">{"["}</span>
        <span className="relative z-10"><span className="text-hud group-hover:text-hud-glow transition-colors">0</span>.metasploit.io</span>
        <span className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 text-hud">{"]"}</span>
      </Link>
      
      <nav
        aria-label="Primary"
        className="flex items-center gap-6 text-muted-foreground"
      >
        <a
          href="https://github.com/haltman-io/profile.metasploit.io"
          target="_blank"
          rel="noreferrer noopener"
          className="hidden transition-colors duration-200 hover:text-hud sm:flex items-center gap-2 group"
        >
          <span className="text-hud/50 group-hover:text-hud transition-colors">{"//"}</span>
          <span className="border-b border-transparent group-hover:border-hud/50 pb-0.5">Source</span>
        </a>
        <a
          href="https://haltman.io"
          target="_blank"
          rel="noreferrer noopener"
          className="hidden transition-colors duration-200 hover:text-hud sm:flex items-center gap-2 group"
        >
          <span className="text-hud/50 group-hover:text-hud transition-colors">{"//"}</span>
          <span className="border-b border-transparent group-hover:border-hud/50 pb-0.5">Haltman.IO</span>
        </a>
        
        <div className="w-px h-4 bg-hud/20 hidden sm:block" />
        
        <ThemeToggle />
      </nav>
    </header>
  )
}
