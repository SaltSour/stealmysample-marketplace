"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { SampleList } from "@/components/sample-list"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Filter, Search, SlidersHorizontal, X, Tag, Music, Disc, Music2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDebounce, useDebounceCallback } from "@/hooks/use-debounce"
import { AudioPreloader } from "@/components/audio/audio-preloader"
import { PageLayout } from "@/components/page-layout"
import Image from "next/image"

export interface SampleWithDetails {
  id: string
  title: string
  tags: string[]
  description: string | null
  wavPrice: number | null
  stemsPrice: number | null
  midiPrice: number | null
  fileUrl: string
  waveformData: string | null
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  bpm?: number
  key?: string
  duration?: number
  samplePack?: {
    id: number
    title: string
    creator?: {
      user?: {
        name?: string
      }
    }
  }
}

// Define all available tags by category - moved outside component to prevent recreation
const tagCategories = {
  genres: [
    "Hip Hop", "R&B", "Pop", "Electronic", "Rock", "Jazz", "Classical", "World",
    "Trap", "House", "Techno", "Ambient", "Funk", "Soul", "Reggae", "Lofi"
  ],
  instruments: [
    "Drums", "Bass", "Keys", "Guitar", "Synth", "Vocals", "FX", "Strings",
    "Brass", "Woodwinds", "Percussion", "Piano", "Organ", "Pads", "Leads"
  ],
  moods: [
    "Dark", "Bright", "Chill", "Energetic", "Emotional", "Aggressive", "Mellow", "Uplifting"
  ],
  qualities: [
    "Clean", "Distorted", "Lo-Fi", "Hi-Fi", "Vintage", "Modern", "Processed", "Raw"
  ]
}

// Create a custom hook for samples fetching logic
function useSampleSearch(searchQuery: string, activeFilters: Record<string, string[]>) {
  const [samples, setSamples] = useState<SampleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
  // Memoize the filter values to prevent unnecessary API calls
  const filterValues = useMemo(() => {
    return Object.entries(activeFilters)
      .map(([category, values]) => values.length > 0 ? `${category}=${values.join(',')}` : null)
      .filter(Boolean)
      .join('&')
  }, [activeFilters])

  useEffect(() => {
    // Create an abort controller to cancel requests when component unmounts or dependencies change
    const abortController = new AbortController()
    
    const fetchSamples = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Build search params
        const params = new URLSearchParams()
        
        // Add search query
        if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
        
        // Add all tag filters
        Object.entries(activeFilters).forEach(([category, values]) => {
          if (values.length > 0) {
            params.set(category, values.join(','))
          }
        })
        
        // Add cache control headers and abort signal
        const response = await fetch(`/api/samples/search?${params.toString()}`, {
          signal: abortController.signal,
          headers: {
            'Cache-Control': 'max-age=60' // Cache for 60 seconds
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch samples')
        
        const data = await response.json()
        setSamples(data.samples || [])
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching samples:', error)
          setError(error.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSamples()
    
    // Cleanup function to abort fetch on unmount or dependency change
    return () => {
      abortController.abort()
    }
  }, [debouncedSearchQuery, filterValues])

  return { samples, loading, error }
}

// Loading component to show while the main content is loading
function SamplesPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950">
      {/* Hero section with loading state */}
      <div className="bg-gradient-to-r from-black via-zinc-950 to-black border-b border-zinc-800/40 relative overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-[180px] h-[100px] mx-auto mb-8 bg-zinc-800/50 animate-pulse rounded"></div>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-6 mx-auto"></div>
            <div className="h-10 bg-zinc-800/50 animate-pulse rounded mb-4 sm:mb-6 max-w-md mx-auto"></div>
            <div className="h-6 bg-zinc-800/30 animate-pulse rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8">
          {/* Mobile filter button loading */}
          <div className="md:hidden mb-4">
            <div className="w-full h-10 bg-zinc-800/50 animate-pulse rounded-full"></div>
          </div>

          {/* Desktop filters loading */}
          <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
            <div className="sticky top-20">
              <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/50 p-4 lg:p-6 h-[70vh] animate-pulse"></div>
            </div>
          </aside>

          {/* Samples List loading */}
          <div className="flex-1">
            <div className="space-y-3 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-4 sm:p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-full h-16 sm:h-24 bg-zinc-800/50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function SamplesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    genres: searchParams.get('genres')?.split(',').filter(Boolean) || [],
    instruments: searchParams.get('instruments')?.split(',').filter(Boolean) || [],
    moods: searchParams.get('moods')?.split(',').filter(Boolean) || [],
    qualities: searchParams.get('qualities')?.split(',').filter(Boolean) || []
  })
  
  // Use the custom hook for sample fetching
  const { samples, loading, error } = useSampleSearch(searchQuery, activeFilters)
  
  // Count total active filters - memoized to prevent recalculation
  const totalActiveFilters = useMemo(() => {
    return Object.values(activeFilters).flat().length
  }, [activeFilters])

  // Update URL when filters change - debounced to prevent too many history entries
  const updateUrl = useDebounceCallback(() => {
    // Only update URL if we're still on the samples page
    if (pathname !== '/samples') return;
    
    const params = new URLSearchParams()
    
    // Update search query param
    if (searchQuery) {
      params.set('q', searchQuery)
    } else {
      params.delete('q')
    }
    
    // Update tag filter params
    Object.entries(activeFilters).forEach(([category, values]) => {
      if (values.length > 0) {
        params.set(category, values.join(','))
      } else {
        params.delete(category)
      }
    })
    
    // Update URL without refreshing the page
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        {}, 
        '', 
        `${pathname}?${params.toString()}`
      )
    }
  }, 300)

  // Call the debounced URL update when dependencies change
  useEffect(() => {
    updateUrl()
    
    // Cleanup function to prevent updates after navigation
    return () => {
      // Nothing to clean up since we check pathname in updateUrl
    }
  }, [searchQuery, activeFilters, updateUrl, pathname])

  // Handle tag filter toggle - memoized to prevent recreation on each render
  const toggleTagFilter = useCallback((category: string, tag: string) => {
    setActiveFilters(prev => {
      const currentTags = prev[category] || []
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag]
      
      return {
        ...prev,
        [category]: newTags
      }
    })
  }, [])

  // Clear all filters - memoized to prevent recreation on each render
  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      genres: [],
      instruments: [],
      moods: [],
      qualities: []
    })
    setSearchQuery('')
  }, [])

  // Clear filters for a specific category - memoized to prevent recreation on each render
  const clearCategoryFilters = useCallback((category: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: []
    }))
  }, [])

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  // Filter section component - memoized to prevent recreation on each render
  const FilterSection = useCallback(({ title, category, icon }: { title: string, category: string, icon: React.ReactNode }) => (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium text-xs sm:text-sm tracking-wide uppercase">{title}</h3>
        </div>
        {activeFilters[category]?.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 sm:h-7 px-2 text-primary"
            onClick={() => clearCategoryFilters(category)}
          >
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1 sm:gap-1.5">
        {tagCategories[category as keyof typeof tagCategories].map((tag) => (
          <Button
            key={tag}
            variant={activeFilters[category]?.includes(tag) ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-[10px] sm:text-xs h-6 sm:h-7 rounded-full px-2 sm:px-3",
              activeFilters[category]?.includes(tag) 
                ? "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10" 
                : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300"
            )}
            onClick={() => toggleTagFilter(category, tag)}
          >
            {tag}
          </Button>
        ))}
      </div>
    </div>
  ), [activeFilters, clearCategoryFilters, toggleTagFilter])

  // Filter content component - memoized to prevent recreation on each render
  const FilterContent = useMemo(() => (
    <div className="space-y-3 sm:space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-5">
        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
        <Input
          type="search"
          placeholder="Search samples..."
          className="pl-10 h-10 sm:h-12 bg-zinc-900 border-zinc-800 rounded-xl text-zinc-300 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>
      
      {/* Active filters */}
      {totalActiveFilters > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-xs sm:text-sm tracking-wide uppercase text-zinc-400">Active Filters</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 sm:h-7 px-2 sm:px-3 text-xs text-primary hover:text-primary/90"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(activeFilters).flatMap(([category, tags]) => 
              tags.map(tag => (
                <Badge key={`${category}-${tag}`} variant="secondary" className="px-2 sm:px-3 py-0.5 sm:py-1 bg-primary/20 text-primary text-[10px] sm:text-xs rounded-full border-none">
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 p-0 hover:text-white"
                    onClick={() => toggleTagFilter(category, tag)}
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                </Badge>
              ))
            )}
          </div>
        </div>
      )}
      
      <Separator className="my-4 bg-zinc-800" />
      
      {/* Filter sections */}
      <FilterSection title="Genres" category="genres" icon={<Disc className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />} />
      <FilterSection title="Instruments" category="instruments" icon={<Music className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />} />
      <FilterSection title="Moods" category="moods" icon={<Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />} />
      <FilterSection title="Qualities" category="qualities" icon={<SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />} />
    </div>
  ), [
    searchQuery, 
    totalActiveFilters, 
    activeFilters, 
    clearAllFilters, 
    toggleTagFilter, 
    FilterSection,
    handleSearch
  ])

  // Extract audio URLs from samples for preloading
  const audioUrls = samples.slice(0, 10).map(sample => `/api/audio/${sample.id}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-black via-zinc-950 to-black border-b border-zinc-800/40 relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] -translate-y-1/2 bg-primary/5 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] -translate-y-1/2 bg-primary/5 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="w-full max-w-[1400px] mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative">
          <div className="max-w-2xl mx-auto text-center">
            <Image 
              src="/images/_STEAL MY SAMPLE Logo blanc.svg" 
              alt="STEAL MY SAMPLE" 
              width={200}
              height={100}
              className="w-[180px] h-auto mx-auto mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              priority
            />
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent mb-6 mx-auto"></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
              Browse Our Sample Library
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-400 mb-0 italic">
              Explore our collection of professionally crafted samples for your productions
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8">
          {/* Mobile filter button */}
          <div className="md:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full rounded-full border-zinc-700 bg-zinc-900/80 backdrop-blur-md">
                  <Filter className="mr-2 h-4 w-4 text-primary" />
                  Filters
                  {totalActiveFilters > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-primary text-white">
                      {totalActiveFilters}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[90%] max-w-[350px] border-zinc-800 bg-zinc-950">
                <ScrollArea className="h-[calc(100vh-4rem)]">
                  {FilterContent}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop filters */}
          <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
            <div className="sticky top-20">
              <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/50 p-4 lg:p-6">
                <ScrollArea className="h-[calc(100vh-12rem)] pr-3 lg:pr-4">
                  {FilterContent}
                </ScrollArea>
              </div>
            </div>
          </aside>

          {/* Samples List */}
          <div className="flex-1">
            {error ? (
              <div className="text-center py-12 sm:py-16 border rounded-xl border-zinc-800/50 bg-zinc-900/40 backdrop-blur-sm">
                <Tag className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg sm:text-xl font-medium mb-2">Error loading samples</h3>
                <p className="text-zinc-400 mb-4 sm:mb-6 px-4">{error}</p>
                <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6">Retry</Button>
              </div>
            ) : loading ? (
              <div className="space-y-3 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-4 sm:p-5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-full h-16 sm:h-24 bg-zinc-800/50" />
                ))}
              </div>
            ) : samples.length > 0 ? (
              <>
                {/* Audio preloader */}
                <AudioPreloader audioUrls={audioUrls} />
                
                {/* Sample list card */}
                <div className="bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-800/50 overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
                  <div className="p-3 sm:p-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <h2 className="font-medium text-base sm:text-lg">Results <span className="text-zinc-500 text-xs sm:text-sm ml-1">({samples.length})</span></h2>
                    <div className="text-xs sm:text-sm text-zinc-400">
                      {totalActiveFilters > 0 && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-primary hover:text-primary/80 p-0 h-auto"
                          onClick={clearAllFilters}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <SampleList samples={samples} />
                </div>
              </>
            ) : (
              <div className="text-center py-12 sm:py-16 border rounded-xl border-zinc-800/50 bg-zinc-900/40 backdrop-blur-sm">
                <Tag className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-zinc-600" />
                <h3 className="text-lg sm:text-xl font-medium mb-2">No samples found</h3>
                <p className="text-zinc-400 mb-4 sm:mb-6 px-4">
                  Try adjusting your filters or search query
                </p>
                <Button 
                  onClick={clearAllFilters} 
                  className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 rounded-full"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function SamplesPage() {
  return (
    <Suspense fallback={<SamplesPageLoading />}>
      <SamplesPageContent />
    </Suspense>
  )
}