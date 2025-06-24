"use client"

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"

// Check if code is running in browser environment
const isBrowser = typeof window !== 'undefined'

// Audio buffer cache to prevent reloading the same audio files
// Use a more efficient caching mechanism with size limits
interface AudioCacheItem {
  element: HTMLAudioElement;
  lastAccessed: number;
}

class AudioCache {
  private cache = new Map<string, AudioCacheItem>();
  private maxSize: number;
  
  constructor(maxSize = 20) {
    this.maxSize = maxSize;
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  get(key: string): HTMLAudioElement | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Update last accessed time
      item.lastAccessed = Date.now();
      return item.element;
    }
    return undefined;
  }
  
  set(key: string, audio: HTMLAudioElement): void {
    // Evict least recently used items if cache is full
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      this.cache.forEach((item, itemKey) => {
        if (item.lastAccessed < oldestTime) {
          oldestTime = item.lastAccessed;
          oldestKey = itemKey;
        }
      });
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      element: audio,
      lastAccessed: Date.now()
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Only create cache in browser environment
const audioBufferCache = isBrowser ? new AudioCache(20) : null;

interface Sample {
  id: string
  title: string
  creator?: string
  audioUrl: string
  duration?: number
  [key: string]: any
}

interface AudioContextType {
  currentSample: Sample | null
  isPlaying: boolean
  isLoading: boolean
  volume: number
  currentTime: number
  duration: number
  playSample: (sample: Sample) => void
  togglePlayPause: () => void
  setVolume: (volume: number) => void
  seek: (time: number) => void
  closePlayer: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentSample, setCurrentSample] = useState<Sample | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const { toast } = useToast()
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef(false)
  const lastSampleIdRef = useRef<string | null>(null)
  
  // Initialize audio element when component mounts
  useEffect(() => {
    if (!isBrowser) return;

    if (!audioRef.current) {
      const audio = new Audio()
      audio.volume = volume
      audio.preload = "metadata"
      audioRef.current = audio
    }
    
    // Clean up when component unmounts
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
    }
  }, [volume])
  
  // Handle play request for a sample
  const playSample = useCallback(async (sample: Sample) => {
    if (!isBrowser || !audioRef.current) return;
    
    console.log(`Playing sample: ${sample.title} (ID: ${sample.id})`);
    
    // If it's the same sample, just toggle play/pause
    if (lastSampleIdRef.current === sample.id && currentSample?.id === sample.id) {
      console.log("Same sample - toggling play/pause");
      setIsPlaying(!isPlaying);
      return;
    }
    
    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Set the current sample and update ref
    setCurrentSample(sample);
    lastSampleIdRef.current = sample.id;
    
    // Reset states
    setIsLoading(true);
    setCurrentTime(0);
    setIsPlaying(true);
    
    // Set duration from sample metadata if available
    if (sample.duration && isFinite(sample.duration) && sample.duration > 0) {
      console.log(`Setting initial duration from sample metadata: ${sample.duration}`);
      setDuration(sample.duration);
    } else {
      setDuration(0);
    }
    
    // Validate audio URL
    if (!sample.audioUrl) {
      console.error("Sample has no audio URL");
      setIsLoading(false);
      setIsPlaying(false);
      toast({
        title: "Audio Error",
        description: "This sample has no audio file",
        variant: "destructive",
      });
      return;
    }
    
    // Set up the audio source
    const audio = audioRef.current;
    if (audio.src !== sample.audioUrl) {
      console.log("Setting new audio source:", sample.audioUrl);
      audio.src = sample.audioUrl;
      audio.load();
    }
    
    // Fallback timeout to exit loading state
    loadingTimeoutRef.current = setTimeout(() => {
      console.log("Loading timeout reached, forcing ready state");
      setIsLoading(false);
    }, 5000);
    
  }, [isBrowser, currentSample, isPlaying, toast]);
  
  // Main effect for handling audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!isBrowser || !audio || !currentSample) {
      return;
    }

    const handleCanPlay = () => {
      console.log("Audio can play now");
      setIsLoading(false);
      
      // Clear loading timeout since audio is ready
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (isPlaying) {
        audio.play().catch(e => {
          console.error("Autoplay was prevented:", e);
          toast({
            title: "Playback Error",
            description: "Your browser prevented audio from playing automatically. Click play again.",
            variant: "destructive",
          });
          setIsPlaying(false);
        });
      }
    };

    const handleTimeUpdate = () => {
      if (!isUpdatingRef.current && audio.currentTime !== currentTime) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      console.log(`Metadata loaded. Duration: ${audio.duration}`);
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      console.log("Audio ended");
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error("Audio player error:", e);
      setIsLoading(false);
      setIsPlaying(false);
      
      // Clear loading timeout on error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      toast({
        title: "Audio Error",
        description: "Could not load or play the audio file.",
        variant: "destructive",
      });
    };

    // Add event listeners
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Cleanup function
    return () => {
      console.log("Cleaning up audio listeners");
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentSample, isPlaying, currentTime, toast]);
  
  // Sync playback state with isPlaying prop
  useEffect(() => {
    if (!isBrowser || !audioRef.current || !currentSample) return;
    
    const audio = audioRef.current;
    
    if (isPlaying && !isLoading) {
      console.log("Attempting to play audio");
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Error playing audio:", err);
          setIsPlaying(false);
        });
      }
    } else if (!isPlaying) {
      audio.pause();
    }
  }, [isPlaying, isLoading, currentSample]);
  
  // Handle volume changes
  useEffect(() => {
    if (!isBrowser || !audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume])
  
  const togglePlayPause = useCallback(() => {
    if (isLoading) return;
    setIsPlaying(!isPlaying);
  }, [isLoading, isPlaying])
  
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && isFinite(time) && isFinite(audio.duration)) {
      const seekableTime = Math.max(0, Math.min(time, audio.duration));
      isUpdatingRef.current = true;
      audio.currentTime = seekableTime;
      setCurrentTime(seekableTime);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, []);
  
  const closePlayer = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setCurrentSample(null)
    setIsPlaying(false)
    setIsLoading(false)
    setCurrentTime(0)
    setDuration(0)
    lastSampleIdRef.current = null;
  }, [])
  
  const value = useMemo(
    () => ({
      currentSample,
      isPlaying,
      isLoading,
      volume,
      currentTime,
      duration,
      playSample,
      togglePlayPause,
      setVolume,
      seek,
      closePlayer,
    }),
    [currentSample, isPlaying, isLoading, volume, currentTime, duration, playSample, togglePlayPause, setVolume, seek, closePlayer]
  )
  
  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  
  return context
} 