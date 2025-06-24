"use client"

import { Music, Clock, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AudioMetadataProps {
  bpm?: number
  key?: string
  duration?: string
  tags?: string[]
  className?: string
  variant?: "default" | "compact"
}

export function AudioMetadata({
  bpm,
  key,
  duration,
  tags = [],
  className,
  variant = "default"
}: AudioMetadataProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3 text-sm text-muted-foreground", className)}>
        {bpm && (
          <div className="flex items-center gap-1">
            <Music className="h-3 w-3" />
            <span>{bpm} BPM</span>
          </div>
        )}
        {key && (
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            <span>{key}</span>
          </div>
        )}
        {duration && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{duration}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-4 text-sm">
        {bpm && (
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-muted-foreground" />
            <span>{bpm} BPM</span>
          </div>
        )}
        {key && (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span>{key}</span>
          </div>
        )}
        {duration && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{duration}</span>
          </div>
        )}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 