"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Pause, Download, Music2, Loader2 } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { useAudio } from "@/lib/audio-context"
import { Waveform } from "@/components/audio/waveform"
import SecurePlayer from "@/components/audio/secure-player"

interface SampleCardProps {
  sample: {
    id: string
    title: string
    bpm: number | null
    key: string | null
    duration: number
    format: string
    wavPrice: number | null
    stemsPrice: number | null
    midiPrice: number | null
    tags: string[]
    quality?: {
      quality: 'low' | 'medium' | 'high'
    }
    samplePack?: {
      title: string
      creator?: {
        user: {
          name: string
        }
      }
    }
  }
}

export function SampleCard({ sample }: SampleCardProps) {
  const { currentSample, isPlaying, isLoading, playSample, togglePlayPause, seek, currentTime, duration } = useAudio()
  const isCurrentSample = currentSample?.id === sample.id
  
  const lowestPrice = Math.min(
    ...[sample.wavPrice, sample.stemsPrice, sample.midiPrice]
      .filter((price): price is number => price !== null)
  )

  const handlePlayClick = () => {
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
  }

  const handleWaveformSeek = (time: number) => {
    // Capture current playback state
    const isCurrentlyPlaying = isCurrentSample && isPlaying;
    
    if (!isCurrentSample) {
      // If this is not the current sample, play it first then seek
      playSample({
        id: sample.id,
        title: sample.title,
        creator: sample.samplePack?.creator?.user?.name,
        duration: sample.duration,
        audioUrl: `/api/audio/${sample.id}`
      });
      
      // Set a small timeout to ensure the audio is loaded before seeking
      setTimeout(() => {
        seek(time);
        // No need to restore playback as playSample already starts playback
      }, 100);
    } else {
      // Direct seek if already the current sample
      seek(time);
      
      // If it was not playing before, ensure it stays paused
      // If it was playing, the audio context will handle continuing playback
      if (!isCurrentlyPlaying) {
        // We don't need to do anything - keep it paused
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-[2/1] bg-muted">
          <Waveform
            audioUrl={`/api/audio/${sample.id}`}
            isPlaying={isCurrentSample && isPlaying}
            waveColor="rgba(124, 58, 237, 0.4)"
            progressColor="rgba(124, 58, 237, 0.8)"
            barWidth={2}
            barGap={2}
            barRadius={3}
            className="absolute inset-0"
            duration={isCurrentSample && isFinite(duration) && duration > 0 ? duration : 
                     (sample.duration && isFinite(sample.duration) && sample.duration > 0 ? sample.duration : undefined)}
            key={`waveform-${sample.id}`}
            onSeek={handleWaveformSeek}
            currentTime={isCurrentSample ? currentTime : undefined}
            lazyLoad={true}
          />
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 transition-all duration-200 shadow-sm hover:shadow-primary/20"
              onClick={handlePlayClick}
              disabled={isLoading && isCurrentSample}
            >
              {isLoading && isCurrentSample ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : isCurrentSample && isPlaying ? (
                <Pause className="h-4 w-4 text-white" />
              ) : (
                <Play className="h-4 w-4 text-white ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2.5 p-4">
        <div className="space-y-1">
          <h3 className="font-semibold leading-none">
            <Link href={`/samples/${sample.id}`} className="hover:underline">
              {sample.title}
            </Link>
          </h3>
          {sample.samplePack && (
            <p className="text-sm text-muted-foreground">
              From {sample.samplePack.title} by {sample.samplePack.creator?.user.name}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {sample.bpm && (
            <Badge variant="secondary">
              {sample.bpm} BPM
            </Badge>
          )}
          {sample.key && (
            <Badge variant="secondary">
              Key: {sample.key}
            </Badge>
          )}
          {sample.duration && isFinite(sample.duration) && sample.duration > 0 && (
            <Badge variant="secondary">
              {formatDuration(sample.duration)}
            </Badge>
          )}
          {sample.quality && (
            <Badge variant="secondary" className={
              sample.quality.quality === 'high' ? 'bg-green-100 text-green-800' :
              sample.quality.quality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }>
              {sample.quality.quality.charAt(0).toUpperCase() + sample.quality.quality.slice(1)} Quality
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {sample.tags.map((tag) => {
            const [type, value] = tag.split(':')
            if (!value) return null
            return (
              <Badge key={tag} variant="outline" className="text-xs">
                {value}
              </Badge>
            )
          })}
        </div>
        <SecurePlayer
          sampleId={sample.id}
          isPreview={true}
          className="mt-2"
        />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handlePlayClick}
            disabled={isLoading && isCurrentSample}
          >
            {isLoading && isCurrentSample ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading
              </>
            ) : isCurrentSample && isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Preview
              </>
            )}
          </Button>
          <Button size="sm" variant="secondary">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
        {lowestPrice !== Infinity && (
          <div className="text-right">
            <div className="text-sm font-medium">
              From ${lowestPrice.toFixed(2)}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
} 