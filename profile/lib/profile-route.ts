import { normalizeLookupLogin } from "@/lib/github"

export type ProfileRoute =
  | { type: "card"; username: string }
  | { type: "profile"; username: string }

export function getProfileRouteFromSlug(slug: readonly string[]): ProfileRoute | null {
  if (slug.length !== 2) return null

  const [route, rawUsername] = slug
  const username = normalizeLookupLogin(rawUsername)
  if (!username) return null

  if (route === "c") {
    return { type: "card", username }
  }

  if (route === "p" || route === "profile") {
    return { type: "profile", username }
  }

  return null
}

export function getProfileRouteFromPathname(pathname: string): ProfileRoute | null {
  const [path] = pathname.split(/[?#]/, 1)
  const slug = path.split("/").filter(Boolean)
  return getProfileRouteFromSlug(slug)
}