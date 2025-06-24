"use client"

import { useEffect, useState } from 'react'

interface AudioPreloaderProps {
  audioUrls: string[];
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * Component that preloads audio files in the background
 * This helps improve the perceived performance when many samples are loaded
 */
export function AudioPreloader({ audioUrls, onProgress }: AudioPreloaderProps) {
  const [loadedCount, setLoadedCount] = useState(0);
  
  useEffect(() => {
    if (!audioUrls.length) return;
    
    let mounted = true;
    const audioElements: HTMLAudioElement[] = [];
    
    // Preload a batch of 2 audios at a time to prevent overwhelming the browser
    const preloadBatch = async (startIndex: number, batchSize: number) => {
      if (!mounted) return;
      
      const endIndex = Math.min(startIndex + batchSize, audioUrls.length);
      const batchPromises = [];
      
      for (let i = startIndex; i < endIndex; i++) {
        const audio = new Audio();
        audio.preload = "metadata"; // Only preload metadata to save bandwidth
        
        const loadPromise = new Promise<void>((resolve) => {
          const handleLoad = () => {
            if (mounted) {
              setLoadedCount(prev => {
                const newCount = prev + 1;
                if (onProgress) {
                  onProgress(newCount, audioUrls.length);
                }
                return newCount;
              });
            }
            audio.removeEventListener('loadedmetadata', handleLoad);
            audio.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = () => {
            audio.removeEventListener('loadedmetadata', handleLoad);
            audio.removeEventListener('error', handleError);
            resolve(); // Resolve anyway to continue with other files
          };
          
          audio.addEventListener('loadedmetadata', handleLoad, { once: true });
          audio.addEventListener('error', handleError, { once: true });
        });
        
        audio.src = audioUrls[i];
        audioElements.push(audio);
        batchPromises.push(loadPromise);
      }
      
      await Promise.all(batchPromises);
      
      // Load the next batch if there are more files
      if (endIndex < audioUrls.length && mounted) {
        setTimeout(() => {
          preloadBatch(endIndex, batchSize);
        }, 100); // Small delay between batches
      }
    };
    
    // Start preloading with first batch
    preloadBatch(0, 2);
    
    return () => {
      mounted = false;
      // Clean up audio elements
      audioElements.forEach(audio => {
        audio.src = '';
        audio.load();
      });
    };
  }, [audioUrls, onProgress]);
  
  // This component doesn't render anything visible
  return null;
} 