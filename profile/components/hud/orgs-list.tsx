import type { GitHubOrg } from "@/lib/github"

export function OrgsList({ orgs }: { orgs: GitHubOrg[] }) {
  return (
    <section aria-labelledby="orgs-title" className="flex flex-col gap-4">
      <h2
        id="orgs-title"
        className="font-mono text-base font-semibold tracking-tight text-foreground"
      >
        Organizations
      </h2>

      <ul className="flex flex-wrap gap-2">
        {orgs.map((o) => (
          <li key={o.id}>
            <a
              href={`https://github.com/${o.login}`}
              target="_blank"
              rel="noreferrer noopener"
              title={o.description ?? `@${o.login}`}
              className="group/org inline-flex size-9 items-center justify-center overflow-hidden border border-border/60 bg-card transition-colors duration-150 hover:border-hud"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={o.avatar_url}
                alt={o.login}
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
