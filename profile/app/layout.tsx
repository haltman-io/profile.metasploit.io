import { Geist, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata = {
  metadataBase: new URL("https://0.metasploit.io"),
  openGraph: {
    type: "website",
    url: "https://0.metasploit.io",
    siteName: "Zero",
    title: "Zero — GitHub profiles, for hackers",
    description: "GitHub profiles, for hackers. Drop a username, get a clean, shareable readout.",
    images: [
      {
        url: "/og_image.png",
        width: 1200,
        height: 630,
        alt: "Zero — GitHub profiles, for hackers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero — GitHub profiles, for hackers",
    description: "GitHub profiles, for hackers. Drop a username, get a clean, shareable readout.",
    images: ["/og_image.png"],
  },
}

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        "font-mono",
        jetbrainsMono.variable
      )}
    >
      <body suppressHydrationWarning>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      </body>
    </html>
  )
}
