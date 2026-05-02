import { StarIcon } from "@phosphor-icons/react/dist/ssr"
import { langColor, type GitHubRepo } from "@/lib/github"

export function RepoList({
  title,
  id,
  repos,
}: {
  title: string
  id: string
  repos: GitHubRepo[]
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2
        id={id}
        className="font-mono text-base font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>

      <ul className="flex flex-col">
        {repos.map((r, i) => (
          <li
            key={r.id}
            className={
              "py-3 font-mono text-sm" +
              (i > 0 ? " border-t border-border/40" : "")
            }
          >
            <a
              href={r.html_url}
              target="_blank"
              rel="noreferrer noopener"
              className="group/repo flex flex-col gap-1.5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-foreground transition-colors duration-150 group-hover/repo:text-hud">
                  <span className="text-muted-foreground">{r.owner.login}</span>
                  <span className="text-muted-foreground/50">/</span>
                  {r.name}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
                  <StarIcon className="size-3" weight="bold" aria-hidden />
                  <span className="tabular-nums">
                    {r.stargazers_count.toLocaleString()}
                  </span>
                </span>
              </div>
              {r.description && (
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {r.description}
                </p>
              )}
              {r.language && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <span
                    aria-hidden
                    className="inline-block size-2"
                    style={{ backgroundColor: langColor(r.language) }}
                  />
                  {r.language}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
