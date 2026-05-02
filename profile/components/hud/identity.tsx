import {
  MapPinIcon,
  BuildingsIcon,
  LinkIcon as PhLinkIcon,
  CalendarIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr"
import {
  type GitHubUser,
  blogHref,
  blogLabel,
  joinedYear,
  normalizeBlog,
} from "@/lib/github"

export function Identity({ user }: { user: GitHubUser }) {
  const displayName = user.name?.trim() || user.login
  const blog = normalizeBlog(user.blog)

  return (
    <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-[auto_1fr]">
      <div className="relative size-32 sm:size-40 md:size-48 shrink-0 hud-frame p-2 group bg-card/5">
        <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-hud transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" />
        <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-hud transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
        <span className="absolute top-2 right-2 text-[0.5rem] text-hud font-mono opacity-50 z-20">OBJ.IMG</span>
        <div className="relative size-full overflow-hidden border border-hud/30 bg-card">
          <div className="hud-scanner absolute inset-0 pointer-events-none opacity-50 z-10">
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
            className="size-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-500 opacity-80 group-hover:opacity-100"
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 justify-center">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3 opacity-80">
            <span className="hud-tag text-[0.6rem] bg-hud/20">ID:{user.id}</span>
            <span className="text-[0.65rem] text-hud uppercase tracking-widest border-b border-hud/30 pb-0.5">{"// TARGET_DATA"}</span>
          </div>
          <h1 className="font-mono text-3xl font-bold leading-none tracking-tight text-balance text-foreground sm:text-5xl uppercase">
            {displayName}
          </h1>
          
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 font-mono text-xs sm:text-sm text-muted-foreground">
            <a
              href={user.html_url}
              target="_blank"
              rel="noreferrer noopener"
              className="group relative inline-flex items-center gap-1.5 text-hud transition-colors duration-200 hover:text-hud-glow px-1 py-0.5"
            >
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-hud/40 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
              <span className="opacity-50">@</span>
              <span className="font-bold">{user.login}</span>
            </a>
            
            <div className="w-px h-3 bg-hud/30 hidden sm:block" />
            
            <span className="inline-flex items-center gap-2 px-2 py-1 border border-hud/20 bg-hud/5">
              <span className="text-[0.6rem] uppercase tracking-wider opacity-60">FLWR</span>
              <span className="text-hud font-bold text-sm tabular-nums">{user.followers.toLocaleString()}</span>
            </span>
            <span className="inline-flex items-center gap-2 px-2 py-1 border border-hud/20 bg-hud/5">
              <span className="text-[0.6rem] uppercase tracking-wider opacity-60">FLWG</span>
              <span className="text-hud font-bold text-sm tabular-nums">{user.following.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {user.bio && (
          <div className="relative mt-2 p-4 border-l-2 border-hud bg-card/5 backdrop-blur-sm shadow-[inset_1px_0_0_0_color-mix(in_oklab,var(--hud)_20%,transparent)]">
            <span className="absolute top-0 left-0 w-2 h-[2px] bg-hud" />
            <span className="absolute bottom-0 left-0 w-2 h-[2px] bg-hud" />
            <p className="font-mono text-sm leading-relaxed text-foreground/90 sm:text-base">
              {user.bio}
            </p>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 font-mono text-xs text-muted-foreground sm:text-sm border-t border-hud/20 pt-4 relative">
          <div className="absolute top-0 right-0 w-12 h-1 bg-hud/20" />
          
          {user.company && (
            <span className="inline-flex items-center gap-2 group cursor-default">
              <BuildingsIcon className="size-4 text-hud/50 group-hover:text-hud transition-colors" weight="bold" aria-hidden />
              <span className="group-hover:text-foreground transition-colors">{user.company}</span>
            </span>
          )}
          {user.location && (
            <span className="inline-flex items-center gap-2 group cursor-default">
              <MapPinIcon className="size-4 text-hud/50 group-hover:text-hud transition-colors" weight="bold" aria-hidden />
              <span className="group-hover:text-foreground transition-colors">{user.location}</span>
            </span>
          )}
          {blog && (
            <a
              href={blogHref(blog)}
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-foreground"
            >
              <PhLinkIcon className="size-4 text-hud/50 group-hover:text-hud transition-colors" weight="bold" aria-hidden />
              <span className="border-b border-transparent group-hover:border-hud/50 transition-colors pb-px">{blogLabel(blog)}</span>
            </a>
          )}
          {user.twitter_username && (
            <a
              href={`https://x.com/${user.twitter_username}`}
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-foreground"
            >
              <XLogoIcon className="size-4 text-hud/50 group-hover:text-hud transition-colors" weight="bold" aria-hidden />
              <span className="border-b border-transparent group-hover:border-hud/50 transition-colors pb-px">{user.twitter_username}</span>
            </a>
          )}
          <span className="inline-flex items-center gap-2 px-2 py-1 bg-hud/10 border border-hud/20 text-hud">
            <CalendarIcon className="size-4" weight="bold" aria-hidden />
            <span className="uppercase text-[0.65rem] tracking-wider text-hud/70">Joined</span>
            <span className="tabular-nums font-bold text-sm">{joinedYear(user.created_at)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
