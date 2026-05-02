import {
  ArrowUpRightIcon,
  ChatCircleIcon,
  FileCodeIcon,
} from "@phosphor-icons/react/dist/ssr"
import { langColor, timeAgo, type GitHubGist, type GitHubUser } from "@/lib/github"

function gistMeta(gist: GitHubGist) {
  const fileEntries = Object.values(gist.files)
  const first = fileEntries[0]
  const filename = first?.filename ?? `gist-${gist.id.slice(0, 7)}`
  const language = first?.language ?? null
  return { filename, language, fileCount: fileEntries.length }
}

function GistCard({ gist }: { gist: GitHubGist }) {
  const { filename, language, fileCount } = gistMeta(gist)
  return (
    <a
      href={gist.html_url}
      target="_blank"
      rel="noreferrer noopener"
      className="group/gist flex flex-col gap-2.5 border border-border/60 bg-card/40 p-4 transition-[border-color,background-color] duration-150 hover:border-hud/70 hover:bg-card/70"
    >
      <h3 className="flex items-center gap-2 truncate font-mono text-sm font-medium text-foreground transition-colors duration-150 group-hover/gist:text-hud">
        <FileCodeIcon className="size-3.5 shrink-0" weight="bold" aria-hidden />
        <span className="truncate">{filename}</span>
      </h3>

      {gist.description && (
        <p className="line-clamp-2 font-mono text-xs leading-relaxed text-muted-foreground">
          {gist.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
        {language ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2"
              style={{ backgroundColor: langColor(language) }}
            />
            <span>{language}</span>
          </span>
        ) : (
          <span>
            {fileCount} file{fileCount === 1 ? "" : "s"}
          </span>
        )}
        <span className="inline-flex items-center gap-3">
          {gist.comments > 0 && (
            <span className="inline-flex items-center gap-1">
              <ChatCircleIcon className="size-3" weight="bold" aria-hidden />
              <span className="tabular-nums">{gist.comments}</span>
            </span>
          )}
          <span>{timeAgo(gist.updated_at)}</span>
        </span>
      </div>
    </a>
  )
}

export function GistsList({
  user,
  gists,
}: {
  user: GitHubUser
  gists: GitHubGist[]
}) {
  return (
    <section aria-labelledby="gists-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="gists-title"
          className="font-mono text-base font-semibold tracking-tight text-foreground"
        >
          Gists{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            {user.public_gists.toLocaleString()}
          </span>
        </h2>
        {user.public_gists > gists.length && (
          <a
            href={`https://gist.github.com/${user.login}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-hud hover:underline"
          >
            All on GitHub
            <ArrowUpRightIcon className="size-3" weight="bold" aria-hidden />
          </a>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {gists.map((g) => (
          <GistCard key={g.id} gist={g} />
        ))}
      </div>
    </section>
  )
}
