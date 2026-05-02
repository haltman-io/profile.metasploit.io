import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr"
import type { GitHubMiniUser } from "@/lib/github"

export function UsersGrid({
  title,
  id,
  users,
  total,
  viewAllHref,
}: {
  title: string
  id: string
  users: GitHubMiniUser[]
  total: number
  viewAllHref: string
}) {
  const showAllLink = total > users.length
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id={id}
          className="font-mono text-base font-semibold tracking-tight text-foreground"
        >
          {title}{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            {total.toLocaleString()}
          </span>
        </h2>
        {showAllLink && (
          <a
            href={viewAllHref}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-hud hover:underline"
          >
            View all on GitHub
            <ArrowUpRightIcon className="size-3" weight="bold" aria-hidden />
          </a>
        )}
      </div>

      <ul className="flex flex-wrap gap-2">
        {users.map((u) => (
          <li key={u.id}>
            <a
              href={u.html_url}
              target="_blank"
              rel="noreferrer noopener"
              title={`@${u.login}`}
              aria-label={`@${u.login}`}
              className="block size-9 overflow-hidden border border-border/60 bg-card transition-colors duration-150 hover:border-hud"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u.avatar_url}
                alt=""
                aria-hidden
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
