"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SecureAudioPlayerProps {
  url: string
  className?: string
  onPlayStateChange?: (isPlaying: boolean) => void
}

export function SecureAudioPlayer({ url, className, onPlayStateChange }: SecureAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Prevent right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  // Prevent keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        togglePlay()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying])

  // Initialize audio with security measures
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current
    let cleanupFn: (() => void) | undefined

    // Set up audio with blob URL
    const setupAudio = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log("Fetching audio from:", url)

        // Fetch audio with credentials
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })

        console.log("Response status:", response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          throw new Error(`Failed to load audio: ${response.status} ${errorText}`)
        }

        const contentType = response.headers.get('content-type')
        console.log("Content type:", contentType)

        const blob = await response.blob()
        console.log("Blob size:", blob.size, "type:", blob.type)
        
        const blobUrl = URL.createObjectURL(blob)
        console.log("Created blob URL")

        // Set audio source
        setAudioUrl(blobUrl)
        
        // Clean up blob URL when component unmounts
        cleanupFn = () => {
          console.log("Revoking blob URL")
          URL.revokeObjectURL(blobUrl)
        }
      } catch (err) {
        console.error("Audio loading error:", err)
        setError(err instanceof Error ? err.message : 'Failed to load audio')
      } finally {
        setIsLoading(false)
      }
    }

    setupAudio()

    // Event listeners
    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded, duration:", audio.duration)
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      console.log("Audio playback ended")
      setIsPlaying(false)
      if (onPlayStateChange) onPlayStateChange(false)
      setCurrentTime(0)
    }

    const handleError = (e: ErrorEvent) => {
      console.error("Audio element error:", e)
      setError('Failed to play audio')
      setIsLoading(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError as EventListener)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError as EventListener)
      if (cleanupFn) cleanupFn()
    }
  }, [url, onPlayStateChange])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (onPlayStateChange) onPlayStateChange(false)
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
          if (onPlayStateChange) onPlayStateChange(true)
        })
        .catch(err => {
          console.error("Error playing audio:", err)
          setError("Failed to play audio: " + (err.message || "Unknown error"))
        });
    }
  }

  const handleTimeChange = (value: number[]) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return
    const newVolume = value[0]
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50/10">
        {error}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        style={{ display: 'none' }}
      />
      
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            disabled={isLoading || !audioUrl}
            className="flex-shrink-0 h-7 w-7 p-0 hover:bg-primary/10 rounded-full flex items-center justify-center"
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

        <div className="flex-1 mx-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleTimeChange}
            className="w-full"
            disabled={isLoading || !audioUrl}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <span className="tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            disabled={isLoading || !audioUrl}
            className="flex-shrink-0 h-7 w-7 p-0 hover:bg-primary/10 rounded-full flex items-center justify-center"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <div className="flex items-center">
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-16"
              disabled={isLoading || !audioUrl}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 