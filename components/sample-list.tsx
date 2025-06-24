"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Heart, ShoppingCart, ExternalLink, Hash, Music2, Clock, Tag, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { formatPrice, formatDuration, downloadSample } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useAudio } from "@/lib/audio-context"
import { useSampleOwnership } from "@/lib/hooks/use-sample-ownership"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast as sonnerToast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import React from "react"
import { useBatchSampleOwnership } from "@/lib/hooks/use-sample-ownership"

// --- Sub-components for SampleItem ---

const AudioProgressBar = React.memo(({ 
  currentTime = 0, 
  duration = 0, 
  onSeek,
  waveformData,
  isCurrent = false
}: { 
  currentTime?: number; 
  duration?: number; 
  onSeek?: (time: number) => void;
  waveformData?: string | null;
  isCurrent?: boolean;
}) => {
  // Use a more reliable duration - prefer the passed duration, fallback to a reasonable default
  const safeDuration = useMemo(() => {
    if (isFinite(duration) && duration > 0) {
      return duration;
    }
    return 30; // Default 30 second duration for display purposes
  }, [duration]);
  
  // Calculate progress with safe values
  const progress = useMemo(() => {
    if (!isCurrent || !isFinite(currentTime) || !isFinite(safeDuration) || safeDuration <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));
  }, [currentTime, safeDuration, isCurrent]);
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !isFinite(safeDuration) || safeDuration <= 0) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const seekTime = ((e.clientX - rect.left) / rect.width) * safeDuration;
    onSeek(seekTime);
  }, [onSeek, safeDuration]);
  
  return (
    <div 
      className="h-7 bg-black/40 rounded-md relative cursor-pointer overflow-hidden border border-zinc-800/30"
      onClick={handleClick}
    >
      <div className="absolute inset-0 flex items-center space-x-0.5 px-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className="h-full flex-1 bg-indigo-500/30" 
            style={{ 
              height: `${(20 + Math.sin(i * 0.4) * 5 + Math.cos(i * 0.1) * 25) + 30}%`,
              opacity: i % 2 === 0 ? 0.9 : 0.5
            }} 
          />
        ))}
      </div>
      <div 
        className="h-full bg-indigo-500/40 absolute left-0 top-0 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-zinc-300 font-medium tracking-wide">
          {isCurrent ? formatDuration(currentTime) : "0:00"} / {formatDuration(safeDuration)}
        </span>
      </div>
    </div>
  );
});
AudioProgressBar.displayName = 'AudioProgressBar';


const SamplePlayButton = React.memo(({ 
  sample, 
  onPlay, 
  isCurrent, 
  isPlaying 
}: { 
  sample: SampleWithDetails, 
  onPlay: (e: React.MouseEvent) => void, 
  isCurrent: boolean, 
  isPlaying: boolean 
}) => {
    const router = useRouter();
    const {data: session} = useSession();

    const handlePlayClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if(!session) {
            sonnerToast.error("Please log in to preview samples.", {
                action: {
                  label: "Login",
                  onClick: () => router.push("/api/auth/signin"),
                },
            });
            return;
        }
        onPlay(e);
    }, [session, onPlay, router]);

    // Memoize the cover image to prevent recalculation
    const coverImage = useMemo(() => getCoverImage(sample), [sample]);

    return (
        <div className="relative flex-shrink-0">
            <Image
                src={coverImage}
                alt={sample.title}
                width={56}
                height={56}
                className="object-cover rounded-md w-14 h-14 border border-zinc-800/30"
            />
            <button
                onClick={handlePlayClick}
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
            >
                {isCurrent && isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </button>
        </div>
    );
});
SamplePlayButton.displayName = 'SamplePlayButton';

const SampleDetails = React.memo(({ 
  sample, 
  isCurrent, 
  currentTime, 
  playerDuration, 
  onSeek 
}: { 
  sample: SampleWithDetails, 
  isCurrent: boolean, 
  currentTime: number, 
  playerDuration: number, 
  onSeek: (time: number) => void 
}) => {
    const router = useRouter();
    
    // Memoize the navigation handler
    const handleNavigation = useCallback(() => {
        router.push(sample.slug || `/samples/${sample.id}`);
    }, [router, sample.slug, sample.id]);
    
    // Determine the duration to use - prefer sample's own duration, then player duration
    const displayDuration = useMemo(() => {
        if (isCurrent && isFinite(playerDuration) && playerDuration > 0) {
            return playerDuration;
        }
        if (isFinite(sample.duration) && sample.duration > 0) {
            return sample.duration;
        }
        return 30; // Default fallback
    }, [isCurrent, playerDuration, sample.duration]);
    
    return (
        <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between">
                <div 
                    className="truncate cursor-pointer"
                    onClick={handleNavigation}
                >
                    <h3 className="text-sm font-medium truncate group-hover:text-indigo-300 transition-colors">
                        {sample.title}
                    </h3>
                    <p className="text-xs text-zinc-500 truncate">
                        by {sample.samplePack?.creator?.user?.name || 'Unknown Artist'}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {sample.key && <Badge variant="outline">{sample.key}</Badge>}
                    {sample.bpm && <Badge variant="outline">{sample.bpm} BPM</Badge>}
                </div>
            </div>
            <div className="mt-2">
                <AudioProgressBar 
                    currentTime={isCurrent ? currentTime : 0}
                    duration={displayDuration}
                    onSeek={onSeek}
                    waveformData={sample.waveformData}
                    isCurrent={isCurrent}
                />
            </div>
        </div>
    );
});
SampleDetails.displayName = 'SampleDetails';

const SampleActions = React.memo(({ 
  sample, 
  isOwned, 
  onAddToCart 
}: { 
  sample: SampleWithDetails, 
  isOwned: boolean, 
  onAddToCart: (sample: SampleWithDetails, format: 'WAV' | 'STEMS' | 'MIDI') => void 
}) => {
    const { toast } = useToast();

    const handleDownload = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        const fileName = `${sample.title.replace(/[^\w\s-]/g, "")}.wav`;
        
        try {
            const res = await fetch(`/api/download/sample/${sample.id}`);
            if (!res.ok) throw new Error('Failed to get download link');
            const { url } = await res.json();
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            sonnerToast.success("Download started!");
        } catch (error) {
            console.error("Download error:", error);
            sonnerToast.error("Download failed. Please try again.");
        }
    }, [sample.id, sample.title]);

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (sample.wavPrice > 0) {
            onAddToCart(sample, 'WAV');
        } else {
            toast({ title: "Free Sample", description: "This sample is free and can be downloaded directly."});
        }
    }, [sample, onAddToCart, toast]);

    return (
        <div className="flex-shrink-0 flex items-center gap-3 w-28 justify-end">
            <p className="text-sm font-medium w-20 text-right">
                {formatPrice(sample.wavPrice)}
            </p>
            {isOwned ? (
                <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
                    <Download className="h-4 w-4" />
                </Button>
            ) : (
                <Button variant="ghost" size="icon" onClick={handleAddToCart} title="Add to cart">
                    <ShoppingCart className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
});
SampleActions.displayName = 'SampleActions';

interface SampleWithDetails {
  id: string
  title: string
  fileUrl: string
  waveformData?: string | null
  duration?: number
  bpm?: number
  key?: string
  tags?: string[]
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  wavPrice?: number
  stemsPrice?: number
  midiPrice?: number
  coverImage?: string | null
  audioUrl?: string
  samplePack?: {
    id: number
    title: string
    coverImage?: string | null
    creator?: {
      user?: {
        name?: string
      }
    }
  }
  slug?: string
}

interface SampleListProps {
  samples: SampleWithDetails[]
  onDelete?: (sampleId: string) => void
}

// Helper function to get the cover image
const getCoverImage = (sample: SampleWithDetails): string => {
  return sample.coverImage || sample.samplePack?.coverImage || "/images/placeholder-cover.jpg";
};

// Memoized SampleItem component to prevent unnecessary re-renders
const SampleItem = React.memo(({ 
  sample, 
  onPlay, 
  onAddToCart, 
  onSeek,
  isOwned,
  currentSample,
  isPlaying,
  currentTime,
  playerDuration
}: { 
  sample: SampleWithDetails; 
  onPlay: (sample: SampleWithDetails) => void; 
  onAddToCart?: (sample: SampleWithDetails, format: 'WAV' | 'STEMS' | 'MIDI') => void; 
  onSeek?: (time: number) => void;
  isOwned: boolean;
  currentSample: any;
  isPlaying: boolean;
  currentTime: number;
  playerDuration: number;
}) => {
  const isCurrentSample = currentSample?.id === sample.id;
  
  // Stable handler for playing
  const handlePlay = useCallback(() => {
    onPlay(sample);
  }, [onPlay, sample]);
  
  // Stable handler for seeking
  const handleSeek = useCallback((time: number) => {
    if (onSeek) {
      onSeek(time);
    }
  }, [onSeek]);
  
  return (
    <div className={`group flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 ${isCurrentSample ? 'bg-indigo-500/10' : 'hover:bg-zinc-800/50'}`}>
      <SamplePlayButton
        sample={sample}
        onPlay={handlePlay}
        isCurrent={isCurrentSample}
        isPlaying={isPlaying}
      />
      <SampleDetails
        sample={sample}
        isCurrent={isCurrentSample}
        currentTime={currentTime}
        playerDuration={playerDuration}
        onSeek={handleSeek}
      />
      <SampleActions
        sample={sample}
        isOwned={isOwned}
        onAddToCart={onAddToCart}
      />
    </div>
  );
});
SampleItem.displayName = 'SampleItem';

export function SampleList({ samples, onDelete }: SampleListProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { 
    currentSample, 
    isPlaying, 
    playSample, 
    togglePlayPause,
    isLoading: isPlayerLoading,
    seek,
    currentTime,
    duration
  } = useAudio()
  const { toast } = useToast()

  const [visibleSamples, setVisibleSamples] = useState(20)

  // Batch fetch ownership status
  const sampleIds = useMemo(() => samples.map(s => s.id), [samples]);
  const { ownership: ownershipMap, isLoading: isOwnershipLoading } = useBatchSampleOwnership(sampleIds);

  const loadMoreSamples = useCallback(() => {
    setVisibleSamples(prev => Math.min(prev + 20, samples.length))
  }, [samples.length])

  const addToCart = useCallback(async (sample: SampleWithDetails, format: 'WAV' | 'STEMS' | 'MIDI') => {
    const price = sample.wavPrice || 0;
    if (price <= 0) {
      toast({
        title: "Not available",
        description: "This format is not available for purchase.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: sample.id,
          format,
          price
        }),
      });

      if (response.ok) {
        toast({
          title: "Added to cart",
          description: `${sample.title} (${format}) added to your cart`,
        })
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    }
  }, [toast]);

  // Setup infinite scrolling
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >
      document.documentElement.offsetHeight - 500 && 
      visibleSamples < samples.length
    ) {
      loadMoreSamples()
    }
  }, [loadMoreSamples, visibleSamples, samples.length])

  // Add scroll listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Stable handlers
  const handlePlay = useCallback((sample: SampleWithDetails) => {
      playSample({
        id: sample.id,
        title: sample.title,
      audioUrl: `/api/audio/${sample.id}`,
      duration: sample.duration,
      creator: sample.samplePack?.creator?.user?.name
    });
  }, [playSample]);

  const handleSeek = useCallback((time: number) => {
        seek(time);
  }, [seek]);

  return (
    <div>
      {/* Table header - only visible on medium screens and up */}
      <div className="border-b border-zinc-800/30 px-4 py-3 hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
        <div className="w-12"></div> {/* Play button column */}
        <div>TITLE & WAVEFORM</div>
        <div className="w-56 hidden lg:flex justify-end px-3">METADATA</div>
        <div className="w-24 flex justify-end">PRICE</div>
      </div>
      
      {/* Samples list */}
      <div>
        {samples.slice(0, visibleSamples).map(sample => (
          <SampleItem
            key={sample.id}
            sample={sample}
            onPlay={handlePlay}
            onAddToCart={addToCart}
            onSeek={handleSeek}
            isOwned={ownershipMap[sample.id] || false}
            currentSample={currentSample}
            isPlaying={isPlaying}
            currentTime={currentTime}
            playerDuration={duration}
          />
        ))}
      </div>
      
      {/* Load more indicator */}
      {visibleSamples < samples.length && (
        <div className="py-4 sm:py-6 text-center">
          <Button 
            variant="outline" 
            onClick={loadMoreSamples}
            className="text-indigo-300 hover:text-indigo-200 border-indigo-800/50 hover:bg-indigo-900/20 px-4 sm:px-6 rounded-full text-sm"
          >
            Load More Samples
          </Button>
        </div>
      )}
      
      {/* Empty state */}
      {samples.length === 0 && (
        <div className="py-12 sm:py-20 text-center">
          <Music2 className="h-10 w-10 sm:h-14 sm:w-14 mx-auto text-zinc-700 mb-4" />
          <h3 className="text-lg sm:text-xl font-medium mb-2">No samples found</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-4 sm:mb-6 text-sm sm:text-base px-4">
            Try adjusting your filters or search for something else.
          </p>
          <Button variant="outline" className="border-indigo-800/50 text-indigo-300 hover:bg-indigo-900/20 text-sm">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}