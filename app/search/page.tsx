"use client"

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { AdvancedSearch } from '@/components/search/advanced-search'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Dynamically import the SampleCard component with no SSR to avoid browser API issues
const SampleCard = dynamic(() => import('@/components/samples/sample-card').then(mod => mod.SampleCard), { 
  ssr: false,
  loading: () => <div className="h-40 bg-muted animate-pulse rounded-md" />
})

// Loading component
function SearchResultsSkeleton() {
  return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

// Server component for fetching search results
function SearchResults({ searchParams }: { searchParams: { [key: string]: string | string[] } }) {
  const [results, setResults] = useState<{samples: any[], total: number}>({samples: [], total: 0})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      try {
        const response = await fetch(`/api/samples/search?` + 
          new URLSearchParams(
            Object.entries(searchParams).flatMap(([key, value]) => 
              Array.isArray(value) 
                ? value.map(v => [key, v])
                : [[key, value]]
            )
          ).toString()
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch samples')
        }

        const data = await response.json()
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchResults()
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (results.samples.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-2">No results found</h2>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or browse our featured samples
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          {results.total} {results.total === 1 ? 'result' : 'results'} found
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.samples.map((sample: any) => (
          <SampleCard key={sample.id} sample={sample} />
        ))}
      </div>
    </div>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const searchParamsObject = Object.fromEntries(searchParams.entries())
  
  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search samples..."
              className="pl-9"
              defaultValue={searchParams.get('q') || ''}
            />
          </div>
          <AdvancedSearch />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Array.from(searchParams.entries()).map(([key, value]) => {
            if (key === 'q') return null
            return (
              <div
                key={key}
                className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                <span>{key}: {value}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  ×
                </Button>
              </div>
            )
          })}
        </div>

        <SearchResults searchParams={searchParamsObject} />
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchPageContent />
    </Suspense>
  )
} 