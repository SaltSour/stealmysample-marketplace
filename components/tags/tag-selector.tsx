"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GENRES, INSTRUMENTS } from "@/lib/tags"
import { Check, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagSelectorProps {
  type: "genre" | "instrument"
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagSelector({
  type,
  selectedTags,
  onTagsChange,
  disabled = false
}: TagSelectorProps) {
  const items = type === "genre" ? GENRES : INSTRUMENTS
  const prefix = type === "genre" ? "genre:" : "instrument:"
  
  const currentTags = selectedTags
    .filter(tag => tag.startsWith(prefix))
    .map(tag => tag.replace(prefix, ""))

  const handleTagSelect = (item: string) => {
    if (disabled) return

    const tag = `${prefix}${item}`
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    
    onTagsChange(newTags)
  }

  const getButtonText = () => {
    if (currentTags.length === 0) {
      return type === "genre" ? "Add Genres" : "Add Instrument"
    }
    return currentTags.join(", ")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "min-w-[120px] justify-start",
            disabled && "opacity-50 cursor-not-allowed",
            currentTags.length > 0 && "text-primary"
          )}
          disabled={disabled}
        >
          <Tag className={cn(
            "h-4 w-4 mr-2",
            currentTags.length === 0 && "text-muted-foreground"
          )} />
          {getButtonText()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start"
        className="w-[200px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={item}
            onClick={() => handleTagSelect(item)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed",
              currentTags.includes(item) && "bg-primary/5"
            )}
          >
            <div className={cn(
              "w-4 h-4 border rounded-sm flex items-center justify-center transition-colors",
              currentTags.includes(item) 
                ? "border-primary bg-primary text-primary-foreground" 
                : "border-muted-foreground"
            )}>
              {currentTags.includes(item) && (
                <Check className="h-3 w-3" />
              )}
            </div>
            {item}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 