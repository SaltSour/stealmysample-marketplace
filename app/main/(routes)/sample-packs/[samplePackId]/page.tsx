"use client"

import { useState } from "react"
import Image from "next/image"
import { SampleList } from "@/components/sample-list"
import { FilterBar } from "@/components/filter-bar"
import { Button } from "@/components/ui/button"
import { Heart, Share2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

interface SamplePackPageProps {
  params: {
    samplePackId: string
  }
}

export default function SamplePackPage({ params }: SamplePackPageProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string | null>>({
    sort: null,
    tempo: null,
    key: null,
    genre: null,
    instrument: null,
    license: null,
  })

  const { data: samplePack } = useQuery({
    queryKey: ["samplePack", params.samplePackId],
    queryFn: async () => {
      const response = await fetch(`/api/sample-packs/${params.samplePackId}`)
      if (!response.ok) throw new Error("Failed to fetch sample pack")
      return response.json()
    },
  })

  const handleFilterChange = (type: string, value: string | null) => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  if (!samplePack) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-b from-background/20 to-background">
        {samplePack.imageUrl && (
          <Image
            src={samplePack.imageUrl}
            alt={samplePack.title}
            fill
            className="object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-4xl font-bold">{samplePack.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">{samplePack.description}</p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg">
                Add All to Cart
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        onFilterChange={handleFilterChange}
        activeFilters={activeFilters}
      />

      {/* Sample List */}
      <div className="flex-1 container py-8">
        <SampleList samples={samplePack.samples} />
      </div>
    </div>
  )
} 