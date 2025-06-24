"use client"

import { createContext, useContext, useRef, useState, useCallback, ReactNode, useEffect } from "react"
import { toast } from "sonner"

interface QueuedSample {
  id: string
  url: string
}

interface AudioPreviewContextType {
  currentSampleId: string | null
  isPlaying: boolean
  isLoading: boolean
  loadingError: string | null
  progress: number
  volume: number
  isMuted: boolean
  isAutoplay: boolean
  queue: QueuedSample[]
  playSample: (sampleId: string, url: string) => Promise<void>
  pauseSample: () => void
  togglePlay: (sampleId: string, url: string) => Promise<void>
  seek: (value: number) => void
  setVolume: (value: number) => void
  toggleMute: () => void
  toggleAutoplay: () => void
  addToQueue: (sample: QueuedSample) => void
  removeFromQueue: (sampleId: string) => void
  clearQueue: () => void
  skipToNext: () => Promise<void>
  skipToPrevious: () => Promise<void>
}

const AudioPreviewContext = createContext<AudioPreviewContextType | undefined>(undefined)

export function AudioPreviewProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentSampleId, setCurrentSampleId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isAutoplay, setIsAutoplay] = useState(false)
  const [queue, setQueue] = useState<QueuedSample[]>([])
  const [playHistory, setPlayHistory] = useState<QueuedSample[]>([])

  const initializeAudio = useCallback(async (url: string) => {
    setIsLoading(true)
    setLoadingError(null)

    try {
      // Check if the audio file exists and is accessible
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) {
        throw new Error(`Failed to load audio file: ${response.statusText}`)
      }

      if (!audioRef.current) {
        audioRef.current = new Audio()
        
        audioRef.current.addEventListener("timeupdate", () => {
          if (audioRef.current) {
            setProgress(audioRef.current.currentTime / audioRef.current.duration)
          }
        })

        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false)
          setProgress(0)
          if (isAutoplay) {
            skipToNext()
          }
        })

        audioRef.current.addEventListener("error", (e) => {
          const error = e.currentTarget as HTMLAudioElement
          setLoadingError(`Error loading audio: ${error.error?.message || 'Unknown error'}`)
          setIsPlaying(false)
          if (isAutoplay) {
            skipToNext()
          }
        })

        audioRef.current.addEventListener("loadstart", () => {
          setIsLoading(true)
        })

        audioRef.current.addEventListener("canplay", () => {
          setIsLoading(false)
        })
      }

      audioRef.current.src = url
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted

      // Preload the audio
      await audioRef.current.load()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio'
      setLoadingError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [volume, isMuted, isAutoplay])

  const playSample = useCallback(async (sampleId: string, url: string) => {
    try {
      // Add current sample to history if it exists
      if (currentSampleId) {
        const currentSample = queue.find(s => s.id === currentSampleId)
        if (currentSample) {
          setPlayHistory(prev => [...prev, currentSample])
        }
      }

      if (currentSampleId !== sampleId) {
        await initializeAudio(url)
        setCurrentSampleId(sampleId)
      }
      
      await audioRef.current?.play()
      setIsPlaying(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio'
      setLoadingError(errorMessage)
      toast.error(errorMessage)
    }
  }, [currentSampleId, queue, initializeAudio])

  const pauseSample = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(async (sampleId: string, url: string) => {
    if (isPlaying && currentSampleId === sampleId) {
      pauseSample()
    } else {
      await playSample(sampleId, url)
    }
  }, [isPlaying, currentSampleId, pauseSample, playSample])

  const seek = useCallback((value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value * audioRef.current.duration
      setProgress(value)
    }
  }, [])

  const handleVolumeChange = useCallback((value: number) => {
    if (audioRef.current) {
      audioRef.current.volume = value
      setVolume(value)
      setIsMuted(value === 0)
    }
  }, [])

  const handleToggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMutedState = !isMuted
      audioRef.current.muted = newMutedState
      setIsMuted(newMutedState)
    }
  }, [isMuted])

  const toggleAutoplay = useCallback(() => {
    setIsAutoplay(prev => !prev)
  }, [])

  const addToQueue = useCallback((sample: QueuedSample) => {
    setQueue(prev => [...prev, sample])
    toast.success("Added to queue")
  }, [])

  const removeFromQueue = useCallback((sampleId: string) => {
    setQueue(prev => prev.filter(s => s.id !== sampleId))
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
    toast.success("Queue cleared")
  }, [])

  const skipToNext = useCallback(async () => {
    if (queue.length === 0) {
      toast.error("No more samples in queue")
      return
    }

    const nextSample = queue[0]
    setQueue(prev => prev.slice(1))
    await playSample(nextSample.id, nextSample.url)
  }, [queue, playSample])

  const skipToPrevious = useCallback(async () => {
    if (playHistory.length === 0) {
      toast.error("No previous samples")
      return
    }

    const previousSample = playHistory[playHistory.length - 1]
    setPlayHistory(prev => prev.slice(0, -1))
    
    // Add current sample to front of queue
    if (currentSampleId) {
      const currentSample = queue.find(s => s.id === currentSampleId)
      if (currentSample) {
        setQueue(prev => [currentSample, ...prev])
      }
    }

    await playSample(previousSample.id, previousSample.url)
  }, [playHistory, currentSampleId, queue, playSample])

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <AudioPreviewContext.Provider
      value={{
        currentSampleId,
        isPlaying,
        isLoading,
        loadingError,
        progress,
        volume,
        isMuted,
        isAutoplay,
        queue,
        playSample,
        pauseSample,
        togglePlay,
        seek,
        setVolume: handleVolumeChange,
        toggleMute: handleToggleMute,
        toggleAutoplay,
        addToQueue,
        removeFromQueue,
        clearQueue,
        skipToNext,
        skipToPrevious,
      }}
    >
      {children}
    </AudioPreviewContext.Provider>
  )
}

export function useAudioPreview() {
  const context = useContext(AudioPreviewContext)
  if (context === undefined) {
    throw new Error("useAudioPreview must be used within an AudioPreviewProvider")
  }
  return context
} 