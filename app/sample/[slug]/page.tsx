"use client"

import { useState, useEffect } from "react"
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
  Share,
  Disc
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
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || duration <= 0) return;
    
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
          {formatDuration(currentTime)} / {formatDuration(duration)}
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
  slug?: string | null 
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

export default function SamplePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { playSample, currentSample, togglePlayPause, isPlaying, seek, currentTime, duration } = useAudio()
  const [sample, setSample] = useState<SampleWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState<'WAV' | 'STEMS' | 'MIDI' | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isInCart, setIsInCart] = useState(false)

  const isCurrentSample = currentSample?.id === sample?.id

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
        console.log("Fetching sample with ID:", params.slug);
        
        // First try with the original slug
        let response = await fetch(`/api/samples/slug/${params.slug}`);
        
        // If that fails, try with alternative format (convert between hyphens and underscores)
        if (!response.ok) {
          console.log("Initial fetch failed, trying alternate format");
          const alternateSlug = params.slug.includes('-') 
            ? params.slug.replace(/-/g, '_') // Convert hyphens to underscores
            : params.slug.replace(/_/g, '-'); // Convert underscores to hyphens
            
          console.log("Trying with alternate slug:", alternateSlug);
          response = await fetch(`/api/samples/slug/${alternateSlug}`);
          
          // If still not found, we'll throw an error
          if (!response.ok) {
            throw new Error("Failed to fetch sample details");
          }
        }
        
        // Parse the successful response
        const data = await response.json();
        console.log("Sample data received:", data.id);
        
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
            description: "Failed to load sample details",
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
  }, [params.slug, toast])

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: `${sample?.title} ${isFavorite ? "removed from" : "added to"} your favorites`,
    });
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: sample?.title || "Check out this sample",
        text: `Check out ${sample?.title} on StealMySample`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    }
  };

  const handleSeek = (time: number) => {
    if (sample) {
      if (isCurrentSample) {
        seek(time);
      } else {
        playSample({
          id: sample.id,
          title: sample.title,
          creator: sample.samplePack?.creator?.user?.name,
          duration: sample.duration,
          audioUrl: `/api/audio/${sample.id}`
        });
        
        // Give it a small amount of time to load before seeking
        setTimeout(() => {
          seek(time);
        }, 100);
      }
    }
  };

  const addToCart = async () => {
    if (!sample || !selectedFormat) {
      toast({
        title: "Error",
        description: "Please select a format",
        variant: "destructive",
      });
      return;
    }

    try {
      let price: number | null = 0;
      
      switch (selectedFormat) {
        case 'WAV':
          price = sample.wavPrice;
          break;
        case 'STEMS':
          price = sample.stemsPrice;
          break;
        case 'MIDI':
          price = sample.midiPrice;
          break;
      }
      
      if (price === null) {
        toast({
          title: "Error",
          description: `${selectedFormat} is not available for this sample`,
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sampleId: sample.id,
          samplePackId: sample.samplePack?.id,
          format: selectedFormat,
          price,
        }),
      });

      if (response.ok) {
        setIsInCart(true);
        toast({
          title: "Added to Cart",
          description: `${sample.title} (${selectedFormat}) added to your cart`,
        });
      } else {
        throw new Error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  // Function to get available formats
  const getAvailableFormats = () => {
    if (!sample) return [];
    
    const formats = [];
    if (sample.hasWav) formats.push('WAV');
    if (sample.hasStems) formats.push('STEMS');
    if (sample.hasMidi) formats.push('MIDI');
    
    return formats;
  };

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
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse-subtle"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Music2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-center">Sample Not Found</h2>
          <p className="text-muted-foreground mt-3 text-center max-w-md">
            We couldn't find the sample you're looking for. It may have been removed or the link might be incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              variant="default" 
              className="px-6" 
              onClick={() => router.push("/samples")}
            >
              <Disc className="mr-2 h-4 w-4" />
              Browse Samples
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const availableFormats = getAvailableFormats()

  return (
    <div className="container max-w-screen-xl mx-auto py-2 px-4 min-h-[calc(100vh-4rem)]">
      <Button 
        variant="ghost" 
        className="w-fit h-7 px-2 py-0 mb-2 -ml-2" 
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-1 h-3 w-3" />
        <span className="text-xs">Back</span>
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 h-full">
        {/* Cover image with overlay gradient and play button */}
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden rounded-lg mb-3 aspect-square w-full max-h-[250px] sm:max-h-[280px] bg-card group">
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
                    onClick={() => {
                      if (isCurrentSample) {
                        togglePlayPause();
                      } else {
                        playSample({
                          id: sample.id,
                          title: sample.title,
                          creator: sample.samplePack?.creator?.user?.name,
                          duration: sample.duration,
                          audioUrl: `/api/audio/${sample.id}`
                        });
                      }
                    }}
                    size="sm"
                    variant="default"
                    className="h-8 w-8 p-0 rounded-full bg-white text-primary hover:bg-white/90 backdrop-blur-sm gem-shine"
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
          
          {/* Rest of the component remains the same... */}
          {/* ... */}
        </div>
      </div>
    </div>
  )
} 