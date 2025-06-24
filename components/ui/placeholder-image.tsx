"use client"

import { cn } from "@/lib/utils"
import { Music2, User } from "lucide-react"

interface PlaceholderImageProps {
  type: "avatar" | "pack"
  className?: string
}

export function PlaceholderImage({ type, className }: PlaceholderImageProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted rounded-lg",
        type === "avatar" ? "w-10 h-10" : "w-full aspect-square",
        className
      )}
    >
      {type === "avatar" ? (
        <User className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Music2 className="w-8 h-8 text-muted-foreground" />
      )}
    </div>
  )
} 