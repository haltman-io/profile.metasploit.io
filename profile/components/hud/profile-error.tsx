import Link from "next/link"
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr"
import type { GitHubError } from "@/lib/github"

function formatReset(resetAt: number | null): string | null {
  if (!resetAt) return null
  const diffMs = resetAt - Date.now()
  if (diffMs <= 0) return "any moment"
  const minutes = Math.ceil(diffMs / 60000)
  if (minutes < 60) return `in ~${minutes} minute${minutes === 1 ? "" : "s"}`
  const hours = Math.round(minutes / 60)
  return `in ~${hours} hour${hours === 1 ? "" : "s"}`
}

function describe(login: string, error: GitHubError) {
  switch (error.kind) {
    case "not-found":
      return {
        title: "Profile not found.",
        body: (
          <>
            No public GitHub user with the handle{" "}
            <code className="font-mono text-foreground">@{login}</code>. Check the
            spelling, or try a different one.
          </>
        ),
      }
    case "rate-limit": {
      const when = formatReset(error.resetAt)
      return {
        title: "GitHub rate limit reached.",
        body: (
          <>
            Public GitHub API allows 60 requests per hour from the same network
            without authentication.{" "}
            {when ? (
              <>
                The window resets <span className="text-foreground">{when}</span>.
              </>
            ) : (
              <>Try again later.</>
            )}
          </>
        ),
      }
    }
    case "network":
      return {
        title: "Couldn't reach GitHub.",
        body: (
          <>
            The request to{" "}
            <code className="font-mono text-foreground">api.github.com</code>{" "}
            failed. Check your connection and try again.
          </>
        ),
      }
    case "invalid-response":
      return {
        title: "GitHub returned unsafe data.",
        body: (
          <>
            The profile response did not pass the local validation rules, so it
            was blocked before rendering. Try another profile or refresh in a
            moment.
          </>
        ),
      }
    case "unknown":
      return {
        title: "Something went wrong.",
        body: (
          <>
            GitHub responded with an unexpected status (
            <span className="text-foreground">HTTP {error.status}</span>). Try again
            in a moment.
          </>
        ),
      }
  }
}

export function ProfileError({
  login,
  error,
}: {
  login: string
  error: GitHubError
}) {
  const { title, body } = describe(login, error)

  return (
    <div className="flex max-w-xl flex-col items-start gap-5 pt-8 sm:pt-12">
      <span className="font-mono text-[0.6875rem] tracking-[0.16em] uppercase text-hud">
        Error
      </span>
      <h1 className="font-mono text-2xl font-semibold leading-tight tracking-tight text-balance text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
        {body}
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 pt-2 font-mono text-sm text-foreground underline-offset-4 transition-colors duration-150 hover:text-hud hover:underline"
      >
        <ArrowLeftIcon className="size-3.5" weight="bold" aria-hidden />
        Look up another profile
      </Link>
    </div>
  )
}
