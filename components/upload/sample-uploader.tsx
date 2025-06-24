"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { BatchProcessor } from "./batch-processor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { KeySelector } from "@/components/upload/key-selector"
import { AudioPlayer } from "@/components/audio/audio-player"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Music2, Upload, X, AlertCircle, Minus, Plus, Music, DollarSign, Play, Tag, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { Sample as ValidationSample, SampleMetadata } from "@/lib/validations/sample-pack"
import { Sample } from "./sample-list"
import { TagSelector, categories } from "@/components/upload/tag-selector"
import { PriceSelector, PriceConfig } from "@/components/upload/price-selector"
import { ProcessedSample } from "@/types/sample"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Define a simplified SampleListSample type that matches the expected return type
export interface SampleListSample {
  id: string
  title: string
  url: string
  bpm: number | null
  key: string | null
  tags: string[]
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  wavPrice: number | null
  stemsPrice: number | null
  midiPrice: number | null
  stemsUrl: string | null
  midiUrl: string | null
}

interface SampleUploaderProps {
  onUploadCompleteAction: (samples: SampleListSample[]) => void
  isUploading?: boolean
  maxFiles?: number
}

interface UploadPreview {
  id: string
  file: File
  url: string
  title: string
  bpm?: number
  key?: string
  tags: string[]
  metadata?: ProcessedSample
  waveform?: number[]
  isProcessing: boolean
  error?: string
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  wavPrice: number | null
  stemsPrice: number | null
  midiPrice: number | null
}

interface UploadProgress {
  id: string
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  message?: string
}

async function uploadFile(file: File): Promise<{ url: string; metadata: SampleMetadata }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("type", "audio")

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to upload file")
    }

    const data = await response.json()

    // Extract audio metadata using AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const metadata: SampleMetadata = {
      format: file.type || 'audio/wav',
      sampleRate: audioBuffer.sampleRate,
      bitDepth: 16, // Most WAV files are 16-bit
      channels: audioBuffer.numberOfChannels,
      duration: audioBuffer.duration,
      peakAmplitude: calculatePeakAmplitude(audioBuffer)
    }

    return { 
      url: data.url,
      metadata 
    }
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}

function calculatePeakAmplitude(audioBuffer: AudioBuffer): number {
  let maxAmplitude = 0
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel)
    for (let i = 0; i < channelData.length; i++) {
      const amplitude = Math.abs(channelData[i])
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude
      }
    }
  }
  
  return maxAmplitude > 0 ? 20 * Math.log10(maxAmplitude) : -Infinity
}

const AudioMetadata = ({ metadata }: { metadata: ProcessedSample }) => {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Format:</span>
          <span className="font-mono">{metadata.format?.split('/')[1].toUpperCase()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-mono">{metadata.duration?.toFixed(2)}s</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Sample Rate:</span>
          <span className="font-mono">{metadata.sampleRate / 1000}kHz</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Bit Depth:</span>
          <span className="font-mono">{metadata.bitDepth}-bit</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Channels:</span>
          <span className="font-mono">{metadata.channels}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Peak:</span>
          <span className="font-mono">{(metadata.peakAmplitude || 0).toFixed(2)}dB</span>
        </div>
      </div>
    </div>
  )
}

const WaveformDisplay = ({ data }: { data: number[] }) => {
  return (
    <div className="relative h-24 w-full bg-black/10 rounded-md overflow-hidden">
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${data.length} 100`}
        preserveAspectRatio="none"
      >
        <path
          d={`M 0 50 ${data.map((value, i) => `L ${i} ${50 + value * 40}`).join(' ')}`}
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-primary/50"
        />
      </svg>
    </div>
  )
}

const TagsButton = ({ tags, onClick }: { tags: string[], onClick: () => void }) => {
  const genreTags = tags.filter(tag => tag.startsWith('genre:')).map(tag => tag.replace('genre:', ''))
  const instrumentTags = tags.filter(tag => tag.startsWith('instrument:')).map(tag => tag.replace('instrument:', ''))
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <Tag className="h-4 w-4" />
      <span className="truncate">
        {genreTags.length > 0 || instrumentTags.length > 0 ? (
          <>
            {genreTags.join(', ')}
            {genreTags.length > 0 && instrumentTags.length > 0 && ' • '}
            {instrumentTags.join(', ')}
          </>
        ) : (
          'Add Tags'
        )}
      </span>
    </Button>
  )
}

const TagsDialog = ({
  open,
  onOpenChange,
  onTagsChange,
  currentTags,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTagsChange: (tags: string[]) => void
  currentTags: string[]
}) => {
  const [selectedTags, setSelectedTags] = useState(currentTags)

  useEffect(() => {
    setSelectedTags(currentTags)
  }, [currentTags])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tags</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Genres</Label>
            <TagSelector
              type="genre"
              selectedTags={selectedTags}
              onTagsChange={onTagsChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Instruments</Label>
            <TagSelector
              type="instrument"
              selectedTags={selectedTags}
              onTagsChange={onTagsChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            onTagsChange(selectedTags)
            onOpenChange(false)
          }}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SampleUploader({
  onUploadCompleteAction,
  isUploading = false,
  maxFiles = 10
}: SampleUploaderProps) {
  const [previews, setPreviews] = useState<UploadPreview[]>([])
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false)
  const [isBpmDialogOpen, setIsBpmDialogOpen] = useState(false)
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false)
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false)
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)
  const [tempBpm, setTempBpm] = useState<number>(120)
  const [localTitles, setLocalTitles] = useState<Record<string, string>>({})
  const [localBpms, setLocalBpms] = useState<Record<string, string>>({})
  const [processingErrors, setProcessingErrors] = useState<Array<{ filename: string, error: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
  const processor = new BatchProcessor()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed per upload`)
      acceptedFiles = acceptedFiles.slice(0, maxFiles) // Limit to maxFiles
    }

    toast.info(`Processing ${acceptedFiles.length} audio files...`)
    setIsProcessing(true)

    const processFile = async (file: File) => {
      const id = Math.random().toString(36).substring(7)
      
      try {
        // Update progress - Processing
        setUploadProgress(prev => ({
          ...prev,
          [id]: { id, progress: 0, status: 'processing', message: 'Processing audio...' }
        }))

        // Process audio file
        const metadata = await processor.processAudio(file)

        // Update progress - Uploading
        setUploadProgress(prev => ({
          ...prev,
          [id]: { id, progress: 50, status: 'uploading', message: 'Uploading file...' }
        }))

        // Upload file
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'audio')
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')
        
        const data = await response.json()
        
        // Validate URL
        if (!data.url) {
          throw new Error('No URL returned from server');
        }

        const audioUrl = data.url.trim();
        if (!audioUrl) {
          throw new Error('Empty URL returned from server');
        }

        console.log(`Uploaded file ${file.name}, received URL: ${audioUrl}`);

        // Update progress - Complete
        setUploadProgress(prev => ({
          ...prev,
          [id]: { id, progress: 100, status: 'complete' }
        }))

        // Create sample object compatible with SampleList's Sample type
        const newSample: SampleListSample = {
          id: id,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
          url: audioUrl, // Ensure URL is assigned and cleaned
          bpm: metadata.bpm || null,
          key: metadata.key || null,
          tags: [],
          hasWav: true,
          hasStems: false,
          hasMidi: false,
          wavPrice: 0.99,
          stemsPrice: null,
          midiPrice: null,
          stemsUrl: null,
          midiUrl: null,
        }
        
        // Verify URL is set 
        if (!newSample.url) {
          console.error('Created sample with missing URL:', newSample);
          throw new Error('Failed to assign URL to sample');
        }

        return newSample;

      } catch (error) {
        console.error('Error processing file:', error)
        setUploadProgress(prev => ({
          ...prev,
          [id]: { 
            id, 
            progress: 0, 
            status: 'error', 
            message: error instanceof Error ? error.message : 'Upload failed' 
          }
        }))
        return null
      }
    }

    // Process files in batches of 3 to avoid overloading the browser
    const results = []
    const batchSize = 3
    
    for (let i = 0; i < acceptedFiles.length; i += batchSize) {
      const batch = acceptedFiles.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(processFile))
      results.push(...batchResults)
      
      // Update overall progress
      const progress = Math.min(100, Math.round(((i + batch.length) / acceptedFiles.length) * 100))
      setProgress(progress)
    }
    
    const successfulUploads = results.filter((result): result is SampleListSample => 
      result !== null && typeof result === 'object'
    )
    
    setIsProcessing(false)
    setProgress(0)
    
    if (successfulUploads.length > 0) {
      toast.success(`Successfully uploaded ${successfulUploads.length} samples`)
      onUploadCompleteAction(successfulUploads)
    } else if (acceptedFiles.length > 0) {
      toast.error('Failed to upload samples')
    }
  }, [maxFiles, onUploadCompleteAction, processor])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.wav', '.mp3', '.aiff', '.flac']
    },
    disabled: isUploading,
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true, // Explicitly enable multiple files
  })

  const handleRemove = (id: string) => {
    setPreviews(prev => prev.filter(p => p.id !== id))
  }

  const handleTitleChange = (id: string, title: string) => {
    setLocalTitles(prev => ({ ...prev, [id]: title }))
  }

  const handleTitleBlur = (id: string) => {
    const localTitle = localTitles[id]
    if (localTitle === undefined) return
    
    const preview = previews.find(p => p.id === id)
    if (localTitle === preview?.title) return

    setPreviews(prev =>
      prev.map(p => (p.id === id ? { ...p, title: localTitle || 'Untitled Sample' } : p))
    )
  }

  const handleBpmChange = (id: string, bpmValue: string | number) => {
    const bpm = bpmValue === '' ? null : 
      typeof bpmValue === 'string' ? parseFloat(bpmValue) : bpmValue
    
    setPreviews(prev =>
      prev.map(p => (p.id === id ? { ...p, bpm } : p))
    )
  }

  const handleLocalBpmChange = (id: string, value: string) => {
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
      setLocalBpms(prev => ({ ...prev, [id]: value }))
    }
  }

  const handleBpmBlur = (id: string) => {
    const localBpm = localBpms[id]
    if (localBpm === undefined) return;
    
    const preview = previews.find(p => p.id === id)
    if (localBpm === (preview?.bpm?.toString() || '')) return;

    handleBpmChange(id, localBpm === '' ? null : Number(localBpm))
  }

  // Initialize local titles when new previews are added
  useEffect(() => {
    const newTitles: Record<string, string> = {}
    previews.forEach(preview => {
      if (!localTitles[preview.id]) {
        newTitles[preview.id] = preview.title
      }
    })
    if (Object.keys(newTitles).length > 0) {
      setLocalTitles(prev => ({ ...prev, ...newTitles }))
    }
  }, [previews])

  // Initialize local BPM when new previews are added
  useEffect(() => {
    const newBpms: Record<string, string> = {}
    previews.forEach(preview => {
      if (!localBpms[preview.id]) {
        newBpms[preview.id] = preview.bpm?.toString() || ''
      }
    })
    if (Object.keys(newBpms).length > 0) {
      setLocalBpms(prev => ({ ...prev, ...newBpms }))
    }
  }, [previews])

  const handleKeyChange = (id: string, key: string) => {
    setPreviews(prev =>
      prev.map(p => (p.id === id ? { ...p, key } : p))
    )
  }

  const handleTagsChange = (id: string, type: "genre" | "instrument", tag: string) => {
    setPreviews(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        
        const prefix = type === "genre" ? "genre:" : "instrument:"
        const existingTags = p.tags.filter(t => !t.startsWith(prefix))
        return {
          ...p,
          tags: [...existingTags, `${prefix}${tag}`]
        }
      })
    )
  }

  const handlePriceChange = (id: string, prices: PriceConfig) => {
    setPreviews(prev =>
      prev.map(p => (p.id === id ? { ...p, ...prices } : p))
    )
  }

  const handleBpmDialogOpen = (id: string, currentBpm: number | undefined) => {
    setSelectedSampleId(id)
    setTempBpm(currentBpm || 120)
    setIsBpmDialogOpen(true)
  }

  const handleBpmSave = () => {
    if (selectedSampleId) {
      handleBpmChange(selectedSampleId, tempBpm.toString())
      setIsBpmDialogOpen(false)
      setSelectedSampleId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Format explanation */}
      <div className="bg-secondary/20 p-4 rounded-lg">
        <h3 className="font-medium mb-2 flex items-center">
          <Info className="h-4 w-4 mr-2" /> 
          Available Sample Formats
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="font-medium min-w-[60px] mr-2">WAV:</span> 
            <span className="text-muted-foreground">Single .wav file of the complete sample</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium min-w-[60px] mr-2">STEMS:</span> 
            <span className="text-muted-foreground">Individual stems as .wav files - upload as .zip, .rar, or .7z archive</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium min-w-[60px] mr-2">MIDI:</span> 
            <span className="text-muted-foreground">MIDI files containing the musical arrangement</span>
          </li>
        </ul>
      </div>
      
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 group",
          isDragActive
            ? "border-primary/70 bg-primary/10"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          isProcessing && "border-primary/50 bg-primary/10"
        )}
      >
        <input {...getInputProps()} />
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-4 w-full">
            <Progress value={progress} className="w-full max-w-xs" />
            <p className="text-sm text-center text-muted-foreground">
              Processing {progress === 100 ? 'complete' : `${progress}%`}
            </p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center justify-center p-4 max-w-sm">
            <Upload className="h-10 w-10 text-primary mb-4" />
            <p className="text-lg font-medium text-center">Drop your files here</p>
            <p className="text-sm text-center text-muted-foreground mt-2">
              You can upload multiple audio files at once
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 max-w-sm">
            <Music className="h-10 w-10 text-muted-foreground/70 mb-4" />
            <p className="text-lg font-medium text-center">Drag & drop your audio files</p>
            <p className="text-sm text-center text-muted-foreground mt-2">
              Or click to browse files from your device
            </p>
            <Badge variant="outline" className="mt-4">
              Multiple files supported - up to {maxFiles}
            </Badge>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {Object.values(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.values(uploadProgress).map((progress) => (
            <div key={progress.id} className="flex items-center gap-2">
              <Progress value={progress.progress} className="flex-1" />
              <span className="text-sm text-muted-foreground min-w-[100px]">
                {progress.status === 'complete' ? 'Complete' : progress.message}
              </span>
              {progress.status === 'error' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUploadProgress(prev => {
                      const { [progress.id]: _, ...rest } = prev
                      return rest
                    })
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview list */}
      {previews.length > 0 && (
        <div className="space-y-2">
          {previews.map((preview) => (
            <div
              key={preview.id}
              className="flex items-center gap-4 py-4 px-4 bg-background/60 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              {/* Play button and title */}
              <div className="flex items-center gap-3 min-w-[300px]">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Input
                  value={localTitles[preview.id] || ''}
                  onChange={(e) => handleTitleChange(preview.id, e.target.value)}
                  onBlur={() => handleTitleBlur(preview.id)}
                  className="h-8 bg-transparent border-0 focus-visible:ring-0 p-0 text-sm font-medium"
                  placeholder="Untitled Sample"
                />
              </div>

              {/* Waveform and metadata */}
              <div className="space-y-4">
                {preview.metadata?.waveformData && (
                  <WaveformDisplay data={preview.metadata.waveformData} />
                )}
                {preview.metadata && <AudioMetadata metadata={preview.metadata} />}
              </div>

              {/* BPM and Key controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`bpm-${preview.id}`}>BPM</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentBpm = localBpms[preview.id] || '120'
                        const newBpm = (Number(currentBpm) - 1).toString()
                        handleLocalBpmChange(preview.id, newBpm)
                        handleBpmChange(preview.id, Number(newBpm))
                      }}
                      disabled={isUploading}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      id={`bpm-${preview.id}`}
                      type="text"
                      value={localBpms[preview.id] || ''}
                      onChange={(e) => handleLocalBpmChange(preview.id, e.target.value)}
                      onBlur={() => handleBpmBlur(preview.id)}
                      className="w-16 h-8 text-center px-0"
                      placeholder="120"
                      disabled={isUploading}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentBpm = localBpms[preview.id] || '120'
                        const newBpm = (Number(currentBpm) + 1).toString()
                        handleLocalBpmChange(preview.id, newBpm)
                        handleBpmChange(preview.id, Number(newBpm))
                      }}
                      disabled={isUploading}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`key-${preview.id}`}>Key</Label>
                  <KeySelector
                    selectedKey={preview.key}
                    onKeySelect={(key) => handleKeyChange(preview.id, key || '')}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  <TagsButton
                    tags={preview.tags}
                    onClick={() => {
                      setSelectedSampleId(preview.id)
                      setIsTagsDialogOpen(true)
                    }}
                  />
                </div>
              </div>

              {/* Formats & Pricing */}
              <div className="space-y-2">
                <Label>Formats & Pricing</Label>
                <PriceSelector
                  prices={{
                    hasWav: preview.hasWav,
                    hasStems: preview.hasStems,
                    hasMidi: preview.hasMidi,
                    wavPrice: preview.wavPrice,
                    stemsPrice: preview.stemsPrice,
                    midiPrice: preview.midiPrice
                  }}
                  onPriceChange={(prices) => handlePriceChange(preview.id, prices)}
                />
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                onClick={() => handleRemove(preview.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* BPM Dialog */}
      <Dialog open={isBpmDialogOpen} onOpenChange={setIsBpmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set BPM</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Beats Per Minute</Label>
              <Input
                type="number"
                min={60}
                max={200}
                step={1}
                value={tempBpm}
                onChange={(e) => setTempBpm(parseInt(e.target.value) || 120)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBpmSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags Dialog */}
      {selectedSampleId && (
        <TagsDialog
          open={isTagsDialogOpen}
          onOpenChange={setIsTagsDialogOpen}
          currentTags={previews.find(p => p.id === selectedSampleId)?.tags || []}
          onTagsChange={(tags) => {
            setPreviews(prev =>
              prev.map(p => (p.id === selectedSampleId ? { ...p, tags } : p))
            )
          }}
        />
      )}

      {/* Pricing Dialog */}
      <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Pricing</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedSampleId && (
              <PriceSelector
                prices={{
                  hasWav: previews.find(p => p.id === selectedSampleId)?.hasWav || false,
                  hasStems: previews.find(p => p.id === selectedSampleId)?.hasStems || false,
                  hasMidi: previews.find(p => p.id === selectedSampleId)?.hasMidi || false,
                  wavPrice: previews.find(p => p.id === selectedSampleId)?.wavPrice || null,
                  stemsPrice: previews.find(p => p.id === selectedSampleId)?.stemsPrice || null,
                  midiPrice: previews.find(p => p.id === selectedSampleId)?.midiPrice || null,
                }}
                onPriceChange={(prices) => selectedSampleId && handlePriceChange(selectedSampleId, prices)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}