import type { Metadata } from "next"
import { HomeContent } from "./home-content"

export const metadata: Metadata = {
  title: "Zero — GitHub profiles, for hackers",
  description:
    "GitHub profiles, for hackers. Drop a username, get a clean, shareable readout.",
}

export default function Page() {
  return <HomeContent />
}
