"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PackCard } from "@/components/pack-card"
import { toast } from "sonner"

interface Pack {
  id: string
  title: string
  description?: string
  price?: number
  stats?: {
    plays: number
    downloads: number
    conversionRate: number
    revenue: number
  }
  _count?: {
    samples: number
  }
}

export default function CreatorPacks() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [packs, setPacks] = useState<Pack[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/packs/creator")
        
        if (!response.ok) {
          const error = await response.text()
          throw new Error(error || "Failed to fetch packs")
        }

        const data = await response.json()
        setPacks(data)
      } catch (error) {
        console.error("Error fetching packs:", error)
        toast.error(error instanceof Error ? error.message : "Failed to fetch packs")
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchPacks()
    }
  }, [status])

  if (status === "loading" || isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Sample Packs</h1>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Pack
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[200px] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Sample Packs</h1>
        <Button onClick={() => router.push("/creator/packs/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Pack
        </Button>
      </div>
      {packs.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-lg font-medium mb-2">No sample packs yet</h2>
          <p className="text-muted-foreground mb-4">
            Create your first sample pack to start selling
          </p>
          <Button onClick={() => router.push("/creator/packs/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Pack
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              href={`/creator/packs/${pack.id}`}
              variant="creator"
            />
          ))}
        </div>
      )}
    </div>
  )
} 