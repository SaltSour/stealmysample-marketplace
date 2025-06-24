"use client"

import React, { useEffect, useRef, useState, memo } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { cn } from '@/lib/utils'

// Cache for storing already loaded waveform data - make this more efficient
const waveformCache = new Map<string, { peaks: number[], duration: number }>()

// Define the props interface
interface WaveformProps {
  audioUrl: string;
  isPlaying: boolean;
  onReady?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  className?: string;
  duration?: number;
  currentTime?: number;
  lazyLoad?: boolean; // Add option to lazy load waveform
}

// Create a serialization function to convert props to a cache key
function createCacheKey(props: Pick<WaveformProps, 'audioUrl' | 'height' | 'waveColor' | 'progressColor' | 'barWidth' | 'barGap' | 'barRadius'>): string {
  const { audioUrl, height, waveColor, progressColor, barWidth, barGap, barRadius } = props;
  return `${audioUrl}-${height}-${waveColor}-${progressColor}-${barWidth}-${barGap}-${barRadius}`;
}

// Memory-efficient helper function to sample an array down to a specific length
function sampleArray(array: number[], sampleSize: number): number[] {
  const result = [];
  const step = Math.floor(array.length / sampleSize) || 1;
  
  for (let i = 0; i < array.length; i += step) {
    result.push(array[i]);
    if (result.length >= sampleSize) break;
  }
  
  return result;
}

// Memoize the Waveform component to prevent unnecessary re-renders
const Waveform = memo(function Waveform({
  audioUrl,
  isPlaying,
  onReady,
  onPlay,
  onPause,
  onSeek,
  height = 50,
  waveColor = 'rgba(255, 255, 255, 0.5)',
  progressColor = 'rgba(255, 255, 255, 0.8)',
  barWidth = 2,
  barGap = 2,
  barRadius = 3,
  className,
  duration,
  currentTime,
  lazyLoad = true
}: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [visible, setVisible] = useState(true) // Set default to true to ensure waveform is visible by default
  const audioUrlRef = useRef(audioUrl)
  const isUpdatingRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const destroyingRef = useRef(false)
  
  // Generate a stable cache key for this instance
  const cacheKey = useRef(createCacheKey({
    audioUrl, height, waveColor, progressColor, barWidth, barGap, barRadius
  }));

  // Modified lazy loading - only use if explicitly enabled
  useEffect(() => {
    if (!lazyLoad || visible) return;

    const element = waveformRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('Waveform visible, initializing:', audioUrl);
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // Preload when getting closer to viewport
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazyLoad, visible, audioUrl]);
  
  // Initialize wavesurfer only once when component mounts and is visible
  useEffect(() => {
    // Skip if already initialized, missing container, or not visible
    if (initialized || !waveformRef.current || (lazyLoad && !visible)) return
    
    console.log('Initializing waveform for:', audioUrl);
    
    // Performance optimization: Skip heavy processing if component is hidden
    if (document.hidden) {
      const visibilityHandler = () => {
        if (!document.hidden && !initialized && waveformRef.current && visible) {
          document.removeEventListener('visibilitychange', visibilityHandler);
          // Continue initialization when tab becomes visible
          setInitialized(true);
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
      return;
    }
    
    try {
      // Set initialized early to prevent re-initialization attempts
      setInitialized(true);
      
      // Initial low-quality settings for faster rendering
      const initialOptions = {
        container: waveformRef.current,
        waveColor: waveColor,
        progressColor: progressColor,
        height: height,
        barWidth: barWidth,
        barGap: barGap,
        barRadius: barRadius,
        cursorWidth: 1,
        normalize: true,
        backend: 'MediaElement',
        mediaControls: false,
        autoplay: false,
        interact: true, // Enable default interaction
        responsive: true,
        // Performance optimizations
        partialRender: true,
        hideScrollbar: true
      };
      
      console.log('Creating WaveSurfer instance with options:', initialOptions);
      
      // Create a new wavesurfer instance with optimized options
      const ws = WaveSurfer.create(initialOptions);
      
      wavesurfer.current = ws;
      
      // Set up event listeners
      ws.on('ready', () => {
        console.log('Waveform ready for:', audioUrlRef.current);
        setLoading(false);
        
        if (onReady && ws.getDuration() > 0) {
          onReady(ws.getDuration());
        }
      });
      
      // Add interaction event handlers
      ws.on('click', (params) => {
        console.log('Waveform clicked at position:', params?.relativePos);
        if (onSeek && params?.relativePos) {
          const seekTime = params.relativePos * ws.getDuration();
          onSeek(seekTime);
        }
      });
      
      // Add play/pause handlers
      ws.on('play', () => {
        console.log('Waveform play event');
        if (onPlay) onPlay();
      });
      
      ws.on('pause', () => {
        console.log('Waveform pause event');
        if (onPause) onPause();
      });
      
      ws.on('error', (err) => {
        console.error('Waveform error for URL:', audioUrlRef.current, err);
        setLoading(false);
      });
      
      // Start loading immediately - use simple approach
      console.log('Loading audio from URL:', audioUrlRef.current);
      try {
        ws.load(audioUrlRef.current);
      } catch (loadError) {
        console.error('Error during waveform load call:', loadError);
        setLoading(false);
      }
      
      // Clean up on unmount
      return () => {
        console.log('Cleaning up waveform for:', audioUrlRef.current);
        if (wavesurfer.current) {
          try {
            // First pause to prevent audio conflicts
            wavesurfer.current.pause();
            // Then destroy
            wavesurfer.current.destroy();
          } catch (cleanupError) {
            console.error('Error during waveform cleanup:', cleanupError);
          }
          wavesurfer.current = null;
        }
      };
    } catch (error) {
      console.error('Error creating waveform:', error);
      setLoading(false);
      setInitialized(false); // Reset initialization flag on error
    }
  }, [visible, lazyLoad, audioUrl, height, barGap, barRadius, barWidth, waveColor, progressColor, onReady, onPlay, onPause, onSeek]);
  
  // Handle audio URL changes
  useEffect(() => {
    if (audioUrl !== audioUrlRef.current && wavesurfer.current && initialized) {
      audioUrlRef.current = audioUrl
      setLoading(true)
      
      // Only reload if the URL actually changed
      try {
        // More efficient loading by specifying metadata only
        wavesurfer.current.load(audioUrl, [], 'metadata');
      } catch (error) {
        console.error('Error reloading waveform:', error)
        setLoading(false)
      }
    }
  }, [audioUrl, initialized])
  
  // Sync playback state with isPlaying prop
  useEffect(() => {
    // Only attempt to control playback if initialized and not loading
    if (!wavesurfer.current || loading || !initialized) {
      console.log('Skipping playback sync - not ready:', { initialized, loading });
      return;
    }
    
    // Sync playback state - use a try/catch to handle potential errors
    try {
      console.log('Syncing playback state to:', isPlaying ? 'playing' : 'paused');
      
      if (isPlaying && !wavesurfer.current.isPlaying()) {
        const playPromise = wavesurfer.current.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(err => {
            console.error('Error during waveform play():', err);
          });
        }
      } else if (!isPlaying && wavesurfer.current.isPlaying()) {
        wavesurfer.current.pause();
      }
    } catch (error) {
      console.error('Error controlling waveform playback:', error);
    }
  }, [isPlaying, loading, initialized]);
  
  // Sync current time with the persistent player
  useEffect(() => {
    if (!wavesurfer.current || !initialized || loading || !currentTime) return
    
    try {
      // Only update if the difference is significant (prevent jitter)
      const waveformTime = wavesurfer.current.getCurrentTime();
      if (Math.abs(waveformTime - currentTime) > 0.3) {
        console.log('Syncing waveform time to:', currentTime);
        
        // Calculate relative position and use seekTo
        const seekDuration = wavesurfer.current.getDuration();
        if (seekDuration > 0) {
          const relativePosition = currentTime / seekDuration;
          wavesurfer.current.seekTo(relativePosition);
        }
      }
    } catch (error) {
      console.error('Error syncing waveform time:', error);
    }
  }, [currentTime, initialized, loading]);

  // Handle clicking on the waveform container directly
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wavesurfer.current || !initialized || loading) return;
    
    try {
      // Set flag to prevent event loops
      isUpdatingRef.current = true;
      
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const relativePos = (e.clientX - rect.left) / rect.width;
      
      // Use the provided duration prop if available for better sync with the persistent player
      // Otherwise fall back to wavesurfer's duration
      const seekDuration = duration && duration > 0 
        ? duration 
        : wavesurfer.current.getDuration();
        
      if (seekDuration > 0 && onSeek) {
        const seekTime = relativePos * seekDuration;
        
        // Update the waveform UI without triggering seeking event
        wavesurfer.current.seekTo(relativePos);
        
        // Call the onSeek callback with the calculated time
        onSeek(seekTime);
        
        // Schedule flag reset for after all event processing
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    } catch (error) {
      console.error('Error in manual click handler:', error);
      isUpdatingRef.current = false;
    }
  }

  // For the onClick event from wavesurfer
  const handleWavesurferClick = (event: any) => {
    if (!onSeek || loading) return;
    
    try {
      // Set flag to prevent event loops
      isUpdatingRef.current = true;
      
      // Get the relative position from the click event
      const relativePos = event?.relativePos || 0;
      
      // Use the provided duration prop if available
      const seekDuration = duration && duration > 0 
        ? duration 
        : wavesurfer.current?.getDuration() || 0;
        
      if (seekDuration > 0) {
        const seekTime = relativePos * seekDuration;
        onSeek(seekTime);
        
        // Schedule flag reset for after all event processing
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    } catch (error) {
      console.error('Error handling waveform click:', error);
      isUpdatingRef.current = false;
    }
  }

  // Render placeholder first if lazy loading
  if (lazyLoad && !visible) {
    console.log('Waveform rendering placeholder for URL:', audioUrl);
    return (
      <div 
        ref={waveformRef}
        className={cn(
          "relative bg-black/20",
          className
        )}
        style={{ height: `${height}px` }}
      />
    );
  }

  return (
    <div className={cn("relative", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
          <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
        </div>
      )}
      <div 
        ref={waveformRef} 
        onClick={handleContainerClick}
        className={cn(
          "w-full", 
          initialized && !loading && "cursor-pointer"
        )}
      />
    </div>
  )
})

// Export with a display name for debugging
Waveform.displayName = 'Waveform';

export { Waveform }; 