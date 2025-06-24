"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function ClientHomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Minimal hero section */}
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
            Steal My Sample
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            Your marketplace for premium audio samples
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/packs">
              <Button size="lg" className="rounded-full h-12 px-8 bg-primary hover:bg-primary/90">
                Browse Packs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Simple features section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-zinc-200">Premium Quality</h3>
            <p className="text-zinc-400">Curated selection of high-quality audio samples</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-zinc-200">Instant Access</h3>
            <p className="text-zinc-400">Download immediately after purchase</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-zinc-200">Secure Payment</h3>
            <p className="text-zinc-400">Safe and encrypted transactions</p>
          </div>
        </div>
      </div>
    </div>
  )
} 