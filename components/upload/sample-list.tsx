"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Sample as PrismaSample } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Play, Pause, Minus, Plus, Music, DollarSign, Upload, FileArchive, X, ChevronRight, Tag, Clock, Check } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createTagsManager, Genre, Instrument, GENRE_PREFIX, GENRES, INSTRUMENT_PREFIX, INSTRUMENTS } from "@/lib/tags"
import { TagSelector } from "@/components/tags/tag-selector"
import { KeySelector } from "@/components/upload/key-selector"
import { SAMPLE_PRICES } from "@/lib/validations/sample-pack"
import { useFileUpload } from "@/hooks/use-file-upload"
import { FileType } from "@/lib/services/file-storage"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useDropzone } from "react-dropzone"
import React from "react"

// Define available categories
const categories = {
  genres: ["Hip Hop", "Trap", "Pop", "R&B", "Soul", "Rock", "Drill", "Electronic"],
  instruments: ["Drums", "Bass", "Keys", "Guitar", "Synth", "Vocals", "FX", "Other"]
}

// Add musical keys at the top with other constants
const musicalKeys = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
]

// Update the Sample type to include stemsUrl
export type Sample = PrismaSample & {
  id: string;
  url?: string;
  fileUrl?: string; // Add fileUrl as an alternative to url
  stemsUrl?: string | null;
  midiUrl?: string | null;
  tags?: any[];
};

export interface SampleListProps {
  packId: string
  samples: Sample[]
  onRemoveAction: (index: number) => void
  onUpdateAction: (index: number, updatedSample: Sample) => void
  isLoading?: boolean
}

// Create a context for managing global playback state
type AudioContextType = {
  currentlyPlayingId: string | null;
  setCurrentlyPlayingId: (id: string | null) => void;
};

const AudioContext = React.createContext<AudioContextType>({
  currentlyPlayingId: null,
  setCurrentlyPlayingId: () => {},
});

function SampleItem({
  sample,
  packId,
  index,
  onUpdate,
  onRemove,
  isLoading
}: {
  sample: Sample
  packId: string
  index: number
  onUpdate: (updatedSample: Sample) => void
  onRemove: () => void
  isLoading: boolean
}): JSX.Element {
  const [isPlaying, setIsPlaying] = useState(false)
  const [localTitle, setLocalTitle] = useState(sample.title)
  const [localBpm, setLocalBpm] = useState(sample.bpm?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const [stemsUploading, setStemsUploading] = useState(false)
  const [stemsFile, setStemsFile] = useState<string | null>(sample.stemsUrl || null)
  const [openStemsDialog, setOpenStemsDialog] = useState(false)
  const [openMidiDialog, setOpenMidiDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [hasAttemptedToPlay, setHasAttemptedToPlay] = useState(false)
  const [isAudioOperationInProgress, setIsAudioOperationInProgress] = useState(false)
  
  // Setup file upload hook for stems
  const { upload: uploadStems } = useFileUpload(FileType.ARCHIVE, {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['.zip', '.rar', '.7z'],
    onError: (error) => {
      toast.error(error.message)
    },
  })
  
  // Setup file upload hook for MIDI
  const { upload: uploadMidi } = useFileUpload(FileType.MIDI, {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['.mid', '.midi'],
    onError: (error) => {
      toast.error(error.message)
    },
  })
  
  // Ensure tags is always an array
  const tags = sample.tags || []
  
  // Get the audio context for global playback management
  const { currentlyPlayingId, setCurrentlyPlayingId } = React.useContext(AudioContext);
  
  // Audio player reference and controls - but not created until needed
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Track error count to prevent excessive error toasts
  const errorCountRef = useRef(0);
  const maxErrorToasts = 2; // Only show 2 error toasts maximum
  const maxPlayAttempts = 2; // Maximum number of attempts to play a sample before giving up
  const [playAttempts, setPlayAttempts] = useState(0);
  
  // Update local playing state when global state changes
  useEffect(() => {
    // If this sample is not the currently playing one, ensure it's paused
    if (currentlyPlayingId !== sample.id && isPlaying) {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {
          console.warn("Error pausing audio:", e);
        }
      }
      setIsPlaying(false);
    }
  }, [currentlyPlayingId, sample.id, isPlaying]);
  
  // Create the audio element once and only once
  useEffect(() => {
    // Clean up function that will run when component unmounts
    return () => {
      if (audioRef.current) {
        try {
          const audio = audioRef.current;
          audio.pause();
          audio.src = '';
          audio.load();
          
          // Remove all event listeners using empty functions
          // (this is just to be safe, even though they should be removed when element is garbage collected)
          audio.removeEventListener("play", () => {});
          audio.removeEventListener("pause", () => {});
          audio.removeEventListener("ended", () => {});
          audio.removeEventListener("error", () => {});
        } catch (e) {
          console.warn(`Error cleaning up audio for sample ${sample.id}:`, e);
        }
        
        // Clear the reference
        audioRef.current = null;
      }
    };
  }, [sample.id]);
  
  // This function creates the audio element if it doesn't exist yet
  const ensureAudioElement = () => {
    if (audioRef.current) return true;
    
    try {
      console.log(`Creating audio element for sample ${sample.id}`);
      const audio = new Audio();
      audio.preload = "none";
      
      // Add event listeners
      audio.addEventListener("play", () => {
        setIsPlaying(true);
        setCurrentlyPlayingId(sample.id);
        setIsAudioOperationInProgress(false);
      });
      
      audio.addEventListener("pause", () => {
        setIsPlaying(false);
        if (currentlyPlayingId === sample.id) {
          setCurrentlyPlayingId(null);
        }
        setIsAudioOperationInProgress(false);
      });
      
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        if (currentlyPlayingId === sample.id) {
          setCurrentlyPlayingId(null);
        }
        setIsAudioOperationInProgress(false);
      });
      
      audio.addEventListener("error", (e) => {
        console.error(`Audio playback error for sample ${sample.id} "${sample.title}":`, e);
        
        // Update state
        setIsPlaying(false);
        if (currentlyPlayingId === sample.id) {
          setCurrentlyPlayingId(null);
        }
        
        // Release operation lock
        setIsAudioOperationInProgress(false);
        
        // Only show limited number of error toasts
        if (errorCountRef.current < maxErrorToasts) {
          toast.error("Error playing audio file");
          errorCountRef.current += 1;
        }
      });
      
      audioRef.current = audio;
      setAudioInitialized(true);
      return true;
    } catch (e) {
      console.error(`Error creating audio element for sample ${sample.id}:`, e);
      return false;
    }
  };
  
  // Handle play button click
  const togglePlayback = () => {
    // Prevent rapid clicks
    if (isAudioOperationInProgress) {
      console.log(`Audio operation in progress for sample ${sample.id}, ignoring request`);
      return;
    }
    
    // Mark that we've attempted to play
    setHasAttemptedToPlay(true);
    
    // Set operation in progress flag
    setIsAudioOperationInProgress(true);
    
    // First ensure audio element exists
    if (!ensureAudioElement()) {
      setIsAudioOperationInProgress(false);
      return;
    }
    
    // Now we're sure audioRef.current exists
    const audio = audioRef.current!;
    
    // If already playing, just pause
    if (isPlaying) {
      try {
        audio.pause();
        // State will be updated by event listener
      } catch (e) {
        console.error(`Error pausing audio for sample ${sample.id}:`, e);
        setIsAudioOperationInProgress(false);
        setIsPlaying(false);
        setCurrentlyPlayingId(null);
      }
      return;
    }
    
    // Check if we've exceeded play attempts for this sample
    if (playAttempts >= maxPlayAttempts) {
      toast.error(`Unable to play this sample after ${maxPlayAttempts} attempts`);
      setIsAudioOperationInProgress(false);
      return;
    }
    
    // Check if the audio has a valid source
    let audioUrl = sample.url || sample.fileUrl;
    
    // Validate URL - make sure it's a string and not empty
    if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.trim() === '') {
      console.error(`Missing or invalid audio URL for sample: ${sample.id} "${sample.title}"`);
      
      // Try to recover if there's another valid URL on the sample
      if (sample.stemsUrl && typeof sample.stemsUrl === 'string' && sample.stemsUrl.trim() !== '') {
        console.log("Attempting to use stems URL as fallback");
        audioUrl = sample.stemsUrl;
      } else {
        toast.error("No valid audio source available");
        setIsAudioOperationInProgress(false);
        return;
      }
    }
    
    try {
      // Reset any error state
      errorCountRef.current = 0;
      
      // Set audio source if needed
      const needsNewSource = !audio.src || 
                            !audio.src.includes(encodeURIComponent(audioUrl.split('/').pop() || ''));
      
      if (needsNewSource) {
        console.log(`Setting audio source for sample ${sample.id} to:`, audioUrl);
        
        // Reset audio element
        audio.pause();
        audio.currentTime = 0;
        
        // Set new source
        audio.src = audioUrl;
        audio.load();
      }
      
      // Before playing this sample, update the global playing state
      setCurrentlyPlayingId(sample.id);
      
      // Increment play attempt counter
      setPlayAttempts(prev => prev + 1);
      
      // Clear any existing timeouts
      const playWithDelay = () => {
        try {
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Reset attempts counter on successful play
                setPlayAttempts(0);
                // State updates handled by event listeners
              })
              .catch(error => {
                console.error(`Error playing audio for sample ${sample.id}:`, error);
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
                setIsAudioOperationInProgress(false);
                
                if (errorCountRef.current < maxErrorToasts) {
                  if (error.name === 'NotAllowedError') {
                    toast.error("Browser blocked autoplay. Click play again.");
                  } else if (error.name !== 'AbortError') {
                    // Don't show errors for abort, which happens during normal navigation
                    toast.error("Could not play audio file");
                  }
                  errorCountRef.current += 1;
                }
              });
          } else {
            // No promise returned (old browsers)
            setIsAudioOperationInProgress(false);
          }
        } catch (error) {
          console.error(`Synchronous audio error for sample ${sample.id}:`, error);
          setIsPlaying(false);
          setCurrentlyPlayingId(null);
          setIsAudioOperationInProgress(false);
          
          if (errorCountRef.current < maxErrorToasts) {
            toast.error("Error playing audio");
            errorCountRef.current += 1;
          }
        }
      };
      
      // Add a short delay if we just set a new source
      if (needsNewSource) {
        // A small delay helps prevent race conditions with new audio source
        setTimeout(playWithDelay, 100);
      } else {
        playWithDelay();
      }
    } catch (error) {
      console.error(`Unexpected audio error for sample ${sample.id}:`, error);
      setIsPlaying(false);
      setCurrentlyPlayingId(null);
      setIsAudioOperationInProgress(false);
      
      if (errorCountRef.current < maxErrorToasts) {
        toast.error("Error playing audio");
        errorCountRef.current += 1;
      }
    }
  };
  
  // Ensure clean unloading of audio when the sample changes
  useEffect(() => {
    return () => {
      // Reset playing state on unmount or sample change
      if (isPlaying) {
        setIsPlaying(false);
        if (currentlyPlayingId === sample.id) {
          setCurrentlyPlayingId(null);
        }
      }
      
      // Reset error count when sample changes
      errorCountRef.current = 0;
    };
  }, [sample.id, isPlaying, currentlyPlayingId, setCurrentlyPlayingId]);

  // Helper function to save sample to server
  const saveSampleToServer = async (updatedSample: Sample, showSuccess = false) => {
    setIsSaving(true)
    try {
      onUpdate(updatedSample)
      if (showSuccess) {
        toast.success("Sample updated")
      }
    } catch (error) {
      console.error("Error saving sample:", error)
      toast.error("Failed to update sample")
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to create a valid sample update
  const createSampleUpdate = (updates: Partial<Sample>): Sample => {
    const currentSample = sample;
    return {
      ...currentSample,
      ...updates,
      // Ensure required fields are always present
      title: updates.title || currentSample.title,
      url: updates.url || currentSample.url, // Preserve the original URL
      fileUrl: updates.fileUrl || currentSample.fileUrl, // Preserve the fileUrl as well
      tags: updates.tags || currentSample.tags || [],
      hasWav: updates.hasWav ?? currentSample.hasWav ?? true,
      hasStems: updates.hasStems ?? currentSample.hasStems ?? false,
      hasMidi: updates.hasMidi ?? currentSample.hasMidi ?? false,
      stemsUrl: updates.stemsUrl || currentSample.stemsUrl,
      midiUrl: updates.midiUrl || currentSample.midiUrl,
    };
  }

  const handleStemsUpload = async (file: File) => {
    setStemsUploading(true)
    try {
      // Upload the stems archive
      const result = await uploadStems(file)
      
      // Update the sample with the stems URL and enable stems
      const updatedSample = createSampleUpdate({ 
        stemsUrl: result.url,
        hasStems: true 
      })
      
      await saveSampleToServer(updatedSample, true)
      setStemsFile(result.url)
      toast.success("Stems uploaded successfully")
    } catch (error) {
      console.error("Error uploading stems:", error)
      toast.error("Failed to upload stems")
    } finally {
      setStemsUploading(false)
    }
  }

  const handleMidiUpload = async (file: File) => {
    try {
      // Upload the MIDI file
      const result = await uploadMidi(file)
      
      // Update the sample with the MIDI URL and enable MIDI
      const updatedSample = createSampleUpdate({ 
        midiUrl: result.url,
        hasMidi: true 
      })
      
      await saveSampleToServer(updatedSample, true)
    } catch (error) {
      console.error("Error uploading MIDI:", error)
      toast.error("Failed to upload MIDI")
    }
  }

  const handleTitleChange = (title: string) => {
    setLocalTitle(title)
  }

  const handleTitleBlur = async () => {
    if (localTitle === sample.title) return
    
    const updatedSample = createSampleUpdate({ title: localTitle })
    await saveSampleToServer(updatedSample, true)
  }

  const handleBpmChange = async (newBpm: number) => {
    const updatedSample = createSampleUpdate({ bpm: newBpm })
    await saveSampleToServer(updatedSample)
  }

  const handleBpmBlur = async () => {
    if (localBpm === (sample.bpm?.toString() || '')) return;
    const newBpm = localBpm === '' ? null : Number(localBpm);
    await handleBpmChange(newBpm);
  }

  const handleBpmInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric values (including decimals)
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setLocalBpm(value);
    }
  }

  const handleKeyChange = async (key: string | null) => {
    const updatedSample = createSampleUpdate({
      key: key
    })
    await saveSampleToServer(updatedSample) // No success message for key changes
  }

  const handleTagsChange = async (newTags: string[]) => {
    const updatedSample = createSampleUpdate({
      tags: newTags
    })
    await saveSampleToServer(updatedSample)
  }

  const handleFormatToggle = async (format: 'wav' | 'stems' | 'midi') => {
    // Don't allow toggling stems without a stems file
    if (format === 'stems' && !stemsFile) return;
    
    const updates: Partial<Sample> = {};
    
    if (format === 'wav') {
      updates.hasWav = !sample.hasWav;
    } else if (format === 'stems') {
      updates.hasStems = !sample.hasStems;
    } else if (format === 'midi') {
      updates.hasMidi = !sample.hasMidi;
    }
    
    const updatedSample = createSampleUpdate(updates);
    await saveSampleToServer(updatedSample, true);
  }

  return (
    <div 
      className="group flex items-center gap-3 p-4 rounded-xl border border-border/30 mb-4 bg-background hover:border-primary/40 hover:shadow-sm hover:shadow-primary/5"
    >
      {/* We don't include the audio element directly in the DOM anymore */}
      
      {/* Play Button with hover effect */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-8 h-8 rounded-full flex-shrink-0 transition-all",
          isPlaying ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
        )}
        onClick={togglePlayback}
        disabled={isLoading || isSaving || playAttempts >= maxPlayAttempts || isAudioOperationInProgress}
      >
        {isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : isAudioOperationInProgress ? (
          <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-primary animate-spin" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>

      {/* Title with automatic truncation */}
      <div className="flex-1 min-w-0 max-w-[180px]">
        <Input
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={handleTitleBlur}
          className="font-medium border-transparent focus:border-input bg-transparent text-sm h-8"
          disabled={isLoading}
          placeholder="Sample title"
        />
      </div>

      {/* BPM */}
      <div className="flex items-center space-x-2">
        <Label className="text-xs text-muted-foreground">BPM</Label>
        <Input
          value={localBpm}
          onChange={handleBpmInput}
          onBlur={handleBpmBlur}
          className="w-16 text-center border-transparent focus:border-input bg-transparent text-sm h-8"
          disabled={isLoading}
          placeholder="BPM"
          aria-label="BPM"
        />
      </div>
      
      <div className="flex items-center">
        <KeySelector 
          selectedKey={sample.key}
          onKeySelect={handleKeyChange}
          disabled={isLoading || isSaving}
          compact={true}
        />
      </div>
      
      <div className="flex-1 flex items-center space-x-2">
        <Label className="text-xs text-muted-foreground">Tags</Label>
        <InlineTagSelector
          selectedTags={sample.tags || []}
          onTagsChange={handleTagsChange}
          disabled={isLoading || isSaving}
        />
      </div>

      {/* Format buttons: WAV indicator and upload buttons for Stems and MIDI */}
      <div className="flex items-center gap-2">
        {/* WAV indicator - always available */}
        <Badge variant="outline" className="bg-muted/20 text-xs">
          WAV
        </Badge>
        
        {/* Stems upload/status button with direct drag-and-drop */}
        <Dialog open={openStemsDialog} onOpenChange={setOpenStemsDialog}>
          {sample.hasStems ? (
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className={cn(
                  "h-8 gap-1",
                  "bg-primary/20 hover:bg-primary/30"
                )}
                disabled={isSaving || stemsUploading}
              >
                <Upload className="h-3 w-3" />
                <span className="text-xs">Stems ✓</span>
              </Button>
            </DialogTrigger>
          ) : (
            <DialogTrigger asChild>
              <div className="block">
                <StemsButtonDropzone 
                  onUpload={handleStemsUpload} 
                  isUploading={stemsUploading}
                  onClickOpen={() => setOpenStemsDialog(true)}
                />
              </div>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{sample.hasStems ? "Manage" : "Upload"} Stems for {sample.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {sample.hasStems ? (
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="outline" className="bg-green-500/20 text-green-500">Stems Uploaded</Badge>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      const updatedSample = createSampleUpdate({ 
                        hasStems: false,
                        stemsUrl: null
                      });
                      await saveSampleToServer(updatedSample, true);
                      setStemsFile(null);
                      setOpenStemsDialog(false);
                    }}
                  >
                    Remove Stems
                  </Button>
                </div>
              ) : (
                <StemsDropzone onUpload={handleStemsUpload} isUploading={stemsUploading} />
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* MIDI upload/status button with direct drag-and-drop */}
        <Dialog open={openMidiDialog} onOpenChange={setOpenMidiDialog}>
          {sample.hasMidi ? (
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className={cn(
                  "h-8 gap-1",
                  "bg-primary/20 hover:bg-primary/30"
                )}
                disabled={isLoading || isSaving}
              >
                <Upload className="h-3 w-3" />
                <span className="text-xs">MIDI ✓</span>
              </Button>
            </DialogTrigger>
          ) : (
            <DialogTrigger asChild>
              <div className="block">
                <MidiButtonDropzone 
                  onUpload={handleMidiUpload} 
                  isUploading={isSaving}
                  onClickOpen={() => setOpenMidiDialog(true)}
                />
              </div>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{sample.hasMidi ? "Manage" : "Upload"} MIDI for {sample.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {sample.hasMidi ? (
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="outline" className="bg-green-500/20 text-green-500">MIDI Uploaded</Badge>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      const updatedSample = createSampleUpdate({ 
                        hasMidi: false,
                        midiUrl: null
                      });
                      await saveSampleToServer(updatedSample, true);
                      setOpenMidiDialog(false);
                    }}
                  >
                    Remove MIDI
                  </Button>
                </div>
              ) : (
                <MidiDropzone onUpload={handleMidiUpload} isUploading={isSaving} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        disabled={isLoading || isSaving}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

const PriceDialog = ({
  sample,
  onSave,
  disabled
}: {
  sample: Sample
  onSave: (prices: { wavPrice: number | null, stemsPrice: number | null, midiPrice: number | null }) => void
  disabled: boolean
}) => {
  const [prices, setPrices] = useState({
    wavPrice: sample.wavPrice || 0.99,
    stemsPrice: sample.stemsPrice,
    midiPrice: sample.midiPrice
  })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-w-[80px]"
          disabled={disabled}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          ${sample.wavPrice?.toFixed(2) || "0.99"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Sample Prices</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>WAV Price ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={prices.wavPrice || ""}
              onChange={(e) => setPrices(prev => ({
                ...prev,
                wavPrice: parseFloat(e.target.value) || null
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Stems Price ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={prices.stemsPrice || ""}
              onChange={(e) => setPrices(prev => ({
                ...prev,
                stemsPrice: parseFloat(e.target.value) || null
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>MIDI Price ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={prices.midiPrice || ""}
              onChange={(e) => setPrices(prev => ({
                ...prev,
                midiPrice: parseFloat(e.target.value) || null
              }))}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={() => onSave(prices)}
          >
            Save Prices
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const StemsButtonDropzone = ({ 
  onUpload, 
  isUploading, 
  onClickOpen 
}: { 
  onUpload: (file: File) => void, 
  isUploading: boolean,
  onClickOpen: () => void
}) => {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
      'application/octet-stream': ['.zip', '.rar', '.7z']
    },
    disabled: isUploading,
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false,
    noClick: true, // Prevent click from opening file dialog - we'll handle that manually
    noKeyboard: true
  });

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-1 relative z-10",
          isDragActive ? "border-primary bg-primary/10" : "bg-muted/10",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        disabled={isUploading}
        onClick={(e) => {
          e.stopPropagation();
          onClickOpen();
        }}
      >
        <Upload className="h-3 w-3" />
        <span className="text-xs">
          {isDragActive ? "Drop stems here" : "Upload Stems"}
        </span>
      </Button>
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded pointer-events-none" />
      )}
    </div>
  );
};

const MidiButtonDropzone = ({ 
  onUpload, 
  isUploading, 
  onClickOpen 
}: { 
  onUpload: (file: File) => void, 
  isUploading: boolean,
  onClickOpen: () => void
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    accept: {
      'audio/midi': ['.mid', '.midi'],
      'audio/mid': ['.mid', '.midi'],
      'audio/x-midi': ['.mid', '.midi'],
      'application/x-midi': ['.mid', '.midi'],
      'application/octet-stream': ['.mid', '.midi']
    },
    disabled: isUploading,
    maxSize: 1 * 1024 * 1024, // 1MB
    multiple: false,
    noClick: true, // Prevent click from opening file dialog - we'll handle that manually
    noKeyboard: true
  });

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-1 relative z-10",
          isDragActive ? "border-primary bg-primary/10" : "bg-muted/10",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        disabled={isUploading}
        onClick={(e) => {
          e.stopPropagation();
          onClickOpen();
        }}
      >
        <Upload className="h-3 w-3" />
        <span className="text-xs">
          {isDragActive ? "Drop MIDI here" : "Upload MIDI"}
        </span>
      </Button>
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded pointer-events-none" />
      )}
    </div>
  );
};

const StemsDropzone = ({ onUpload, isUploading }: { onUpload: (file: File) => void, isUploading: boolean }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
      'application/octet-stream': ['.zip', '.rar', '.7z']
    },
    disabled: isUploading,
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
        isDragActive 
          ? "border-primary bg-primary/10" 
          : "border-border bg-muted hover:bg-muted/80",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <FileArchive className="w-8 h-8 mb-2 text-muted-foreground" />
        <p className="mb-2 text-sm text-center text-foreground">
          {isDragActive 
            ? <span className="font-medium">Drop stems here</span>
            : <span className="font-medium">Drag & drop stems or click to browse</span>
          }
        </p>
        <p className="text-xs text-center text-muted-foreground">
          ZIP, RAR or 7Z (max 100MB)
        </p>
      </div>
    </div>
  );
};

const MidiDropzone = ({ onUpload, isUploading }: { onUpload: (file: File) => void, isUploading: boolean }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    accept: {
      'audio/midi': ['.mid', '.midi'],
      'audio/mid': ['.mid', '.midi'],
      'audio/x-midi': ['.mid', '.midi'],
      'application/x-midi': ['.mid', '.midi'],
      'application/octet-stream': ['.mid', '.midi']
    },
    disabled: isUploading,
    maxSize: 1 * 1024 * 1024, // 1MB
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
        isDragActive 
          ? "border-primary bg-primary/10" 
          : "border-border bg-muted hover:bg-muted/80",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <Music className="w-8 h-8 mb-2 text-muted-foreground" />
        <p className="mb-2 text-sm text-center text-foreground">
          {isDragActive 
            ? <span className="font-medium">Drop MIDI file here</span>
            : <span className="font-medium">Drag & drop MIDI or click to browse</span>
          }
        </p>
        <p className="text-xs text-center text-muted-foreground">
          MIDI files only (max 1MB)
        </p>
      </div>
    </div>
  );
};

// Create a new InlineTagSelector component that limits to 3 tags max
const InlineTagSelector = ({
  selectedTags,
  onTagsChange,
  disabled = false
}: {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}) => {
  // Count how many tags are selected
  const tagCount = selectedTags.length;
  const atMaxTags = tagCount >= 3;

  // Helper to check if a tag is selected
  const isTagSelected = (tagWithPrefix: string) => {
    return selectedTags.includes(tagWithPrefix);
  };

  // Handle tag selection/deselection
  const handleTagToggle = (tagWithPrefix: string) => {
    if (disabled) return;
    
    if (isTagSelected(tagWithPrefix)) {
      // Remove tag
      onTagsChange(selectedTags.filter(t => t !== tagWithPrefix));
    } else if (atMaxTags) {
      // Show toast or some feedback
      toast.warning("Maximum 3 tags allowed");
    } else {
      // Add tag
      onTagsChange([...selectedTags, tagWithPrefix]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={disabled}
        >
          <Tag className="h-3 w-3" />
          <span className="text-xs truncate max-w-[60px]">
            {tagCount > 0 
              ? `${tagCount}/3 Tags` 
              : 'Tags'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[180px] bg-zinc-950 border-zinc-800 max-h-[250px] overflow-y-auto"
      >
        <div className="px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-zinc-800">
          Genres ({tagCount}/3)
        </div>
        <div className="grid grid-cols-2">
          {GENRES.map((genre) => {
            const tagWithPrefix = `${GENRE_PREFIX}${genre}`;
            return (
              <DropdownMenuItem
                key={tagWithPrefix}
                onClick={() => handleTagToggle(tagWithPrefix)}
                disabled={atMaxTags && !isTagSelected(tagWithPrefix)}
                className="flex items-center gap-1 px-2 py-1 cursor-pointer text-zinc-200 hover:bg-zinc-800"
              >
                <div className={cn(
                  "w-3 h-3 border rounded-sm flex items-center justify-center transition-colors",
                  isTagSelected(tagWithPrefix)
                    ? "border-primary bg-primary text-primary-foreground" 
                    : "border-zinc-600"
                )}>
                  {isTagSelected(tagWithPrefix) && (
                    <Check className="h-2 w-2" />
                  )}
                </div>
                <span className="text-[10px]">{genre}</span>
              </DropdownMenuItem>
            );
          })}
        </div>

        <div className="px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-t border-zinc-800">
          Instruments
        </div>
        <div className="grid grid-cols-2">
          {INSTRUMENTS.map((instrument) => {
            const tagWithPrefix = `${INSTRUMENT_PREFIX}${instrument}`;
            return (
              <DropdownMenuItem
                key={tagWithPrefix}
                onClick={() => handleTagToggle(tagWithPrefix)}
                disabled={atMaxTags && !isTagSelected(tagWithPrefix)}
                className="flex items-center gap-1 px-2 py-1 cursor-pointer text-zinc-200 hover:bg-zinc-800"
              >
                <div className={cn(
                  "w-3 h-3 border rounded-sm flex items-center justify-center transition-colors",
                  isTagSelected(tagWithPrefix)
                    ? "border-primary bg-primary text-primary-foreground" 
                    : "border-zinc-600"
                )}>
                  {isTagSelected(tagWithPrefix) && (
                    <Check className="h-2 w-2" />
                  )}
                </div>
                <span className="text-[10px]">{instrument}</span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function SampleList({
  packId,
  samples,
  onRemoveAction,
  onUpdateAction,
  isLoading = false
}: SampleListProps) {
  // State for tracking which sample is currently playing
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  
  // Validate all samples have URLs
  useEffect(() => {
    const samplesWithMissingUrls = samples.filter(sample => !sample.url && !sample.fileUrl);
    if (samplesWithMissingUrls.length > 0) {
      console.warn(`Found ${samplesWithMissingUrls.length} samples with missing URLs:`, 
        samplesWithMissingUrls.map(s => ({ id: s.id, title: s.title }))
      );
    }
  }, [samples]);

  return (
    <AudioContext.Provider value={{ currentlyPlayingId, setCurrentlyPlayingId }}>
      <div className="space-y-1">
        {samples.map((sample, index) => (
          <SampleItem
            key={sample.id || index}
            packId={packId}
            sample={sample}
            index={index}
            onUpdate={(updatedSample) => onUpdateAction(index, updatedSample)}
            onRemove={() => onRemoveAction(index)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </AudioContext.Provider>
  )
} 