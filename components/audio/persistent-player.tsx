"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronUp, 
  Music,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useAudio } from "@/lib/audio-context"
import { cn } from "@/lib/utils"

export function PersistentPlayer() {
  const { 
    currentSample, 
    isPlaying,
    isLoading, 
    volume, 
    currentTime, 
    duration, 
    togglePlayPause, 
    setVolume, 
    seek, 
    closePlayer 
  } = useAudio()
  
  const [isMuted, setIsMuted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [prevVolume, setPrevVolume] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [localTime, setLocalTime] = useState(0)
  
  // Get the most reliable duration value
  const safeDuration = (() => {
    // First, try the audio element's duration (most accurate)
    if (isFinite(duration) && duration > 0) {
      return duration;
    }
    // Fallback to sample metadata duration
    if (currentSample?.duration && isFinite(currentSample.duration) && currentSample.duration > 0) {
      return currentSample.duration;
    }
    // Last resort fallback
    return 100;
  })();

  // Get the current time with safety checks
  const safeCurrentTime = (() => {
    if (isDragging) {
      return localTime;
    }
    if (isFinite(currentTime) && currentTime >= 0) {
      return Math.min(currentTime, safeDuration);
    }
    return 0;
  })();

  // Update local time when currentTime changes (if not dragging)
  useEffect(() => {
    if (!isDragging && isFinite(currentTime) && currentTime >= 0) {
      setLocalTime(Math.min(currentTime, safeDuration));
    }
  }, [currentTime, isDragging, safeDuration]);

  const formatTime = useCallback((time: number) => {
    if (!isFinite(time) || time < 0) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(prevVolume)
      setIsMuted(false)
    } else {
      setPrevVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }, [isMuted, prevVolume, volume, setVolume]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded]);

  const handleSeek = useCallback((value: number[]) => {
    const time = value[0];
    if (isFinite(time) && time >= 0 && time <= safeDuration) {
      console.log("Seeking to time:", time);
      setLocalTime(time);
      seek(time);
    }
  }, [safeDuration, seek]);

  const handleSliderDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSliderDragEnd = useCallback(() => {
    setIsDragging(false);
    // Ensure we seek to the current localTime when dragging ends
    if (isFinite(localTime) && localTime >= 0 && localTime <= safeDuration) {
      seek(localTime);
    }
  }, [localTime, safeDuration, seek]);

  const handleSliderChange = useCallback((value: number[]) => {
    const time = value[0];
    if (isFinite(time) && time >= 0 && time <= safeDuration) {
      setLocalTime(time);
    }
  }, [safeDuration]);

  // If no current sample, don't render anything
  if (!currentSample) return null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-zinc-800 transition-all duration-300 z-50",
      isExpanded ? "h-64" : "h-auto"
    )}>
      <div className="container mx-auto h-full">
        {/* Collapsed View */}
        <div className="flex flex-wrap items-center justify-between min-h-[4rem] px-2 py-2 md:px-4">
          <div className="flex items-center gap-3 flex-1 min-w-0 order-1">
            <div className="h-10 w-10 bg-zinc-800 rounded-md flex items-center justify-center flex-shrink-0">
              <Music className="h-5 w-5 text-zinc-400" />
            </div>
            
            <div className="flex flex-col overflow-hidden">
              <Link 
                href={`/samples/${currentSample.id}`} 
                className="text-sm font-medium truncate hover:text-primary transition-colors"
              >
                {currentSample.title}
              </Link>
              {currentSample.creator && (
                <span className="text-xs text-zinc-400 truncate">
                  {currentSample.creator}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 order-2 md:order-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="h-9 w-9 rounded-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-8 w-8 rounded-full"
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={(value) => {
                  setVolume(value[0])
                  setIsMuted(value[0] === 0)
                }}
                className="w-20"
              />
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpand}
                className="h-8 w-8 rounded-full hidden md:flex"
              >
                <ChevronUp className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded ? "rotate-180" : ""
                )} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePlayer}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="w-full order-3 md:order-2 md:w-auto md:flex-1 md:max-w-md mt-2 md:mt-0 md:mx-4">
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-zinc-400 w-8 text-right">
                {formatTime(safeCurrentTime)}
              </span>
              <Slider
                value={[safeCurrentTime]}
                max={safeDuration}
                step={0.1}
                onValueChange={handleSliderChange}
                onValueCommit={handleSeek}
                onPointerDown={handleSliderDragStart}
                onPointerUp={handleSliderDragEnd}
                className={cn("w-full", isLoading && "opacity-50")}
                disabled={isLoading}
              />
              <span className="text-xs text-zinc-400 w-8">
                {formatTime(safeDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-4 pt-2 pb-4 h-[calc(100%-5rem)] flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-40 h-40 bg-zinc-800 rounded-md flex items-center justify-center">
                <Music className="h-16 w-16 text-zinc-400" />
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">
                  {formatTime(safeCurrentTime)}
                </span>
                <span className="text-xs text-zinc-400">
                  {formatTime(safeDuration)}
                </span>
              </div>
              <Slider
                value={[safeCurrentTime]}
                max={safeDuration}
                step={0.1}
                onValueChange={handleSliderChange}
                onValueCommit={handleSeek}
                onPointerDown={handleSliderDragStart}
                onPointerUp={handleSliderDragEnd}
                className={cn("w-full", isLoading && "opacity-50")}
                disabled={isLoading}
              />
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-10 w-10 rounded-full"
              >
                {volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={togglePlayPause}
                className="h-14 w-14 rounded-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={closePlayer}
                className="h-10 w-10 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 