import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import Providers from "@/components/providers"
import { AudioProvider } from "@/lib/audio-context"
import { PersistentPlayer } from "@/components/audio/persistent-player"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#D12F25",
}

export const metadata: Metadata = {
  title: "StealMySample",
  description: "Your marketplace for high-quality audio samples",
  icons: {
    icon: [
      { url: "/images/_STEAL MY SAMPLE Logo rouge.svg" }
    ],
    apple: [
      { url: "/images/_STEAL MY SAMPLE Logo rouge.svg" }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-black bg-gradient-to-b from-zinc-950 to-black font-sans antialiased overflow-x-hidden",
        inter.className
      )}>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none"></div>
        <Providers>
          <AudioProvider>
            <div className="relative flex min-h-screen flex-col">
              <NavBar />
              <main className="flex-1 flex flex-col relative">
                {children}
              </main>
              <Footer />
              <PersistentPlayer />
              <Toaster />
            </div>
          </AudioProvider>
        </Providers>
      </body>
    </html>
  )
}

import './globals.css'