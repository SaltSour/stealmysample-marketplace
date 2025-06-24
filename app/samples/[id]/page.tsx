"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Music2, 
  Play, 
  Pause, 
  ShoppingCart, 
  Clock, 
  Hash, 
  Tag, 
  Download, 
  User, 
  Package,
  Music,
  Album,
  Heart,
  MoreHorizontal,
  Share
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { formatPrice, formatDuration } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useAudio } from "@/lib/audio-context"
import Image from "next/image"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { PageLayout } from "@/components/page-layout"
import { SectionHeading } from "@/components/ui/section-heading"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// Simple audio progress indicator to replace waveform
const AudioProgressBar = ({ 
  currentTime = 0, 
  duration = 0, 
  onSeek 
}: { 
  currentTime?: number; 
  duration?: number; 
  onSeek?: (time: number) => void;
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const durationIsValid = isFinite(duration) && duration > 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !durationIsValid) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const seekTime = percentage * duration;
    
    onSeek(seekTime);
  };
  
  return (
    <div 
      className="h-7 bg-muted rounded-md relative cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div 
        className="h-full bg-primary/60 absolute left-0 top-0 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] text-foreground">
          {formatDuration(currentTime)} / {durationIsValid ? formatDuration(duration) : "..."}
        </span>
      </div>
    </div>
  );
};

interface SampleWithDetails {
  id: string
  title: string
  description: string | null
  fileUrl: string
  waveformData: string | null
  duration: number
  bpm: number | null
  key: string | null
  tags: string[]
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  wavPrice: number | null
  stemsPrice: number | null
  midiPrice: number | null
  coverImage?: string | null
  samplePack: {
    id: number
    title: string
    coverImage?: string | null
    creator: {
      id: string
      user: {
        id: string
        name: string
        username: string | null
      }
    }
  }
}

// Add this helper function to get the cover image
const getCoverImage = (sample: SampleWithDetails): string => {
  // Use sample's specific cover if available
  if (sample.coverImage) {
    return sample.coverImage;
  }
  
  // Fallback to sample pack cover if available
  if (sample.samplePack?.coverImage) {
    return sample.samplePack.coverImage;
  }
  
  // Default placeholder image if no cover is available
  return "/images/placeholder-cover.jpg";
};

// Helper function to get base URL for API calls
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

export default function SamplePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { playSample, currentSample, togglePlayPause, isPlaying, seek, currentTime, duration } = useAudio()
  const [sample, setSample] = useState<SampleWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState<'WAV' | 'STEMS' | 'MIDI' | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isInCart, setIsInCart] = useState(false)

  const isCurrentSample = currentSample?.id === params.id

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Call on mount
    checkMobile();
    
    // Setup resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchSampleData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching sample with ID:", params.id);
        
        // Try to fetch the sample using our enhanced API
        const response = await fetch(`/api/samples/slug/${params.id}`, {
          // Add cache: 'no-store' to prevent caching issues
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch sample: ${response.status} ${response.statusText}`);
          
          // Try to get more details about the error
          try {
            const errorData = await response.json();
            console.error("Error details:", errorData);
          } catch (e) {
            console.error("Could not parse error response");
          }
          
          if (response.status === 404) {
            console.log("Sample not found, showing error message");
            // Set sample to null but don't throw - this will show the "not found" UI
            if (isMounted) {
              setSample(null);
            }
            return;
          }
          
          throw new Error(`Failed to fetch sample: ${response.status} ${response.statusText}`);
        }
        
        // Parse the successful response
        const data = await response.json();
        
        // Validate that we got a proper sample object
        if (!data || !data.id) {
          console.error("Invalid sample data received:", data);
          throw new Error("Invalid sample data received from API");
        }
        
        console.log("Sample data received successfully:", data.id, data.title);
        
        if (isMounted) {
          setSample(data);
          
          // Automatically select WAV if available
          if (data.hasWav) {
            setSelectedFormat('WAV');
          } else if (data.hasStems) {
            setSelectedFormat('STEMS');
          } else if (data.hasMidi) {
            setSelectedFormat('MIDI');
          }
        }
      } catch (error) {
        console.error("Error fetching sample:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load sample details. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSampleData();
    return () => { isMounted = false }
  }, [params.id, toast])

  const addToCart = async (sampleId: string, format: 'wav' | 'stems' | 'midi') => {
    if (!sample) {
      toast({
        title: "Error",
        description: "Sample data not available",
        variant: "destructive",
      })
      return
    }

    // Convert format to uppercase to match the enum in schema
    const formatUpper = format.toUpperCase() as 'WAV' | 'STEMS' | 'MIDI';

    // Determine price based on format
    let price: number | null;
    switch (format) {
      case 'wav':
        price = sample.wavPrice;
        break;
      case 'stems':
        price = sample.stemsPrice;
        break;
      case 'midi':
        price = sample.midiPrice;
        break;
      default:
        price = null;
    }

    // Validate price exists
    if (price === null || price === undefined) {
      toast({
        title: "Error",
        description: "Selected format is not available for this sample",
        variant: "destructive",
      })
      return
    }

    // Ensure price is a valid number
    price = Number(price);
    if (isNaN(price)) {
      toast({
        title: "Error",
        description: "Invalid price for this format",
        variant: "destructive",
      })
      return
    }

    // Validate samplePackId
    if (!sample.samplePack?.id) {
      toast({
        title: "Error",
        description: "Sample pack information is missing",
        variant: "destructive",
      })
      return
    }

    // Ensure samplePackId is a valid integer
    const samplePackId = Number(sample.samplePack.id);
    if (isNaN(samplePackId) || !Number.isInteger(samplePackId) || samplePackId <= 0) {
      toast({
        title: "Error",
        description: "Invalid sample pack ID",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare request payload with validated data
      const requestBody = {
        sampleId: sampleId,
        format: formatUpper,
        price: price,
        samplePackId: samplePackId
      };
      
      console.log("Adding to cart:", requestBody);

      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle different error scenarios
      if (!response.ok) {
        let errorMessage = "Failed to add item to cart";

        // Try to extract detailed error message from response
        try {
          const errorData = await response.json();
          console.error("Cart API error:", errorData);
          
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.errors && errorData.errors.length > 0) {
            // Handle Zod validation errors
            errorMessage = errorData.errors.map((e: any) => e.message || e.path.join('.')).join(', ');
          }
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }

        throw new Error(errorMessage);
      }

      // Success case
      toast({
        title: "Added to cart",
        description: `${sample.title} (${formatUpper}) has been added to your cart`,
      });
      setIsInCart(true);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart",
        variant: "destructive",
      });
    }
  }

  const getAvailableFormats = () => {
    if (!sample) return []
    
    const formats = []
    if (sample.hasWav && sample.wavPrice) formats.push({ format: 'WAV', price: sample.wavPrice })
    if (sample.hasStems && sample.stemsPrice) formats.push({ format: 'STEMS', price: sample.stemsPrice })
    if (sample.hasMidi && sample.midiPrice) formats.push({ format: 'MIDI', price: sample.midiPrice })
    
    return formats
  }

  const handleSeek = (time: number) => {
    if (!isCurrentSample) {
      // If not currently playing this sample, start it first
      playSample({
        id: sample.id,
        title: sample.title,
        creator: sample.samplePack.creator.user.name,
        duration: sample.duration,
        audioUrl: `/api/audio/${sample.id}`
      });
      
      // Wait a moment for audio to initialize before seeking
      setTimeout(() => {
        seek(time);
      }, 100);
    } else {
      // If already playing this sample, just seek
      seek(time);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const downloadAudio = () => {
    if (!sample) return
    // Create a temporary anchor element
    const a = document.createElement('a')
    a.href = `/api/audio/${sample.id}`
    a.download = `${sample.title}.wav`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const shareLink = () => {
    if (!sample) return
    if (navigator.share) {
      navigator.share({
        title: sample.title,
        text: `Check out this sample: ${sample.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Link copied to clipboard",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container py-4 px-4 sm:px-6 sm:py-8">
        <div className="flex flex-col space-y-4 sm:space-y-6">
          <Button variant="ghost" className="w-fit" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Skeleton className="h-8 sm:h-10 w-full sm:w-1/3" />
          <Skeleton className="h-5 sm:h-6 w-full sm:w-1/4 mt-2" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-40 sm:h-48 w-full" />
            </div>
            <div>
              <Skeleton className="h-40 sm:h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!sample) {
    return (
      <div className="container py-4 px-4 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <Music2 className="h-12 sm:h-16 w-12 sm:w-16 text-zinc-500 mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold">Sample Not Found</h2>
          <p className="text-muted-foreground mt-2 text-center">
            The sample you are looking for does not exist or has been removed
          </p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => router.push("/samples")}
          >
            Browse Samples
          </Button>
        </div>
      </div>
    )
  }

  const availableFormats = getAvailableFormats()

  return (
    <PageLayout
      breadcrumbs={[
        { name: "Home", href: "/", active: false },
        { name: "Samples", href: "/samples", active: false },
        { name: sample.title, href: "#", active: true },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Cover image with overlay gradient and play button */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <div className="relative overflow-hidden rounded-lg mb-4 aspect-square w-full max-h-[250px] sm:max-h-[280px] bg-card group">
            {getCoverImage(sample) ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <Image
                  src={getCoverImage(sample)}
                  alt={sample.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 350px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder-cover.jpg";
                  }}
                />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-20">
                  <div className="text-xs font-medium text-white/90 bg-primary/80 px-2 py-1 rounded-full backdrop-blur-sm">
                    {sample.samplePack?.title}
                  </div>
                  <Button
                    onClick={togglePlayPause}
                    size="sm"
                    variant="default"
                    className="h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 shadow-md hover:shadow-primary/20"
                  >
                    {isCurrentSample && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-card">
                <Music className="h-20 w-20 text-muted-foreground/50" />
              </div>
            )}
          </div>
          
          {/* Player controls - with fixed duration display */}
          <div className="mb-4 bg-card rounded-md p-2.5">
            <div className="flex justify-between items-center mb-0.5">
              <div className="text-xs font-medium text-foreground">
                {isCurrentSample ? formatDuration(currentTime) : formatDuration(0)} / {sample.duration && isFinite(sample.duration) ? formatDuration(sample.duration) : "..."}
              </div>
              <div className="flex gap-1">
                <Button
                  onClick={toggleFavorite}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full hover:bg-primary/10"
                >
                  {isFavorite ? (
                    <Heart className="h-3 w-3 text-primary fill-current" />
                  ) : (
                    <Heart className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  onClick={shareLink}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full hover:bg-primary/10"
                >
                  <Share className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <AudioProgressBar 
              currentTime={isCurrentSample ? currentTime : 0}
              duration={sample.duration}
              onSeek={handleSeek}
            />
          </div>
          
          {/* Sample metadata section with improved visuals */}
          <div className="bg-card rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2">
              {sample.bpm && (
                <div className="flex flex-col items-center justify-center p-1.5 bg-background rounded-md transition-all hover:bg-primary/5">
                  <Hash className="h-4 w-4 text-primary mb-0.5" />
                  <span className="text-base font-bold">{sample.bpm}</span>
                  <span className="text-xs text-muted-foreground">BPM</span>
                </div>
              )}
              
              {sample.key && (
                <div className="flex flex-col items-center justify-center p-1.5 bg-background rounded-md transition-all hover:bg-primary/5">
                  <Music2 className="h-4 w-4 text-primary mb-0.5" />
                  <span className="text-base font-bold">{sample.key}</span>
                  <span className="text-xs text-muted-foreground">Key</span>
                </div>
              )}
              
              {sample.duration && isFinite(sample.duration) && (
                <div className="flex flex-col items-center justify-center p-1.5 bg-background rounded-md transition-all hover:bg-primary/5">
                  <Clock className="h-4 w-4 text-primary mb-0.5" />
                  <span className="text-base font-bold">{formatDuration(sample.duration)}</span>
                  <span className="text-xs text-muted-foreground">Duration</span>
                </div>
              )}
              
              {sample.tags && sample.tags.length > 0 && sample.tags[0] && (
                <div className="flex flex-col items-center justify-center p-1.5 bg-background rounded-md transition-all hover:bg-primary/5">
                  <Tag className="h-4 w-4 text-primary mb-0.5" />
                  <span className="text-base font-bold truncate max-w-full">{sample.tags[0].startsWith("genre:") ? sample.tags[0].replace("genre:", "") : sample.tags[0]}</span>
                  <span className="text-xs text-muted-foreground">Genre</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side content - information and purchase options */}
        <div className="lg:col-span-2">
          <Card className="border-transparent bg-black/20 hover:bg-black/25 transition-colors shadow-sm overflow-hidden mb-5">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold leading-tight mb-1 line-clamp-2">
                      {sample.title}
                    </h1>
                    {sample.samplePack && (
                      <Link 
                        href={`/packs/${sample.samplePack.id}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-1"
                      >
                        <Album className="h-3 w-3" />
                        <span>From: {sample.samplePack.title}</span>
                      </Link>
                    )}
                    {sample.samplePack?.creator?.user?.name && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>By: {sample.samplePack.creator.user.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-7 w-7 p-0"
                      onClick={toggleFavorite}
                    >
                      {isFavorite ? (
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={shareLink}>
                          <Share className="h-3 w-3 mr-2" />
                          <span>Share Link</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Purchase options revamped */}
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-md p-4">
                  <SectionHeading 
                    title="Purchase Options" 
                    className="mb-3"
                    actions={
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        Royalty-free
                      </Badge>
                    }
                  />

                  {/* Format selector */}
                  <ToggleGroup
                    type="single"
                    value={selectedFormat ?? undefined}
                    onValueChange={(value) => setSelectedFormat(value as 'WAV' | 'STEMS' | 'MIDI' | null)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4"
                  >
                    {availableFormats.map(({ format, price }) => (
                      <ToggleGroupItem
                        key={format}
                        value={format}
                        className="bg-background border border-primary/30 data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary rounded-md p-3 flex flex-col items-center justify-center cursor-pointer transition-colors"
                      >
                        <span className="text-sm font-semibold mb-0.5">{format}</span>
                        <span className="text-xs text-muted-foreground">${price.toFixed(2)}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>

                  {/* Add to cart button */}
                  <Button
                    className="w-full bg-primary hover:bg-primary/80 text-white gem-shine"
                    size="sm"
                    disabled={!selectedFormat || isInCart}
                    onClick={() => {
                      if (!selectedFormat) return;
                      const formatLower = selectedFormat.toLowerCase() as 'wav' | 'stems' | 'midi';
                      addToCart(sample.id, formatLower);
                    }}
                  >
                    {isInCart ? 'In Cart' : selectedFormat ? `Add ${selectedFormat} to Cart` : 'Select Format'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Description */}
          {sample.description && (
            <div className="mb-4">
              <SectionHeading title="Description" className="mb-2" />
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {sample.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {sample.tags && sample.tags.length > 1 && (
            <div className="mb-4">
              <SectionHeading title="Tags" className="mb-2" />
              <div className="flex flex-wrap gap-2">
                {sample.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* What you get section with improved spacing */}
          <div className="bg-black/20 rounded-md p-4 mb-4">
            <SectionHeading title="What You Get" className="mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sample.hasWav && (
                <div className="flex items-center gap-2 bg-black/20 rounded-md p-2">
                  <div className="rounded-full bg-violet-500/20 p-1.5">
                    <Download className="h-3 w-3 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">WAV File</div>
                    <div className="text-[10px] text-zinc-500">High quality audio</div>
                  </div>
                </div>
              )}
              {sample.hasStems && (
                <div className="flex items-center gap-2 bg-black/20 rounded-md p-2">
                  <div className="rounded-full bg-blue-500/20 p-1.5">
                    <Download className="h-3 w-3 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Stems</div>
                    <div className="text-[10px] text-zinc-500">Individual tracks</div>
                  </div>
                </div>
              )}
              {sample.hasMidi && (
                <div className="flex items-center gap-2 bg-black/20 rounded-md p-2">
                  <div className="rounded-full bg-emerald-500/20 p-1.5">
                    <Download className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">MIDI File</div>
                    <div className="text-[10px] text-zinc-500">Full customization</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
} 