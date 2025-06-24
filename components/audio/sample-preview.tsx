"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Heart, Pause, Play, Plus, SkipBack, SkipForward, Loader2 } from "lucide-react"
import { AudioMetadata } from "./audio-metadata"
import { Waveform } from "./waveform"
import { useAudioPreview } from "./audio-preview-system"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SamplePreviewProps {
  sample: {
    id: string
    title: string
    fileUrl: string
    bpm?: number
    key?: string
    duration?: string
    tags?: string[]
    price?: number
    isFavorited?: boolean
  }
  onFavorite?: (id: string) => void
  onDownload?: (id: string) => void
  variant?: "default" | "compact"
  className?: string
}

export function SamplePreview({
  sample,
  onFavorite,
  onDownload,
  variant = "default",
  className
}: SamplePreviewProps) {
  const {
    currentSampleId,
    isPlaying,
    isLoading,
    loadingError,
    progress,
    togglePlay,
    seek,
    addToQueue,
    skipToNext,
    skipToPrevious,
    isAutoplay,
    toggleAutoplay,
    queue
  } = useAudioPreview()

  const isCurrentSample = currentSampleId === sample.id
  const isThisPlaying = isPlaying && isCurrentSample
  const isThisLoading = isLoading && isCurrentSample
  const hasError = loadingError && isCurrentSample
  const isInQueue = queue.some(s => s.id === sample.id)

  const handlePlayPause = async () => {
    await togglePlay(sample.id, sample.fileUrl)
  }

  const handleAddToQueue = () => {
    addToQueue({
      id: sample.id,
      url: sample.fileUrl
    })
  }

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(sample.id)
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(sample.id)
    }
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center justify-between gap-4", className)}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="shrink-0 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 transition-all duration-200 shadow-sm hover:shadow-primary/20"
              disabled={isThisLoading}
            >
              {isThisLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isThisPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            {isCurrentSample && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipToPrevious}
                  className="shrink-0"
                  disabled={isThisLoading}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipToNext}
                  className="shrink-0"
                  disabled={isThisLoading}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{sample.title}</div>
            <AudioMetadata
              bpm={sample.bpm}
              key={sample.key}
              duration={sample.duration}
              variant="compact"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddToQueue}
                disabled={isInQueue || isThisLoading}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInQueue ? "Already in queue" : "Add to queue"}
            </TooltipContent>
          </Tooltip>
          {onFavorite && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              disabled={isThisLoading}
              className={cn(
                "shrink-0",
                sample.isFavorited && "text-primary"
              )}
            >
              <Heart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{sample.title}</div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddToQueue}
                    disabled={isInQueue || isThisLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isInQueue ? "Already in queue" : "Add to queue"}
                </TooltipContent>
              </Tooltip>
              {onFavorite && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavorite}
                  disabled={isThisLoading}
                  className={cn(
                    sample.isFavorited && "text-primary"
                  )}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              )}
              {onDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  disabled={isThisLoading}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  disabled={isThisLoading}
                  className="rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 transition-all duration-200 shadow-sm hover:shadow-primary/20"
                >
                  {isThisLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isThisPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                {isCurrentSample && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipToPrevious}
                      disabled={isThisLoading}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipToNext}
                      disabled={isThisLoading}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <AudioMetadata
                  bpm={sample.bpm}
                  key={sample.key}
                  duration={sample.duration}
                  tags={sample.tags}
                />
              </div>
            </div>

            {hasError ? (
              <Alert variant="destructive">
                <AlertDescription>{loadingError}</AlertDescription>
              </Alert>
            ) : (
              <Waveform
                audioUrl={sample.fileUrl}
                isPlaying={isThisPlaying}
                onSeek={(value) => seek(value)}
              />
            )}
          </div>

          {sample.price !== undefined && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Price
              </div>
              <div className="font-medium">
                ${sample.price.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 