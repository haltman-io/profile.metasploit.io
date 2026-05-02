import {
  GitCommitIcon,
  GitPullRequestIcon,
  GitMergeIcon,
  GitForkIcon,
  StarIcon,
  PlusIcon,
  TagIcon,
  ChatCircleIcon,
  CircleDashedIcon,
  CheckCircleIcon,
  EyeIcon,
  GlobeIcon,
} from "@phosphor-icons/react/dist/ssr"
import type { Icon } from "@phosphor-icons/react"
import type { FeedItem } from "@/lib/github"
import { timeAgo } from "@/lib/github"

type Rendered = {
  Icon: Icon
  body: React.ReactNode
  url: string
}

function RepoLink({ repo, url }: { repo: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="text-hud relative inline-block transition-colors duration-200 hover:text-hud-glow font-bold group/link"
    >
      {repo}
      <span className="absolute -bottom-0.5 left-0 w-full h-[1px] bg-hud/50 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left duration-200" />
    </a>
  )
}

function render(item: FeedItem): Rendered {
  switch (item.kind) {
    case "push": {
      const branch = item.branch
      return {
        Icon: GitCommitIcon,
        url: branch
          ? `${item.repoUrl}/commits/${encodeURIComponent(branch)}`
          : item.repoUrl,
        body: (
          <>
            Pushed{" "}
            <span className="tabular-nums text-foreground">
              {item.commits}
            </span>{" "}
            commit{item.commits === 1 ? "" : "s"} to{" "}
            <RepoLink repo={item.repo} url={item.repoUrl} />
            {branch && (
              <>
                {" "}
                <span className="text-muted-foreground/70">·</span>{" "}
                <span className="text-foreground/80">{branch}</span>
              </>
            )}
          </>
        ),
      }
    }
    case "pull-request": {
      const Icon = item.action === "merged" ? GitMergeIcon : GitPullRequestIcon
      const verb =
        item.action === "merged"
          ? "Merged"
          : item.action === "closed"
            ? "Closed"
            : item.action === "reopened"
              ? "Reopened"
              : "Opened"
      return {
        Icon,
        url: item.url,
        body: (
          <>
            {verb} pull request{" "}
            <span className="tabular-nums text-foreground">#{item.number}</span>{" "}
            in <RepoLink repo={item.repo} url={`https://github.com/${item.repo}`} />
            {item.title && (
              <>
                {" "}
                <span className="text-muted-foreground/70">·</span>{" "}
                <span className="text-foreground/75">{item.title}</span>
              </>
            )}
          </>
        ),
      }
    }
    case "issue": {
      const Icon = item.action === "closed" ? CheckCircleIcon : CircleDashedIcon
      const verb =
        item.action === "closed"
          ? "Closed"
          : item.action === "reopened"
            ? "Reopened"
            : "Opened"
      return {
        Icon,
        url: item.url,
        body: (
          <>
            {verb} issue{" "}
            <span className="tabular-nums text-foreground">#{item.number}</span>{" "}
            in <RepoLink repo={item.repo} url={`https://github.com/${item.repo}`} />
            {item.title && (
              <>
                {" "}
                <span className="text-muted-foreground/70">·</span>{" "}
                <span className="text-foreground/75">{item.title}</span>
              </>
            )}
          </>
        ),
      }
    }
    case "star":
      return {
        Icon: StarIcon,
        url: item.repoUrl,
        body: (
          <>
            Starred <RepoLink repo={item.repo} url={item.repoUrl} />
          </>
        ),
      }
    case "fork":
      return {
        Icon: GitForkIcon,
        url: item.forkUrl,
        body: (
          <>
            Forked{" "}
            <RepoLink repo={item.repo} url={`https://github.com/${item.repo}`} /> to{" "}
            <RepoLink repo={item.forkRepo} url={item.forkUrl} />
          </>
        ),
      }
    case "create": {
      const target =
        item.refType === "repository"
          ? "repository"
          : `${item.refType} ${item.ref ?? ""}`.trim()
      return {
        Icon: PlusIcon,
        url: item.repoUrl,
        body: (
          <>
            Created {target} <RepoLink repo={item.repo} url={item.repoUrl} />
          </>
        ),
      }
    }
    case "release":
      return {
        Icon: TagIcon,
        url: item.url,
        body: (
          <>
            Released{" "}
            <span className="text-foreground">{item.tag}</span> on{" "}
            <RepoLink repo={item.repo} url={`https://github.com/${item.repo}`} />
          </>
        ),
      }
    case "comment": {
      const target =
        item.target === "pr"
          ? "pull request"
          : item.target === "commit"
            ? "commit"
            : "issue"
      return {
        Icon: ChatCircleIcon,
        url: item.url,
        body: (
          <>
            Commented on a {target} in{" "}
            <RepoLink repo={item.repo} url={`https://github.com/${item.repo}`} />
          </>
        ),
      }
    }
    case "review":
      return {
        Icon: EyeIcon,
        url: item.url,
        body: (
          <>
            Reviewed pull request{" "}
            <span className="tabular-nums text-foreground">#{item.number}</span>{" "}
            in <RepoLink repo={item.repo} url={`https://github.com/${item.repo}`} />
          </>
        ),
      }
    case "public":
      return {
        Icon: GlobeIcon,
        url: item.repoUrl,
        body: (
          <>
            Made <RepoLink repo={item.repo} url={item.repoUrl} /> public
          </>
        ),
      }
  }
}

export function ActivityFeed({ items }: { items: FeedItem[] }) {
  return (
    <section aria-labelledby="activity-title" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hud/30 pb-2 relative">
        <div className="absolute bottom-0 left-0 w-8 h-[2px] bg-hud" />
        <h2
          id="activity-title"
          className="font-mono text-lg font-bold tracking-widest text-foreground uppercase flex items-center gap-3"
        >
          <span className="text-hud">{"//"}</span>
          Recent activity
        </h2>
        <span className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-widest bg-hud/10 border border-hud/20 px-2 py-1">
          last <span className="tabular-nums font-bold text-hud">{items.length}</span>{" "}
          events
        </span>
      </div>

      <ol className="flex flex-col">
        {items.map((item, i) => {
          const { Icon, body } = render(item)
          return (
            <li
              key={item.id}
              className={
                "group relative grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-0.5 px-3 py-3 font-mono text-sm leading-relaxed text-muted-foreground transition-colors duration-200 hover:bg-hud/5 hover:border-transparent" +
                (i > 0 ? " border-t border-hud/10" : " border-t border-transparent")
              }
            >
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-hud scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-200" />
              <Icon
                className="size-4 text-hud/60 group-hover:text-hud group-hover:drop-shadow-[0_0_8px_var(--hud)] transition-all"
                weight="bold"
                aria-hidden
              />
              <span className="min-w-0 group-hover:text-foreground/90 transition-colors">{body}</span>
              <time
                dateTime={item.created_at}
                className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground/50 group-hover:text-hud/80 transition-colors uppercase tracking-widest"
              >
                {timeAgo(item.created_at)}
              </time>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
