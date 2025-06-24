import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SecurePlayerProps {
  sampleId: string;
  isPreview?: boolean;
  format?: "WAV" | "STEMS" | "MIDI";
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
  showWaveform?: boolean;
}

/**
 * Secure audio player that fetches audio through our API 
 * and creates blob URLs to hide the source
 */
export default function SecurePlayer({
  sampleId,
  isPreview = true,
  format = "WAV",
  onPlay,
  onPause,
  className,
  showWaveform = false,
}: SecurePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load audio securely on component mount
  useEffect(() => {
    let mounted = true;
    
    async function loadAudio() {
      if (!sampleId) return;
      
      try {
        setIsLoading(true);
        
        // Construct the API URL with relevant params
        const apiUrl = `/api/stream/sample/${sampleId}${isPreview ? '?preview=true' : `?format=${format}`}`;
        
        // Fetch audio as a blob to hide the source URL
        const response = await fetch(apiUrl);
        
        if (!mounted) return;
        
        if (!response.ok) {
          console.error("Error loading audio:", response.statusText);
          throw new Error(`Failed to load audio: ${response.status}`);
        }
        
        // Get audio data as blob
        const audioBlob = await response.blob();
        
        if (!mounted) return;
        
        // Revoke old blob URL if it exists
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        
        // Create a new blob URL
        const newBlobUrl = URL.createObjectURL(audioBlob);
        setBlobUrl(newBlobUrl);
        
        // Initialize audio element if needed
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        
        // Set audio properties
        audioRef.current.src = newBlobUrl;
        audioRef.current.load();
      } catch (error) {
        console.error("Error loading audio:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadAudio();
    
    // Cleanup on unmount
    return () => {
      mounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [sampleId, isPreview, format]);
  
  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Update time display
    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };
    
    // Set duration when metadata is loaded
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    // Handle playback end
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };
    
    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    // Clean up listeners
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // Handle play/pause
  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          onPlay?.();
        })
        .catch(error => {
          console.error("Playback failed:", error);
        });
    }
  };
  
  // Handle seeking
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = value[0];
    audio.currentTime = newTime;
    setProgress(newTime);
  };
  
  // Format time display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          disabled={isLoading || !blobUrl}
          className="w-10 h-10 rounded-full flex-shrink-0"
        >
          {isLoading ? (
            <span className="h-5 w-5 animate-spin">⟳</span>
          ) : isPlaying ? (
            <span className="h-5 w-5">⏸️</span>
          ) : (
            <span className="h-5 w-5">▶️</span>
          )}
        </Button>
        
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-10">
              {formatTime(progress)}
            </span>
            <Slider
              value={[progress]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={isLoading || !blobUrl}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-10">
              {formatTime(duration)}
            </span>
          </div>
          
          {isPreview && (
            <div className="text-xs text-amber-600 italic">
              Preview only • Purchase to download full quality
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 