"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import {
  Search,
  Download,
  Music,
  Package,
  Filter,
  Clock,
  Tag,
  File,
  Music2,
  User,
  Hash,
  Play,
  Pause,
  ExternalLink,
} from "lucide-react"
import { AudioPlayer } from "@/components/audio/audio-player"
import { downloadSample } from "@/lib/utils"
import { useAudio } from "@/lib/audio-context"

interface Sample {
  id: string
  title: string
  description?: string
  format: 'WAV' | 'STEMS' | 'MIDI'
  purchaseDate: string
  fileUrl: string
  coverImage?: string
  packTitle?: string
  packId?: number
  creator: string
  orderItem: string
  bpm?: number
  key?: string
}

interface SamplePack {
  id: number
  title: string
  creator: string
  coverImage?: string
  purchaseDate: string
  format: 'WAV' | 'STEMS' | 'MIDI'
  samples: Sample[]
}

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("samples")
  const [samples, setSamples] = useState<Sample[]>([])
  const [packs, setPacks] = useState<SamplePack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterFormat, setFilterFormat] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("recent")
  const [debugData, setDebugData] = useState<any>(null)
  const { toast } = useToast()
  const { playSample, currentSample, togglePlayPause, isPlaying } = useAudio()

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch library data
  useEffect(() => {
    if (status === "authenticated") {
      fetchLibrary()
    }
  }, [status, searchQuery, filterFormat])

  // Fetch library data from API
  const fetchLibrary = async () => {
    setIsLoading(true)
    try {
      // Get the packId from the URL if present
      const urlParams = new URLSearchParams(window.location.search)
      const packId = urlParams.get('packId')
      
      // Build the query string
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (filterFormat) params.set("format", filterFormat)
      if (packId) params.set("packId", packId)

      console.log("Fetching library with params:", params.toString());
      
      const response = await fetch(`/api/user/library?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch library")
      
      const data = await response.json()
      console.log("Library data received:", {
        samplesCount: data.samples?.length || 0,
        packsCount: data.packs?.length || 0
      });
      
      if (data.packs && data.packs.length > 0) {
        console.log("Pack data received:", data.packs);
      } else {
        console.log("No packs received in library response");
        // Fetch debug data to see what's happening
        try {
          const debugResponse = await fetch('/api/debug/library');
          if (debugResponse.ok) {
            const debugInfo = await debugResponse.json();
            console.log("Debug info:", debugInfo);
            setDebugData(debugInfo);
            
            // Check if there are pack items in the debug data but not in the library response
            if (debugInfo.packItems && debugInfo.packItems.length > 0) {
              console.warn("Packs exist in order items but are not showing in library!");
            }
          }
        } catch (debugError) {
          console.error("Failed to fetch debug data:", debugError);
        }
      }
      
      setSamples(data.samples || [])
      setPacks(data.packs || [])
      
      // If packId is specified, automatically select the Samples tab
      if (packId) {
        setActiveTab("samples")
      }
    } catch (error) {
      console.error("Error fetching library:", error)
      toast({
        title: "Error",
        description: "Failed to load your library",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Force refresh library data
  const refreshLibrary = () => {
    setIsRefreshing(true)
    fetchLibrary()
  }

  // Handle play button click
  const handlePlay = (sample: Sample) => {
    if (currentSample?.id === sample.id) {
      togglePlayPause()
    } else {
      playSample({
        id: sample.id,
        title: sample.title,
        creator: sample.creator,
        duration: 0, // We don't have this info yet
        audioUrl: `/api/audio/${sample.id}`
      })
    }
  }

  // Handle download
  const handleDownload = async (sample: Sample) => {
    try {
      // Create a clean filename from the sample title
      const fileName = `${sample.title.replace(/[^\w\s-]/g, "")}_${sample.format.toLowerCase()}.${getFileExtension(sample.format)}`
      
      // Pass only 2 parameters to downloadSample (id and filename)
      const success = await downloadSample(sample.id, fileName)
      
      if (success) {
        toast({
          title: "Download started",
          description: `Downloading ${sample.title} (${sample.format})`
        })
      } else {
        toast({
          title: "Download failed",
          description: "Unable to download the sample. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Unable to download the sample. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Get file extension based on format
  const getFileExtension = (format: string): string => {
    switch (format) {
      case 'STEMS':
        return 'zip'
      case 'MIDI':
        return 'mid'
      case 'WAV':
      default:
        return 'wav'
    }
  }

  // Get format icon based on format
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'STEMS':
        return <Package className="h-4 w-4" />
      case 'MIDI':
        return <File className="h-4 w-4" />
      case 'WAV':
      default:
        return <Music className="h-4 w-4" />
    }
  }

  // Sort the samples and packs based on sortBy
  const sortedSamples = useMemo(() => {
    let sorted = [...samples];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
      case "name-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "name-desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }, [samples, sortBy]);

  const sortedPacks = useMemo(() => {
    let sorted = [...packs];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
      case "name-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "name-desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }, [packs, sortBy]);

  // If loading, show skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Library</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">My Library</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshLibrary}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search your library..."
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterFormat(filterFormat ? null : 'WAV')}
            className={filterFormat ? "bg-primary text-primary-foreground" : ""}
            title="Filter by format"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {filterFormat && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Format:</span>
            <div className="flex space-x-1">
              <Badge 
                variant={filterFormat === 'WAV' ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => setFilterFormat('WAV')}
              >
                WAV
              </Badge>
              <Badge 
                variant={filterFormat === 'STEMS' ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => setFilterFormat('STEMS')}
              >
                STEMS
              </Badge>
              <Badge 
                variant={filterFormat === 'MIDI' ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => setFilterFormat('MIDI')}
              >
                MIDI
              </Badge>
              <Badge 
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setFilterFormat(null)}
              >
                Clear
              </Badge>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-md text-sm p-1 text-zinc-300 focus:ring-primary"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="samples" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="dashboard-tabs-list">
          <TabsTrigger value="samples" className="dashboard-tab">
            <Music className="mr-2 h-4 w-4" />
            Samples ({samples.length})
          </TabsTrigger>
          <TabsTrigger value="packs" className="dashboard-tab">
            <Package className="mr-2 h-4 w-4" />
            Packs ({packs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="samples" className="space-y-6">
          {samples.length === 0 ? (
            <Card className="text-center p-8">
              <CardContent>
                <Music2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Samples Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterFormat
                    ? "Try adjusting your search or filters"
                    : "You haven't purchased any samples yet"}
                </p>
                {!searchQuery && !filterFormat && (
                  <Button asChild>
                    <Link href="/samples">Browse Samples</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedSamples.map((sample) => (
                <Card key={sample.id} className="overflow-hidden hover:shadow-md border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm transition-all duration-200 hover:border-primary/20 hover:bg-zinc-900/60">
                  <div className="flex flex-col sm:flex-row">
                    {sample.coverImage ? (
                      <div className="relative h-40 sm:h-auto sm:w-40 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-800/60">
                        <Image
                          src={sample.coverImage}
                          alt={sample.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <Badge variant="outline" className="absolute bottom-2 left-2 flex items-center bg-black/50 backdrop-blur-sm border-zinc-700">
                          {getFormatIcon(sample.format)}
                          <span className="ml-1">{sample.format}</span>
                        </Badge>
                      </div>
                    ) : (
                      <div className="relative h-32 sm:h-auto sm:w-32 flex-shrink-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-b sm:border-b-0 sm:border-r border-zinc-800/60 flex items-center justify-center">
                        <Music2 className="h-10 w-10 text-zinc-600" />
                        <Badge variant="outline" className="absolute bottom-2 left-2 flex items-center bg-black/50 backdrop-blur-sm border-zinc-700">
                          {getFormatIcon(sample.format)}
                          <span className="ml-1">{sample.format}</span>
                        </Badge>
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-lg text-white group-hover:text-primary-foreground">{sample.title}</h3>
                          <p className="text-sm text-zinc-400">
                            by {sample.creator}
                          </p>
                        </div>
                      </div>
                      
                      {sample.packTitle && (
                        <div className="mt-2 flex items-center">
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                            <Package className="h-3 w-3 mr-1" />
                            {sample.packTitle}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400 border-t border-zinc-800/60 pt-3">
                        {sample.bpm && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3 text-zinc-500" />
                            {sample.bpm} BPM
                          </div>
                        )}
                        {sample.key && (
                          <div className="flex items-center gap-1">
                            <Music2 className="h-3 w-3 text-zinc-500" />
                            {sample.key}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          {formatDistanceToNow(new Date(sample.purchaseDate), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handlePlay(sample)}
                          className="flex-grow sm:flex-grow-0 bg-primary text-white hover:bg-primary/80 shadow-sm"
                        >
                          {currentSample?.id === sample.id && isPlaying ? (
                            <Pause className="mr-2 h-4 w-4" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          {currentSample?.id === sample.id && isPlaying ? "Pause" : "Play"}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleDownload(sample)}
                          className="flex-grow sm:flex-grow-0"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="flex-grow sm:flex-grow-0"
                        >
                          <Link href={`/samples/${sample.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="packs" className="space-y-6">
          {packs.length === 0 ? (
            <Card className="text-center p-8">
              <CardContent className="space-y-6">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Sample Packs Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterFormat
                    ? "Try adjusting your search or filters"
                    : "You haven't purchased any sample packs yet"}
                </p>
                {debugData && debugData.packItems && debugData.packItems.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded border border-orange-200 text-left">
                    <h4 className="font-medium text-orange-800 mb-2">System detected {debugData.packItems.length} packs but can't display them</h4>
                    <p className="text-sm text-orange-700">We found packs in your orders but there's an issue displaying them. Please try refreshing or contact support.</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={refreshLibrary}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? 'Refreshing...' : 'Refresh Library'}
                    </Button>
                  </div>
                )}
                {!searchQuery && !filterFormat && (
                  <Button asChild>
                    <Link href="/packs">Browse Sample Packs</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPacks.map((pack) => {
                // Check if pack was purchased within the last 7 days
                const isNew = new Date(pack.purchaseDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return (
                <Card key={pack.id} className="overflow-hidden h-full flex flex-col border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-zinc-900/70 hover:shadow-lg hover:shadow-primary/5 group">
                  {isNew && (
                    <div className="absolute top-0 left-0 z-20 w-full h-full overflow-hidden pointer-events-none">
                      <div className="absolute -top-14 -right-14 rotate-45">
                        <div className="bg-primary/80 text-white text-xs font-bold py-1 px-12 shadow-md">NEW</div>
                      </div>
                    </div>
                  )}
                  {pack.coverImage ? (
                    <div className="relative h-52 w-full overflow-hidden">
                      <Image
                        src={pack.coverImage}
                        alt={pack.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300"></div>
                      <Badge variant="outline" className="absolute top-3 right-3 flex items-center bg-black/70 backdrop-blur-md border-zinc-700 shadow-md">
                        {getFormatIcon(pack.format)}
                        <span className="ml-1">{pack.format}</span>
                      </Badge>
                      <div className="absolute bottom-0 left-0 w-full p-4 z-10 transform transition-transform duration-300 group-hover:translate-y-[-5px]">
                        <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">{pack.title}</h3>
                        <div className="flex items-center gap-1 text-zinc-200 text-sm group-hover:text-white transition-colors">
                          <User className="h-3 w-3" /> {pack.creator}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-52 w-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(var(--primary-rgb),0.15),transparent_50%)] opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <Package className="h-16 w-16 text-zinc-700 group-hover:text-primary/50 transition-colors duration-300" />
                      <Badge variant="outline" className="absolute top-3 right-3 flex items-center bg-black/50 backdrop-blur-sm border-zinc-700">
                        {getFormatIcon(pack.format)}
                        <span className="ml-1">{pack.format}</span>
                      </Badge>
                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">{pack.title}</h3>
                        <div className="flex items-center gap-1 text-zinc-300 text-sm">
                          <User className="h-3 w-3" /> {pack.creator}
                        </div>
                      </div>
                    </div>
                  )}
                  <CardContent className="py-4 flex-grow">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Music className="h-4 w-4 text-primary" /> 
                        <span className="text-sm font-medium">{pack.samples.length} samples</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(pack.purchaseDate), { addSuffix: true })}
                      </div>
                    </div>
                    
                    {/* Sample count indicator */}
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2 mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full" 
                        style={{ 
                          width: `${Math.min(100, Math.max(15, (pack.samples.length / 20) * 100))}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Show a few sample types as badges */}
                      {Array.from(new Set(pack.samples.slice(0, 3).map(s => s.format))).map((format) => (
                        <Badge key={format} variant="secondary" className="bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700/70 group-hover:text-white transition-colors duration-200">
                          {format}
                        </Badge>
                      ))}
                      {pack.samples.length > 3 && (
                        <Badge variant="outline" className="bg-transparent text-zinc-400 border-zinc-700 group-hover:border-zinc-500 transition-colors duration-200">
                          +{pack.samples.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="w-full flex gap-2 flex-col">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-grow bg-primary text-white hover:bg-primary/80 shadow transition-all duration-200 hover:shadow-md hover:shadow-primary/10"
                          asChild
                        >
                          <Link href={`/dashboard/library?packId=${pack.id}`}>
                            <Music className="mr-2 h-4 w-4" />
                            Browse Samples
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="flex-shrink-0 border-zinc-700 hover:bg-zinc-800 transition-all duration-200 hover:border-zinc-500"
                        >
                          <Link href={`/packs/${pack.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        variant="default"
                        asChild
                        className="w-full bg-primary/90 text-white hover:bg-primary transition-all duration-200 shadow-sm"
                      >
                        <Link href={`/api/download/pack/${pack.id}`}>
                          <Download className="mr-2 h-4 w-4" />
                          Download All
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )})}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 