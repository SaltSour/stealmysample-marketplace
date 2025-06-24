import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tag, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Import categories from samples page to maintain consistency
export const categories = {
  genres: [
    "Hip Hop",
    "R&B",
    "Pop",
    "Electronic",
    "Rock",
    "Jazz",
    "Classical",
    "World",
  ],
  instruments: [
    "Drums",
    "Bass",
    "Keys",
    "Guitar",
    "Synth",
    "Vocals",
    "FX",
    "Other",
  ],
  keys: [
    "A", "Am", "B", "Bm", "C", "Cm", "D", "Dm", "E", "Em", "F", "Fm", "G", "Gm"
  ]
}

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  type: "genre" | "instrument" | "key"
}

export function TagSelector({ selectedTags, onTagsChange, type }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [localSelectedTags, setLocalSelectedTags] = useState(selectedTags)
  
  const getAvailableTags = () => {
    switch (type) {
      case "genre":
        return categories.genres
      case "instrument":
        return categories.instruments
      case "key":
        return categories.keys
      default:
        return []
    }
  }

  const availableTags = getAvailableTags()

  const toggleTag = (tag: string) => {
    if (type === "key") {
      setLocalSelectedTags(localSelectedTags[0] === tag ? [] : [tag]);
    } else {
      const newTags = localSelectedTags.includes(tag)
        ? localSelectedTags.filter((t) => t !== tag)
        : [...localSelectedTags, tag]
      setLocalSelectedTags(newTags)
    }
  }

  const handleConfirm = () => {
    onTagsChange(localSelectedTags)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-dashed"
          >
            <Tag className="mr-2 h-4 w-4" />
            {`Add ${type.charAt(0).toUpperCase() + type.slice(1)}s`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 tag-selector-popover">
          <div>
            <Command>
              <CommandInput placeholder={`Search ${type}...`} className="h-9" />
              <CommandEmpty>No {type} found.</CommandEmpty>
              <CommandGroup>
                {availableTags.map((tag) => (
                  <CommandItem
                    key={tag}
                    onSelect={(currentValue) => {
                      // Prevent default behavior of closing popover
                      toggleTag(currentValue);
                    }}
                    className="cursor-pointer"
                  >
                    <div onClick={() => toggleTag(tag)} className="flex items-center w-full">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          localSelectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tag}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
            <div className="p-2 border-t">
              <Button onClick={handleConfirm} className="w-full" size="sm">
                Confirm
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => toggleTag(tag)}
          >
            {tag}
            <span className="ml-1">×</span>
          </Badge>
        ))}
      </div>
    </div>
  )
} 