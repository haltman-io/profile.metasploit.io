// Public GitHub REST API — no auth, no key.
// Rate limit: 60 requests/hour per IP. Each profile view fires 5 requests in
// parallel (user, repos, orgs, events, starred). Cached in localStorage for
// 10min so refresh doesn't burn through the budget.

export type GitHubUser = {
  login: string
  id: number
  avatar_url: string
  html_url: string
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  bio: string | null
  twitter_username: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
}

export type GitHubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  fork: boolean
  archived: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  pushed_at: string
  updated_at: string
  homepage: string | null
  owner: {
    login: string
    avatar_url: string
  }
}

export type GitHubOrg = {
  login: string
  id: number
  url: string
  avatar_url: string
  description: string | null
}

export type GitHubEvent = {
  id: string
  type: string
  actor: { id: number; login: string; avatar_url: string }
  repo: { id: number; name: string; url: string }
  payload: Record<string, unknown>
  public: boolean
  created_at: string
}

export type GitHubError =
  | { kind: "not-found"; login: string }
  | { kind: "rate-limit"; resetAt: number | null }
  | { kind: "network" }
  | { kind: "invalid-response" }
  | { kind: "unknown"; status: number }

export type GitHubMiniUser = {
  id: number
  login: string
  avatar_url: string
  html_url: string
}

export type GitHubGist = {
  id: string
  html_url: string
  description: string | null
  files: Record<
    string,
    {
      filename: string
      type: string
      language: string | null
      raw_url: string
      size: number
    }
  >
  public: boolean
  comments: number
  created_at: string
  updated_at: string
}

export type ProfilePayload = {
  user: GitHubUser
  repos: GitHubRepo[]
  orgs: GitHubOrg[]
  events: GitHubEvent[]
  starred: GitHubRepo[]
  followers: GitHubMiniUser[]
  following: GitHubMiniUser[]
  gists: GitHubGist[]
  subscriptions: GitHubRepo[]
}

const API = "https://api.github.com"
const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE_VERSION = "v3"
const FETCH_TIMEOUT_MS = 15 * 1000

function cacheKey(login: string) {
  return `gh:${CACHE_VERSION}:${login.toLowerCase()}`
}

type Cached = { ts: number } & ProfilePayload

const GITHUB_LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/
const GITHUB_REPO_RE = /^[A-Za-z0-9._-]{1,100}$/
const GIST_ID_RE = /^[A-Fa-f0-9]{1,64}$/
const CONTROL_CHARS_RE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g

const GITHUB_WEB_HOSTS = new Set(["github.com", "gist.github.com"])
const GITHUB_API_HOSTS = new Set(["api.github.com"])
const GITHUB_IMAGE_HOSTS = new Set(["avatars.githubusercontent.com", "github.com"])
const GITHUB_RAW_HOSTS = new Set(["gist.githubusercontent.com", "raw.githubusercontent.com"])

const EVENT_TYPES = new Set([
  "PushEvent",
  "PullRequestEvent",
  "IssuesEvent",
  "WatchEvent",
  "ForkEvent",
  "CreateEvent",
  "ReleaseEvent",
  "IssueCommentEvent",
  "CommitCommentEvent",
  "PullRequestReviewCommentEvent",
  "PullRequestReviewEvent",
  "PublicEvent",
  "DeleteEvent",
  "MemberEvent",
  "GollumEvent",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sanitizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null
  let clean = value.replace(CONTROL_CHARS_RE, "")
  for (let i = 0; i < 5; i += 1) {
    const stripped = clean.replace(/<[^<>]*>/g, "")
    if (stripped === clean) break
    clean = stripped
  }
  clean = clean.replace(/[<>]/g, "").trim()
  if (!clean) return null
  return clean.slice(0, maxLength)
}

function sanitizeNullableText(value: unknown, maxLength: number): string | null {
  if (value === null || typeof value === "undefined") return null
  return sanitizeText(value, maxLength)
}

function sanitizeInteger(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.trunc(value), 0), max)
}

function sanitizeBoolean(value: unknown): boolean {
  return value === true
}

function sanitizeDate(value: unknown): string {
  const text = sanitizeText(value, 40)
  if (!text) return "1970-01-01T00:00:00Z"
  const time = new Date(text).getTime()
  return Number.isFinite(time) ? text : "1970-01-01T00:00:00Z"
}

function sanitizeTimestamp(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return Math.trunc(value)
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function sanitizeLogin(value: unknown): string | null {
  const text = sanitizeText(value, 39)
  if (!text || !GITHUB_LOGIN_RE.test(text)) return null
  return text
}

export function normalizeLookupLogin(value: string): string {
  const slug = safeDecodeURIComponent(value).replace(/^@/, "").trim()
  return sanitizeLogin(slug) ?? ""
}

function sanitizeRepoName(value: unknown): string | null {
  const text = sanitizeText(value, 100)
  if (!text || !GITHUB_REPO_RE.test(text)) return null
  return text
}

function sanitizeFullName(value: unknown): string | null {
  const text = sanitizeText(value, 202)
  if (!text) return null
  const parts = text.split("/")
  if (parts.length !== 2) return null
  const owner = sanitizeLogin(parts[0])
  const name = sanitizeRepoName(parts[1])
  if (!owner || !name) return null
  return `${owner}/${name}`
}

function sanitizeTwitterUsername(value: unknown): string | null {
  const text = sanitizeText(value, 15)
  if (!text || !/^[A-Za-z0-9_]{1,15}$/.test(text)) return null
  return text
}

function sanitizeLanguage(value: unknown): string | null {
  const text = sanitizeText(value, 50)
  if (!text || !/^[A-Za-z0-9+#. -]{1,50}$/.test(text)) return null
  return text
}

function githubProfileUrl(login: string): string {
  return `https://github.com/${encodeURIComponent(login)}`
}

function githubAvatarUrl(login: string): string {
  return `${githubProfileUrl(login)}.png?size=160`
}

function githubRepoUrl(fullName: string): string {
  const [owner, repo] = fullName.split("/")
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
}

function githubGistUrl(id: string): string {
  return `https://gist.github.com/${encodeURIComponent(id)}`
}

function apiUrl(path: string): string {
  return `${API}${path}`
}

function sanitizeAbsoluteUrl(
  value: unknown,
  allowedHosts: Set<string>,
  options: { allowHttp?: boolean } = {},
): string | null {
  const text = sanitizeText(value, 2048)
  if (!text) return null

  let url: URL
  try {
    url = new URL(text)
  } catch {
    return null
  }

  const allowedProtocols = options.allowHttp ? ["https:", "http:"] : ["https:"]
  if (!allowedProtocols.includes(url.protocol)) return null
  if (url.username || url.password) return null
  if (!allowedHosts.has(url.hostname.toLowerCase())) return null

  url.hash = ""
  return url.toString()
}

function sanitizeGitHubWebUrl(value: unknown, fallback: string): string {
  return sanitizeAbsoluteUrl(value, GITHUB_WEB_HOSTS) ?? fallback
}

function sanitizeGitHubApiUrl(value: unknown, fallback: string): string {
  return sanitizeAbsoluteUrl(value, GITHUB_API_HOSTS) ?? fallback
}

function sanitizeGitHubRawUrl(value: unknown): string {
  return sanitizeAbsoluteUrl(value, GITHUB_RAW_HOSTS) ?? ""
}

function sanitizeAvatarUrl(value: unknown, login: string): string {
  return sanitizeAbsoluteUrl(value, GITHUB_IMAGE_HOSTS) ?? githubAvatarUrl(login)
}

function sanitizeExternalHttpUrl(value: unknown): string | null {
  const text = sanitizeText(value, 2048)
  if (!text) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !/^https?:\/\//i.test(text)) {
    return null
  }

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (url.username || url.password) return null
  if (!url.hostname || url.hostname.includes("\\")) return null

  url.hash = ""
  return url.toString()
}

function sanitizeArray<T>(
  value: unknown,
  sanitize: (item: unknown) => T | null,
  limit: number,
): T[] {
  if (!Array.isArray(value)) return []
  const items: T[] = []
  for (const item of value) {
    const clean = sanitize(item)
    if (!clean) continue
    items.push(clean)
    if (items.length >= limit) break
  }
  return items
}

function sanitizeUser(value: unknown): GitHubUser | null {
  if (!isRecord(value)) return null
  const login = sanitizeLogin(value.login)
  if (!login) return null

  return {
    login,
    id: sanitizeInteger(value.id),
    avatar_url: sanitizeAvatarUrl(value.avatar_url, login),
    html_url: sanitizeGitHubWebUrl(value.html_url, githubProfileUrl(login)),
    name: sanitizeNullableText(value.name, 80),
    company: sanitizeNullableText(value.company, 120),
    blog: sanitizeExternalHttpUrl(value.blog),
    location: sanitizeNullableText(value.location, 100),
    bio: sanitizeNullableText(value.bio, 280),
    twitter_username: sanitizeTwitterUsername(value.twitter_username),
    public_repos: sanitizeInteger(value.public_repos, 100000),
    public_gists: sanitizeInteger(value.public_gists, 100000),
    followers: sanitizeInteger(value.followers, 100000000),
    following: sanitizeInteger(value.following, 100000000),
    created_at: sanitizeDate(value.created_at),
  }
}

function sanitizeMiniUser(value: unknown): GitHubMiniUser | null {
  if (!isRecord(value)) return null
  const login = sanitizeLogin(value.login)
  if (!login) return null

  return {
    id: sanitizeInteger(value.id),
    login,
    avatar_url: sanitizeAvatarUrl(value.avatar_url, login),
    html_url: sanitizeGitHubWebUrl(value.html_url, githubProfileUrl(login)),
  }
}

function sanitizeRepo(value: unknown): GitHubRepo | null {
  if (!isRecord(value)) return null
  const owner = isRecord(value.owner) ? value.owner : null
  const ownerLogin = sanitizeLogin(owner?.login)
  const name = sanitizeRepoName(value.name)
  if (!ownerLogin || !name) return null
  const fullName = `${ownerLogin}/${name}`

  return {
    id: sanitizeInteger(value.id),
    name,
    full_name: fullName,
    html_url: sanitizeGitHubWebUrl(value.html_url, githubRepoUrl(fullName)),
    description: sanitizeNullableText(value.description, 350),
    fork: sanitizeBoolean(value.fork),
    archived: sanitizeBoolean(value.archived),
    language: sanitizeLanguage(value.language),
    stargazers_count: sanitizeInteger(value.stargazers_count, 100000000),
    forks_count: sanitizeInteger(value.forks_count, 100000000),
    pushed_at: sanitizeDate(value.pushed_at),
    updated_at: sanitizeDate(value.updated_at),
    homepage: sanitizeExternalHttpUrl(value.homepage),
    owner: {
      login: ownerLogin,
      avatar_url: sanitizeAvatarUrl(owner?.avatar_url, ownerLogin),
    },
  }
}

function sanitizeOrg(value: unknown): GitHubOrg | null {
  if (!isRecord(value)) return null
  const login = sanitizeLogin(value.login)
  if (!login) return null

  return {
    login,
    id: sanitizeInteger(value.id),
    url: sanitizeGitHubApiUrl(value.url, apiUrl(`/orgs/${encodeURIComponent(login)}`)),
    avatar_url: sanitizeAvatarUrl(value.avatar_url, login),
    description: sanitizeNullableText(value.description, 160),
  }
}

function sanitizeGistFiles(value: unknown): GitHubGist["files"] {
  if (!isRecord(value)) return {}
  const files: GitHubGist["files"] = {}
  let count = 0

  for (const [key, raw] of Object.entries(value)) {
    if (!isRecord(raw)) continue
    const filename = sanitizeText(raw.filename, 255) ?? sanitizeText(key, 255)
    if (!filename) continue
    files[filename] = {
      filename,
      type: sanitizeText(raw.type, 120) ?? "text/plain",
      language: sanitizeLanguage(raw.language),
      raw_url: sanitizeGitHubRawUrl(raw.raw_url),
      size: sanitizeInteger(raw.size, 10_000_000),
    }
    count += 1
    if (count >= 20) break
  }

  return files
}

function sanitizeGist(value: unknown): GitHubGist | null {
  if (!isRecord(value)) return null
  const id = sanitizeText(value.id, 64)
  if (!id || !GIST_ID_RE.test(id)) return null

  return {
    id,
    html_url: sanitizeGitHubWebUrl(value.html_url, githubGistUrl(id)),
    description: sanitizeNullableText(value.description, 280),
    files: sanitizeGistFiles(value.files),
    public: sanitizeBoolean(value.public),
    comments: sanitizeInteger(value.comments, 100000),
    created_at: sanitizeDate(value.created_at),
    updated_at: sanitizeDate(value.updated_at),
  }
}

function sanitizeEventActor(value: unknown): GitHubEvent["actor"] {
  const actor = isRecord(value) ? value : {}
  const login = sanitizeLogin(actor.login) ?? "github"
  return {
    id: sanitizeInteger(actor.id),
    login,
    avatar_url: sanitizeAvatarUrl(actor.avatar_url, login),
  }
}

function sanitizeAction(
  value: unknown,
  allowed: readonly string[],
  fallback: string,
): string {
  const text = sanitizeText(value, 32)
  return text && allowed.includes(text) ? text : fallback
}

function sanitizeEventPayload(type: string, value: unknown, repo: string): Record<string, unknown> {
  const payload = isRecord(value) ? value : {}
  const repoFallback = githubRepoUrl(repo)

  switch (type) {
    case "PushEvent":
      return {
        ref: sanitizeNullableText(payload.ref, 255),
        size: sanitizeInteger(payload.size, 100),
      }
    case "PullRequestEvent": {
      const pr = isRecord(payload.pull_request) ? payload.pull_request : {}
      const number = sanitizeInteger(payload.number ?? pr.number, 100000000)
      return {
        action: sanitizeAction(payload.action, ["opened", "closed", "reopened"], "opened"),
        number,
        pull_request: {
          merged: sanitizeBoolean(pr.merged),
          html_url: sanitizeGitHubWebUrl(
            pr.html_url,
            `${repoFallback}/pull/${number}`,
          ),
          title: sanitizeNullableText(pr.title, 180) ?? "",
          number,
        },
      }
    }
    case "IssuesEvent": {
      const issue = isRecord(payload.issue) ? payload.issue : {}
      const number = sanitizeInteger(issue.number ?? payload.number, 100000000)
      return {
        action: sanitizeAction(payload.action, ["opened", "closed", "reopened"], "opened"),
        issue: {
          html_url: sanitizeGitHubWebUrl(
            issue.html_url,
            `${repoFallback}/issues/${number}`,
          ),
          title: sanitizeNullableText(issue.title, 180) ?? "",
          number,
        },
      }
    }
    case "ForkEvent": {
      const forkee = isRecord(payload.forkee) ? payload.forkee : {}
      const forkName = sanitizeFullName(forkee.full_name) ?? repo
      return {
        forkee: {
          full_name: forkName,
          html_url: sanitizeGitHubWebUrl(forkee.html_url, githubRepoUrl(forkName)),
        },
      }
    }
    case "CreateEvent":
      return {
        ref_type: sanitizeAction(
          payload.ref_type,
          ["repository", "branch", "tag"],
          "branch",
        ),
        ref: sanitizeNullableText(payload.ref, 128),
      }
    case "ReleaseEvent": {
      const release = isRecord(payload.release) ? payload.release : {}
      const tag = sanitizeText(release.tag_name, 120) ?? ""
      return {
        release: {
          tag_name: tag,
          html_url: sanitizeGitHubWebUrl(
            release.html_url,
            tag ? `${repoFallback}/releases/tag/${encodeURIComponent(tag)}` : `${repoFallback}/releases`,
          ),
        },
      }
    }
    case "IssueCommentEvent":
    case "CommitCommentEvent":
    case "PullRequestReviewCommentEvent": {
      const comment = isRecord(payload.comment) ? payload.comment : {}
      return {
        comment: {
          html_url: sanitizeGitHubWebUrl(comment.html_url, repoFallback),
        },
      }
    }
    case "PullRequestReviewEvent": {
      const review = isRecord(payload.review) ? payload.review : {}
      const pr = isRecord(payload.pull_request) ? payload.pull_request : {}
      const number = sanitizeInteger(pr.number, 100000000)
      return {
        pull_request: { number },
        review: {
          html_url: sanitizeGitHubWebUrl(review.html_url, `${repoFallback}/pull/${number}`),
          state: sanitizeNullableText(review.state, 40) ?? "",
        },
      }
    }
    default:
      return {}
  }
}

function sanitizeEvent(value: unknown): GitHubEvent | null {
  if (!isRecord(value)) return null
  const type = sanitizeText(value.type, 64)
  const repoRecord = isRecord(value.repo) ? value.repo : null
  const repo = sanitizeFullName(repoRecord?.name)
  if (!type || !EVENT_TYPES.has(type) || !repo) return null

  return {
    id: sanitizeText(value.id, 80) ?? `${type}:${repo}:${sanitizeDate(value.created_at)}`,
    type,
    actor: sanitizeEventActor(value.actor),
    repo: {
      id: sanitizeInteger(repoRecord?.id),
      name: repo,
      url: sanitizeGitHubApiUrl(
        repoRecord?.url,
        apiUrl(`/repos/${repo.split("/").map(encodeURIComponent).join("/")}`),
      ),
    },
    payload: sanitizeEventPayload(type, value.payload, repo),
    public: sanitizeBoolean(value.public),
    created_at: sanitizeDate(value.created_at),
  }
}

function sanitizeProfilePayload(value: unknown): ProfilePayload | null {
  if (!isRecord(value)) return null
  const user = sanitizeUser(value.user)
  if (!user) return null

  return {
    user,
    repos: sanitizeArray(value.repos, sanitizeRepo, 100),
    orgs: sanitizeArray(value.orgs, sanitizeOrg, 50),
    events: sanitizeArray(value.events, sanitizeEvent, 30),
    starred: sanitizeArray(value.starred, sanitizeRepo, 10),
    followers: sanitizeArray(value.followers, sanitizeMiniUser, 24),
    following: sanitizeArray(value.following, sanitizeMiniUser, 24),
    gists: sanitizeArray(value.gists, sanitizeGist, 8),
    subscriptions: sanitizeArray(value.subscriptions, sanitizeRepo, 10),
  }
}

function sanitizeCached(value: unknown): Cached | null {
  if (!isRecord(value)) return null
  const ts = sanitizeTimestamp(value.ts)
  const payload = sanitizeProfilePayload(value)
  if (ts === null || !payload) return null
  return { ts, ...payload }
}

function readStoredValue(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function removeStoredValue(key: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage can be blocked by browser privacy settings.
  }
}

function writeStoredValue(key: string, value: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Quota exceeded, private mode, or blocked storage — skip cache writes.
  }
}

function writeStoredJson(key: string, value: unknown) {
  try {
    writeStoredValue(key, JSON.stringify(value))
  } catch {
    // Ignore non-serializable cache payloads; the network result already rendered.
  }
}

function readStoredJson<T extends { ts: number }>(
  key: string,
  sanitize: (value: unknown) => T | null,
  options: { allowStale?: boolean } = {},
): T | null {
  const raw = readStoredValue(key)
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    removeStoredValue(key)
    return null
  }

  const sanitized = sanitize(parsed)
  if (!sanitized) {
    removeStoredValue(key)
    return null
  }

  const age = Date.now() - sanitized.ts
  if (!options.allowStale && (age < 0 || age > CACHE_TTL_MS)) {
    removeStoredValue(key)
    return null
  }

  return sanitized
}

export function readCache(login: string): Cached | null {
  return readStoredJson(cacheKey(login), sanitizeCached)
}

export function writeCache(login: string, payload: ProfilePayload) {
  const sanitized = sanitizeProfilePayload(payload)
  if (!sanitized) return
  writeStoredJson(
    cacheKey(login),
    { ts: Date.now(), ...sanitized } satisfies Cached,
  )
}

// Card-only cache — lighter payload (just user + orgs). Used by /c/{login}.
// Stored separately so it doesn't clobber the full profile cache.
const CARD_CACHE_VERSION = "v1"
function cardCacheKey(login: string) {
  return `gh:card:${CARD_CACHE_VERSION}:${login.toLowerCase()}`
}

export type CardPayload = { user: GitHubUser; orgs: GitHubOrg[] }
type CardCached = { ts: number } & CardPayload

function sanitizeCardPayload(value: unknown): CardPayload | null {
  if (!isRecord(value)) return null
  const user = sanitizeUser(value.user)
  if (!user) return null
  return {
    user,
    orgs: sanitizeArray(value.orgs, sanitizeOrg, 50),
  }
}

function sanitizeCardCached(value: unknown): CardCached | null {
  if (!isRecord(value)) return null
  const ts = sanitizeTimestamp(value.ts)
  const payload = sanitizeCardPayload(value)
  if (ts === null || !payload) return null
  return { ts, ...payload }
}

function readCardCache(login: string): CardCached | null {
  return readStoredJson(cardCacheKey(login), sanitizeCardCached)
}

// Stale cache reader — ignores TTL. Used as fallback when a partial fetch
// fails (e.g. orgs request hits rate limit) so we don't wipe valid data.
function readCardCacheStale(login: string): CardCached | null {
  return readStoredJson(cardCacheKey(login), sanitizeCardCached, {
    allowStale: true,
  })
}

function readCacheStale(login: string): Cached | null {
  return readStoredJson(cacheKey(login), sanitizeCached, { allowStale: true })
}

function writeCardCache(login: string, payload: CardPayload) {
  const sanitized = sanitizeCardPayload(payload)
  if (!sanitized) return
  writeStoredJson(
    cardCacheKey(login),
    { ts: Date.now(), ...sanitized } satisfies CardCached,
  )
}

function readReset(res: Response): number | null {
  const reset = res.headers.get("x-ratelimit-reset")
  return reset ? Number(reset) * 1000 : null
}

const HEADERS: HeadersInit = { Accept: "application/vnd.github+json" }

function createRequestSignal(parent?: AbortSignal) {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => {
    controller.abort()
  }, FETCH_TIMEOUT_MS)

  const abort = () => {
    controller.abort()
  }

  if (parent?.aborted) {
    abort()
  } else {
    parent?.addEventListener("abort", abort, { once: true })
  }

  return {
    signal: controller.signal,
    cleanup() {
      globalThis.clearTimeout(timeout)
      parent?.removeEventListener("abort", abort)
    },
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

// Lightweight fetch for the share-card view.
// Cache priority: full profile cache (gh:v3) → card cache (gh:card:v1) → network (2 calls).
export async function fetchCardData(
  login: string,
  signal?: AbortSignal,
): Promise<CardPayload | { error: GitHubError }> {
  const slug = normalizeLookupLogin(login)
  if (!slug) return { error: { kind: "not-found", login: slug } }

  // 1. Full profile cache (richest source)
  const full = readCache(slug)
  if (full) return { user: full.user, orgs: full.orgs }

  // 2. Card-only cache
  const card = readCardCache(slug)
  if (card) return { user: card.user, orgs: card.orgs }

  // 3. Network — only 2 calls
  const u = encodeURIComponent(slug)

  let userRes: Response
  let orgsRes: Response
  const request = createRequestSignal(signal)
  try {
    ;[userRes, orgsRes] = await Promise.all([
      fetch(`${API}/users/${u}`, { headers: HEADERS, signal: request.signal }),
      fetch(`${API}/users/${u}/orgs`, {
        headers: HEADERS,
        signal: request.signal,
      }),
    ])
  } catch (e) {
    if (signal?.aborted) throw e
    return { error: { kind: "network" } }
  } finally {
    request.cleanup()
  }

  if (userRes.status === 404) {
    return { error: { kind: "not-found", login: slug } }
  }
  if (userRes.status === 403) {
    return { error: { kind: "rate-limit", resetAt: readReset(userRes) } }
  }
  if (!userRes.ok) {
    return { error: { kind: "unknown", status: userRes.status } }
  }

  const user = sanitizeUser(await readJson(userRes))
  if (!user) {
    return { error: { kind: "invalid-response" } }
  }

  let orgs: GitHubOrg[]
  if (orgsRes.ok) {
    orgs = sanitizeArray(await readJson(orgsRes), sanitizeOrg, 50)
  } else {
    // Orgs request failed (most commonly rate-limit at 60 req/hr without auth).
    // Preserve previously-cached orgs to avoid wiping a valid list on a
    // transient failure — otherwise refreshing during rate-limit makes orgs
    // disappear even though the user is still in them.
    const stale = readCardCacheStale(slug) ?? readCacheStale(slug)
    orgs = stale?.orgs ?? []
  }

  const payload: CardPayload = { user, orgs }
  // Only persist when both requests succeeded — a stale-orgs fallback should
  // not be promoted into a fresh cache entry.
  if (orgsRes.ok) {
    writeCardCache(slug, payload)
  }
  return payload
}

export async function fetchProfile(
  login: string,
  signal?: AbortSignal,
): Promise<ProfilePayload | { error: GitHubError }> {
  const slug = normalizeLookupLogin(login)
  if (!slug) return { error: { kind: "not-found", login: slug } }

  const cached = readCache(slug)
  if (cached) {
    const { ts: _ts, ...rest } = cached
    void _ts
    return rest
  }

  const u = encodeURIComponent(slug)

  let userRes: Response
  let reposRes: Response
  let orgsRes: Response
  let eventsRes: Response
  let starredRes: Response
  let followersRes: Response
  let followingRes: Response
  let gistsRes: Response
  let subscriptionsRes: Response
  const request = createRequestSignal(signal)
  try {
    ;[
      userRes,
      reposRes,
      orgsRes,
      eventsRes,
      starredRes,
      followersRes,
      followingRes,
      gistsRes,
      subscriptionsRes,
    ] = await Promise.all([
      fetch(`${API}/users/${u}`, { headers: HEADERS, signal: request.signal }),
      fetch(`${API}/users/${u}/repos?per_page=100&sort=updated&type=owner`, {
        headers: HEADERS,
        signal: request.signal,
      }),
      fetch(`${API}/users/${u}/orgs`, {
        headers: HEADERS,
        signal: request.signal,
      }),
      fetch(`${API}/users/${u}/events/public?per_page=30`, {
        headers: HEADERS,
        signal: request.signal,
      }),
      fetch(`${API}/users/${u}/starred?per_page=10&sort=created`, {
        headers: HEADERS,
        signal: request.signal,
      }),
      fetch(`${API}/users/${u}/followers?per_page=24`, {
        headers: HEADERS,
        signal: request.signal,
      }),
      fetch(`${API}/users/${u}/following?per_page=24`, {
        headers: HEADERS,
        signal: request.signal,
      }),
      fetch(`${API}/users/${u}/gists?per_page=8`, {
        headers: HEADERS,
        signal: request.signal,
      }),
      fetch(`${API}/users/${u}/subscriptions?per_page=10`, {
        headers: HEADERS,
        signal: request.signal,
      }),
    ])
  } catch (e) {
    if (signal?.aborted) throw e
    return { error: { kind: "network" } }
  } finally {
    request.cleanup()
  }

  if (userRes.status === 404) {
    return { error: { kind: "not-found", login: slug } }
  }
  if (userRes.status === 403 || reposRes.status === 403) {
    return {
      error: {
        kind: "rate-limit",
        resetAt: readReset(userRes) ?? readReset(reposRes),
      },
    }
  }
  if (!userRes.ok) {
    return { error: { kind: "unknown", status: userRes.status } }
  }
  if (!reposRes.ok) {
    return { error: { kind: "unknown", status: reposRes.status } }
  }

  const user = sanitizeUser(await readJson(userRes))
  const repos = sanitizeArray(await readJson(reposRes), sanitizeRepo, 100)
  if (!user) {
    return { error: { kind: "invalid-response" } }
  }
  // Optional endpoints — if any failed, fall back to empty (page renders without that section).
  // Exception: orgs falls back to a stale cache when available, since wiping
  // a known-good org list on a transient rate-limit looks like the user "lost"
  // their orgs.
  let orgs: GitHubOrg[]
  if (orgsRes.ok) {
    orgs = sanitizeArray(await readJson(orgsRes), sanitizeOrg, 50)
  } else {
    const stale = readCacheStale(slug) ?? readCardCacheStale(slug)
    orgs = stale?.orgs ?? []
  }
  const events = eventsRes.ok
    ? sanitizeArray(await readJson(eventsRes), sanitizeEvent, 30)
    : []
  const starred = starredRes.ok
    ? sanitizeArray(await readJson(starredRes), sanitizeRepo, 10)
    : []
  const followers = followersRes.ok
    ? sanitizeArray(await readJson(followersRes), sanitizeMiniUser, 24)
    : []
  const following = followingRes.ok
    ? sanitizeArray(await readJson(followingRes), sanitizeMiniUser, 24)
    : []
  const gists = gistsRes.ok
    ? sanitizeArray(await readJson(gistsRes), sanitizeGist, 8)
    : []
  const subscriptions = subscriptionsRes.ok
    ? sanitizeArray(await readJson(subscriptionsRes), sanitizeRepo, 10)
    : []

  const payload: ProfilePayload = {
    user,
    repos,
    orgs,
    events,
    starred,
    followers,
    following,
    gists,
    subscriptions,
  }
  writeCache(slug, payload)
  return payload
}

export type Highlight = Pick<
  GitHubRepo,
  | "name"
  | "description"
  | "language"
  | "stargazers_count"
  | "forks_count"
  | "html_url"
  | "pushed_at"
>

export function pickHighlights(repos: GitHubRepo[], limit = 10): Highlight[] {
  return repos
    .map((repo) => sanitizeRepo(repo))
    .filter((repo): repo is GitHubRepo => repo !== null)
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit)
    .map(
      ({
        name,
        description,
        language,
        stargazers_count,
        forks_count,
        html_url,
        pushed_at,
      }) => ({
        name,
        description,
        language,
        stargazers_count,
        forks_count,
        html_url,
        pushed_at,
      }),
    )
}

export type LanguageStat = { name: string; pct: number; color: string }

export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Less: "#1d365d",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Astro: "#ff5a03",
  Elixir: "#6e4a7e",
  Erlang: "#B83998",
  Haskell: "#5e5086",
  Lua: "#000080",
  Perl: "#0298c3",
  Scala: "#c22d40",
  Solidity: "#AA6746",
  Dart: "#00B4AB",
  R: "#198CE7",
  Julia: "#a270ba",
  "Objective-C": "#438eff",
  "Jupyter Notebook": "#DA5B0B",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  TeX: "#3D6117",
  PowerShell: "#012456",
  Zig: "#ec915c",
  Nim: "#ffc200",
  Crystal: "#000100",
  OCaml: "#3be133",
  "F#": "#b845fc",
  Clojure: "#db5855",
  CoffeeScript: "#244776",
  Vim: "#199f4b",
  "Vim Script": "#199f4b",
  GDScript: "#355570",
  Nix: "#7e7eff",
  WebAssembly: "#04133b",
  Assembly: "#6E4C13",
}

export function langColor(name: string | null): string {
  if (!name) return "var(--muted-foreground)"
  return LANG_COLORS[name] ?? "var(--hud)"
}

export function aggregateLanguages(repos: GitHubRepo[], limit = 6): LanguageStat[] {
  const byCount = new Map<string, number>()
  for (const candidate of repos) {
    const r = sanitizeRepo(candidate)
    if (!r) continue
    if (r.fork || r.archived) continue
    if (!r.language) continue
    byCount.set(r.language, (byCount.get(r.language) ?? 0) + 1)
  }
  const total = Array.from(byCount.values()).reduce((a, b) => a + b, 0)
  if (total === 0) return []

  return Array.from(byCount.entries())
    .map(([name, count]) => ({
      name,
      pct: (count / total) * 100,
      color: langColor(name),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, limit)
}

export function normalizeBlog(blog: string | null): string | null {
  return sanitizeExternalHttpUrl(blog)
}

export function blogHref(blog: string): string {
  return sanitizeExternalHttpUrl(blog) ?? "https://github.com"
}

export function blogLabel(blog: string): string {
  const href = sanitizeExternalHttpUrl(blog)
  if (!href) return ""

  try {
    const url = new URL(href)
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "")
    return `${url.hostname}${path}`.slice(0, 120)
  } catch {
    return ""
  }
}

export function joinedYear(iso: string): string {
  const year = new Date(iso).getUTCFullYear()
  return Number.isFinite(year) ? year.toString() : "1970"
}

const RTF = typeof Intl !== "undefined" ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }) : null

export function timeAgo(iso: string): string {
  if (!RTF) return ""
  const date = new Date(iso).getTime()
  if (Number.isNaN(date)) return ""
  const diffSec = (date - Date.now()) / 1000

  const minutes = diffSec / 60
  const hours = diffSec / 3600
  const days = diffSec / 86400
  const weeks = days / 7
  const months = days / 30
  const years = days / 365

  if (Math.abs(years) >= 1) return RTF.format(Math.round(years), "year")
  if (Math.abs(months) >= 1) return RTF.format(Math.round(months), "month")
  if (Math.abs(weeks) >= 1) return RTF.format(Math.round(weeks), "week")
  if (Math.abs(days) >= 1) return RTF.format(Math.round(days), "day")
  if (Math.abs(hours) >= 1) return RTF.format(Math.round(hours), "hour")
  if (Math.abs(minutes) >= 1) return RTF.format(Math.round(minutes), "minute")
  return "just now"
}

// ---------- Activity feed ----------

export type FeedItem =
  | {
      kind: "push"
      id: string
      repo: string
      repoUrl: string
      branch: string | null
      commits: number
      created_at: string
    }
  | {
      kind: "pull-request"
      id: string
      repo: string
      action: "opened" | "closed" | "reopened" | "merged"
      number: number
      title: string
      url: string
      created_at: string
    }
  | {
      kind: "issue"
      id: string
      repo: string
      action: "opened" | "closed" | "reopened"
      number: number
      title: string
      url: string
      created_at: string
    }
  | {
      kind: "star"
      id: string
      repo: string
      repoUrl: string
      created_at: string
    }
  | {
      kind: "fork"
      id: string
      repo: string
      forkRepo: string
      forkUrl: string
      created_at: string
    }
  | {
      kind: "create"
      id: string
      repo: string
      repoUrl: string
      refType: "repository" | "branch" | "tag"
      ref: string | null
      created_at: string
    }
  | {
      kind: "release"
      id: string
      repo: string
      tag: string
      url: string
      created_at: string
    }
  | {
      kind: "comment"
      id: string
      repo: string
      target: "issue" | "pr" | "commit"
      url: string
      created_at: string
    }
  | {
      kind: "review"
      id: string
      repo: string
      number: number
      url: string
      state: string
      created_at: string
    }
  | {
      kind: "public"
      id: string
      repo: string
      repoUrl: string
      created_at: string
    }

const SKIP_TYPES = new Set([
  "DeleteEvent",
  "MemberEvent",
  "GollumEvent",
])

function repoUrl(repo: string) {
  const fullName = sanitizeFullName(repo)
  return fullName ? githubRepoUrl(fullName) : "https://github.com"
}

function normalizeEvent(e: GitHubEvent): FeedItem | null {
  const repo = e.repo.name
  const p = e.payload as Record<string, unknown>

  switch (e.type) {
    case "PushEvent": {
      const ref = (p.ref as string | undefined) ?? null
      const branch = ref ? ref.replace(/^refs\/heads\//, "") : null
      const size =
        (p.size as number | undefined) ??
        (Array.isArray(p.commits) ? p.commits.length : 0)
      if (!size) return null
      return {
        kind: "push",
        id: e.id,
        repo,
        repoUrl: repoUrl(repo),
        branch,
        commits: size,
        created_at: e.created_at,
      }
    }
    case "PullRequestEvent": {
      const action = (p.action as string) || "opened"
      const pr = p.pull_request as
        | { merged?: boolean; html_url?: string; title?: string; number?: number }
        | undefined
      const finalAction: "opened" | "closed" | "reopened" | "merged" =
        action === "closed" && pr?.merged
          ? "merged"
          : (action as "opened" | "closed" | "reopened")
      return {
        kind: "pull-request",
        id: e.id,
        repo,
        action: finalAction,
        number: (p.number as number) ?? pr?.number ?? 0,
        title: pr?.title ?? "",
        url: pr?.html_url ?? `${repoUrl(repo)}/pulls`,
        created_at: e.created_at,
      }
    }
    case "IssuesEvent": {
      const action = (p.action as string) || "opened"
      const issue = p.issue as
        | { html_url?: string; title?: string; number?: number }
        | undefined
      return {
        kind: "issue",
        id: e.id,
        repo,
        action: action as "opened" | "closed" | "reopened",
        number: issue?.number ?? 0,
        title: issue?.title ?? "",
        url: issue?.html_url ?? `${repoUrl(repo)}/issues`,
        created_at: e.created_at,
      }
    }
    case "WatchEvent":
      return {
        kind: "star",
        id: e.id,
        repo,
        repoUrl: repoUrl(repo),
        created_at: e.created_at,
      }
    case "ForkEvent": {
      const forkee = p.forkee as
        | { full_name?: string; html_url?: string }
        | undefined
      return {
        kind: "fork",
        id: e.id,
        repo,
        forkRepo: forkee?.full_name ?? "",
        forkUrl: forkee?.html_url ?? repoUrl(repo),
        created_at: e.created_at,
      }
    }
    case "CreateEvent": {
      const refType = (p.ref_type as "repository" | "branch" | "tag") || "branch"
      return {
        kind: "create",
        id: e.id,
        repo,
        repoUrl: repoUrl(repo),
        refType,
        ref: (p.ref as string | null) ?? null,
        created_at: e.created_at,
      }
    }
    case "ReleaseEvent": {
      const release = p.release as
        | { tag_name?: string; html_url?: string }
        | undefined
      return {
        kind: "release",
        id: e.id,
        repo,
        tag: release?.tag_name ?? "",
        url: release?.html_url ?? `${repoUrl(repo)}/releases`,
        created_at: e.created_at,
      }
    }
    case "IssueCommentEvent": {
      const comment = p.comment as { html_url?: string } | undefined
      return {
        kind: "comment",
        id: e.id,
        repo,
        target: "issue",
        url: comment?.html_url ?? `${repoUrl(repo)}/issues`,
        created_at: e.created_at,
      }
    }
    case "CommitCommentEvent": {
      const comment = p.comment as { html_url?: string } | undefined
      return {
        kind: "comment",
        id: e.id,
        repo,
        target: "commit",
        url: comment?.html_url ?? repoUrl(repo),
        created_at: e.created_at,
      }
    }
    case "PullRequestReviewCommentEvent": {
      const comment = p.comment as { html_url?: string } | undefined
      return {
        kind: "comment",
        id: e.id,
        repo,
        target: "pr",
        url: comment?.html_url ?? `${repoUrl(repo)}/pulls`,
        created_at: e.created_at,
      }
    }
    case "PullRequestReviewEvent": {
      const review = p.review as { html_url?: string; state?: string } | undefined
      const pr = p.pull_request as { number?: number } | undefined
      return {
        kind: "review",
        id: e.id,
        repo,
        number: pr?.number ?? 0,
        url: review?.html_url ?? `${repoUrl(repo)}/pulls`,
        state: review?.state ?? "",
        created_at: e.created_at,
      }
    }
    case "PublicEvent":
      return {
        kind: "public",
        id: e.id,
        repo,
        repoUrl: repoUrl(repo),
        created_at: e.created_at,
      }
    default:
      return null
  }
}

export function buildFeed(events: GitHubEvent[], limit = 12): FeedItem[] {
  const items: FeedItem[] = []
  for (const e of events) {
    const safeEvent = sanitizeEvent(e)
    if (!safeEvent || SKIP_TYPES.has(safeEvent.type)) continue
    const item = normalizeEvent(safeEvent)
    if (!item) continue

    const last = items[items.length - 1]
    // Collapse consecutive PushEvents to the same repo+branch — show as one combined push.
    if (
      item.kind === "push" &&
      last?.kind === "push" &&
      last.repo === item.repo &&
      last.branch === item.branch
    ) {
      last.commits += item.commits
      // Keep earliest created_at so "X ago" reflects the start of the burst.
      last.created_at = item.created_at
      continue
    }
    // Same repo starred twice in a row — drop the duplicate.
    if (
      item.kind === "star" &&
      last?.kind === "star" &&
      last.repo === item.repo
    ) {
      continue
    }

    items.push(item)
    if (items.length >= limit) break
  }
  return items
}
