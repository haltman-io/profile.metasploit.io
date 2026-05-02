"use client"

import * as React from "react"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { Identity } from "./identity"
import { Languages } from "./languages"
import { PinnedRepos } from "./pinned-repos"
import { ActivityFeed } from "./activity-feed"
import { OrgsList } from "./orgs-list"
import { RepoList } from "./repo-list"
import { UsersGrid } from "./users-grid"
import { GistsList } from "./gists-list"
import { ProfileLoading } from "./profile-loading"
import { ProfileError } from "./profile-error"
import {
  fetchProfile,
  normalizeLookupLogin,
  pickHighlights,
  aggregateLanguages,
  buildFeed,
  type GitHubError,
  type ProfilePayload,
} from "@/lib/github"

import gsap from "gsap"

type State =
  | { status: "loading" }
  | { status: "success"; data: ProfilePayload }
  | { status: "error"; error: GitHubError }

export function ProfilePage({ username }: { username: string }) {
  const login = normalizeLookupLogin(username)
  const [state, setState] = React.useState<State>({ status: "loading" })
  const container = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let cancelled = false
    const ac = new AbortController()

    const reset = window.setTimeout(() => {
      if (!cancelled) setState({ status: "loading" })
    }, 0)

    fetchProfile(login, ac.signal)
      .then((res) => {
        if (cancelled) return
        window.clearTimeout(reset)
        if ("error" in res) setState({ status: "error", error: res.error })
        else setState({ status: "success", data: res })
      })
      .catch((e: unknown) => {
        if ((e as Error).name === "AbortError") return
        if (cancelled) return
        window.clearTimeout(reset)
        setState({ status: "error", error: { kind: "network" } })
      })

    return () => {
      cancelled = true
      window.clearTimeout(reset)
      ac.abort()
    }
  }, [login])

  React.useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.from(".hud-reveal", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      })
    }, container)
    return () => ctx.revert()
  }, [state.status])

  return (
    <div ref={container} className="relative flex min-h-svh flex-col overflow-hidden selection:bg-hud/30 selection:text-hud-glow">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-10 mix-blend-screen dot-noise" />
      <div className="hud-scanner absolute inset-0 pointer-events-none opacity-20">
        <div className="hud-scanner-line" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-8 relative z-10">
        <div className="hud-reveal w-full flex flex-col gap-4">
          <SiteHeader />
          <div className="flex justify-end pt-2">
            <a 
              href={`/c/${login}`}
              className="group relative inline-flex items-center gap-2 border border-hud/40 bg-hud/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-foreground transition-all duration-200 hover:border-hud hover:bg-hud/20 hover:text-hud hover:shadow-[0_0_15px_color-mix(in_oklab,var(--hud)_30%,transparent)]"
            >
               <span className="absolute left-0 top-0 w-1 h-1 bg-hud opacity-0 group-hover:opacity-100 transition-opacity" />
               <span className="absolute right-0 bottom-0 w-1 h-1 bg-hud opacity-0 group-hover:opacity-100 transition-opacity" />
               <span className="w-1.5 h-1.5 bg-hud hud-pulse" />
               3D Profile Card
            </a>
          </div>
        </div>

        <main id="main" className="hud-reveal flex-1 flex flex-col justify-start w-full py-8 sm:py-12 relative z-20">
          <div className="hud-target border border-hud/10 bg-card/5 backdrop-blur-md px-4 py-8 sm:px-12 sm:py-14 w-full relative min-h-[50vh]">
            <span className="hud-target-tl opacity-50" />
            <span className="hud-target-tr opacity-50" />
            <span className="hud-target-bl opacity-50" />
            <span className="hud-target-br opacity-50" />
            
            {state.status === "loading" && <ProfileLoading login={login} />}
            {state.status === "error" && (
              <ProfileError login={login} error={state.error} />
            )}
            {state.status === "success" && <ProfileSuccess data={state.data} />}
          </div>
        </main>

        <div className="hud-reveal mt-auto pt-6">
          <SiteFooter />
        </div>
      </div>
    </div>
  )
}

function ProfileSuccess({ data }: { data: ProfilePayload }) {
  const { user } = data
  const highlights = React.useMemo(() => pickHighlights(data.repos), [data.repos])
  const languages = React.useMemo(
    () => aggregateLanguages(data.repos),
    [data.repos],
  )
  const feed = React.useMemo(() => buildFeed(data.events), [data.events])

  // Show the side-by-side row only if at least one of the pair has content.
  const hasStarred = data.starred.length > 0
  const hasWatching = data.subscriptions.length > 0
  const hasFollowers = user.followers > 0 && data.followers.length > 0
  const hasFollowing = user.following > 0 && data.following.length > 0
  const hasLanguages = languages.length > 0
  const hasOrgs = data.orgs.length > 0

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <Identity user={user} />

      {highlights.length > 0 && (
        <Section>
          <PinnedRepos user={user} highlights={highlights} />
        </Section>
      )}

      {feed.length > 0 && (
        <Section>
          <ActivityFeed items={feed} />
        </Section>
      )}

      {(hasStarred || hasWatching) && (
        <Section>
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2">
            {hasStarred && (
              <RepoList
                title="Recently starred"
                id="starred-title"
                repos={data.starred}
              />
            )}
            {hasWatching && (
              <RepoList
                title="Watching"
                id="watching-title"
                repos={data.subscriptions}
              />
            )}
          </div>
        </Section>
      )}

      {data.gists.length > 0 && (
        <Section>
          <GistsList user={user} gists={data.gists} />
        </Section>
      )}

      {(hasFollowers || hasFollowing) && (
        <Section>
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2">
            {hasFollowers && (
              <UsersGrid
                title="Followers"
                id="followers-title"
                users={data.followers}
                total={user.followers}
                viewAllHref={`${user.html_url}?tab=followers`}
              />
            )}
            {hasFollowing && (
              <UsersGrid
                title="Following"
                id="following-title"
                users={data.following}
                total={user.following}
                viewAllHref={`${user.html_url}?tab=following`}
              />
            )}
          </div>
        </Section>
      )}

      {(hasLanguages || hasOrgs) && (
        <Section>
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2">
            {hasLanguages && <Languages languages={languages} />}
            {hasOrgs && <OrgsList orgs={data.orgs} />}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pt-12 sm:pt-14">
      <div className="absolute top-0 left-0 right-0 h-px hud-divider opacity-50" aria-hidden="true" />
      <div className="absolute top-0 left-0 w-4 h-[2px] bg-hud/80" aria-hidden="true" />
      {children}
    </div>
  )
}
