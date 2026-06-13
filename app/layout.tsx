import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "StreamIt — Watch 15,000+ Live TV Channels Worldwide",
  description:
    "Browse and stream thousands of free live TV channels from around the world. Search by name, category, and country. 4K-ready player with HLS and DASH support.",
  keywords: ["IPTV", "live TV", "streaming", "free TV channels", "HLS", "m3u8"],
  openGraph: {
    title: "StreamIt — Live TV Streaming",
    description: "Watch 15,000+ free live TV channels worldwide.",
    type: "website",
  },
}

export const viewport = {
  themeColor: "#1a1f2b",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
