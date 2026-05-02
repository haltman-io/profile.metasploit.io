import {
  StarIcon,
  GitForkIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr"
import {
  type GitHubUser,
  type Highlight,
  langColor,
  timeAgo,
} from "@/lib/github"

function RepoCard({ repo }: { repo: Highlight }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer noopener"
      className="group/repo relative flex flex-col gap-3 border border-hud/20 bg-card/5 p-4 transition-all duration-200 hover:border-hud/60 hover:bg-hud/5 hover:shadow-[inset_0_0_20px_color-mix(in_oklab,var(--hud)_10%,transparent)]"
    >
      <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-hud opacity-0 group-hover/repo:opacity-100 transition-opacity" />
      <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-hud opacity-0 group-hover/repo:opacity-100 transition-opacity" />
      <span className="absolute top-0 right-0 w-8 h-px bg-hud/40" />

      <h3 className="truncate font-mono text-sm font-bold text-foreground transition-colors duration-200 group-hover/repo:text-hud group-hover/repo:drop-shadow-[0_0_8px_var(--hud)] flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-hud/50 group-hover/repo:bg-hud transition-colors" />
        {repo.name}
      </h3>

      {repo.description && (
        <p className="line-clamp-2 font-mono text-xs leading-relaxed text-muted-foreground opacity-90">
          {repo.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground border-t border-hud/10 pt-3">
        {repo.language ? (
          <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-card/40 border border-border/40">
            <span
              aria-hidden
              className="inline-block size-1.5"
              style={{ backgroundColor: langColor(repo.language) }}
            />
            <span className="text-[0.65rem] uppercase tracking-wider">{repo.language}</span>
          </span>
        ) : (
          <span aria-hidden />
        )}
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1 group/stat">
            <StarIcon className="size-3 text-hud/50 group-hover/repo:text-hud transition-colors" weight="bold" aria-hidden />
            <span className="tabular-nums font-medium text-foreground/80 group-hover/repo:text-hud transition-colors">
              {repo.stargazers_count.toLocaleString()}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 group/stat">
            <GitForkIcon className="size-3 text-hud/50 group-hover/repo:text-hud transition-colors" weight="bold" aria-hidden />
            <span className="tabular-nums font-medium text-foreground/80 group-hover/repo:text-hud transition-colors">
              {repo.forks_count.toLocaleString()}
            </span>
          </span>
        </span>
      </div>

      <span className="font-mono text-[0.6rem] text-muted-foreground/60 uppercase tracking-widest mt-1">
        Updated <span className="text-muted-foreground/90">{timeAgo(repo.pushed_at)}</span>
      </span>
    </a>
  )
}

export function PinnedRepos({
  user,
  highlights,
}: {
  user: GitHubUser
  highlights: Highlight[]
}) {
  return (
    <section aria-labelledby="pinned-title" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hud/30 pb-2 relative">
        <div className="absolute bottom-0 left-0 w-8 h-[2px] bg-hud" />
        <h2
          id="pinned-title"
          className="font-mono text-lg font-bold tracking-widest text-foreground uppercase flex items-center gap-3"
        >
          <span className="text-hud">{"//"}</span>
          Top repositories
        </h2>
        <a
          href={`${user.html_url}?tab=repositories`}
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors duration-200 hover:text-hud"
        >
          <span className="uppercase tracking-widest text-[0.65rem]">All {user.public_repos.toLocaleString()} on GitHub</span>
          <ArrowRightIcon className="size-3 transition-transform duration-200 group-hover:translate-x-1" weight="bold" aria-hidden />
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((r) => (
          <RepoCard key={r.name} repo={r} />
        ))}
      </div>
    </section>
  )
}
