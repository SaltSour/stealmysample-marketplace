import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Hook to check if the current user owns a sample
export function useSampleOwnership(sampleId: string | undefined | null) {
  const { data: session, status } = useSession();
  const [isOwned, setIsOwned] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset state when sampleId changes
    setIsLoading(true);
    setIsOwned(false);
    setError(null);
    
    // Don't make a request if we're not authenticated or don't have a sample ID
    if (status !== 'authenticated' || !sampleId) {
      setIsLoading(false);
      return;
    }
    
    const checkOwnership = async () => {
      try {
        const response = await fetch(`/api/user/ownership/sample?sampleId=${sampleId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check sample ownership');
        }
        
        const data = await response.json();
        setIsOwned(data.owned);
      } catch (err) {
        console.error('Error checking sample ownership:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOwnership();
  }, [sampleId, status]);
  
  return { isOwned, isLoading, error };
}

export function useBatchSampleOwnership(sampleIds: string[]) {
  const { data: session, status } = useSession();
  const [ownership, setOwnership] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated' || sampleIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const checkOwnership = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        sampleIds.forEach(id => params.append('sampleId', id));
        
        const response = await fetch(`/api/user/ownership/sample?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch ownership');

        const data = await response.json();
        setOwnership(data.ownership);
      } catch (error) {
        console.error("Failed to check batch sample ownership", error);
        setOwnership({});
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnership();
  }, [sampleIds, status]);

  return { ownership, isLoading };
} 