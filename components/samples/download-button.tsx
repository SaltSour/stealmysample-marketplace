import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DownloadButtonProps {
  sampleId: string;
  format?: "WAV" | "STEMS" | "MIDI";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Secure download button that fetches a time-limited signed URL
 * and initiates download only if user has purchased the sample
 */
export function DownloadButton({
  sampleId,
  format = "WAV",
  variant = "default",
  size = "default",
  className,
  children,
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Request signed URL from our API
      const response = await fetch(
        `/api/download/sample/${sampleId}?format=${format}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate download link");
      }
      
      const data = await response.json();
      
      // Use window.location to navigate to the signed URL
      // This will trigger the browser's download prompt
      window.location.href = data.url;
      
      toast.success("Download started", {
        description: `Your ${format} file will download shortly`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <span className="animate-spin mr-2">⟳</span>
      ) : (
        <span className="mr-2">⬇️</span>
      )}
      {children || `Download ${format}`}
    </Button>
  );
} 