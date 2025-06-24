"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Upload, Download, Play, DollarSign, Music2 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <div className="space-y-8 w-full">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 text-sm">Welcome back! Here's an overview of your account.</p>
        </div>
        {session?.user?.isCreator && (
          <Button 
            asChild 
            className="dashboard-cta-primary"
          >
            <Link href="/dashboard/packs/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Pack
            </Link>
          </Button>
        )}
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black border border-zinc-800/40 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-900/20 rounded-lg">
                <Download className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-400 text-sm">Downloads</p>
                <h3 className="text-xl font-bold text-white">0</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-zinc-800/40 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-900/20 rounded-lg">
                <Play className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-green-400 text-sm">Plays</p>
                <h3 className="text-xl font-bold text-white">0</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-zinc-800/40 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 text-sm">Revenue</p>
                <h3 className="text-xl font-bold text-white">$0.00</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-zinc-800/40 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-900/20 rounded-lg">
                <Upload className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-purple-400 text-sm">Uploads</p>
                <h3 className="text-xl font-bold text-white">0</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-black border border-zinc-800/40 rounded-lg p-4">
            <h3 className="font-medium text-white mb-1">Browse Samples</h3>
            <p className="text-zinc-400 text-sm mb-4">Discover new samples to download</p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild className="dashboard-cta-outline rounded-full">
                <Link href="/samples">Browse</Link>
              </Button>
            </div>
          </div>

          <div className="bg-black border border-zinc-800/40 rounded-lg p-4">
            <h3 className="font-medium text-white mb-1">My Library</h3>
            <p className="text-zinc-400 text-sm mb-4">View your downloaded samples</p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild className="dashboard-cta-outline rounded-full">
                <Link href="/dashboard/library">View Library</Link>
              </Button>
            </div>
          </div>

          <div className="bg-black border border-zinc-800/40 rounded-lg p-4">
            <h3 className="font-medium text-white mb-1">Upload Sample</h3>
            <p className="text-zinc-400 text-sm mb-4">Share your sounds with the world</p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild className="dashboard-cta-outline rounded-full">
                <Link href="/dashboard/upload">Upload</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Marketplace Highlights */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Marketplace Highlights</h2>
          <Button variant="outline" size="sm" asChild className="dashboard-cta-outline rounded-full">
            <Link href="/samples">View All</Link>
          </Button>
        </div>
        <div className="bg-black border border-zinc-800/40 rounded-lg p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <Music2 className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Featured Samples</h3>
            <p className="text-zinc-400 max-w-lg mb-6">
              Check out the latest trending samples from our marketplace.
            </p>
            <Button asChild className="dashboard-cta-secondary">
              <Link href="/samples">Browse Marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 