"use client"

import * as React from "react"
import { ProfilePage } from "@/components/hud/profile-page"
import { ProfileCardPage } from "@/components/hud/profile-card-page"
import { getProfileRouteFromPathname } from "@/lib/profile-route"

export default function NotFound() {
  const [route, setRoute] = React.useState<{ type: string; username: string } | null>(null)

  React.useEffect(() => {
    // We use not-found.tsx as our dynamic client-side router for the static export
    // This catches ungenerated routes like /c/username and /p/username when the CDN serves 404.html
    setRoute(getProfileRouteFromPathname(window.location.pathname) ?? { type: "404", username: "" })
  }, [])

  if (!route) {
    return <div className="min-h-svh bg-background" /> // blank state while reading URL
  }

  if (route.type === "card") {
    return <ProfileCardPage username={route.username} />
  }

  if (route.type === "profile") {
    return <ProfilePage username={route.username} />
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center font-mono text-hud bg-background">
      <div className="mb-4 text-4xl font-bold">404</div>
      <div className="text-sm tracking-widest opacity-80">// DIRECTORY_NOT_FOUND</div>
    </div>
  )
}
