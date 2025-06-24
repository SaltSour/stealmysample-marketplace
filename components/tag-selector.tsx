"use client";

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X } from "lucide-react"

const PREDEFINED_TAGS = {
  genre: [
    'Hip Hop', 'Trap', 'R&B', 'Pop', 'Rock', 'Electronic', 'House', 'Techno',
    'Ambient', 'Jazz', 'Soul', 'Funk', 'Reggae', 'Latin', 'World', 'Classical',
    'Metal', 'Punk', 'Blues', 'Country', 'Folk', 'Indie', 'Alternative'
  ],
  instrument: [
    'Drums', 'Bass', 'Guitar', 'Piano', 'Synth', 'Strings', 'Brass', 'Woodwinds',
    'Percussion', 'Vocals', 'FX', 'Pads', 'Keys', 'Lead', 'Pluck', 'One Shot',
    'Loop', 'Melody', 'Chord', 'Texture', 'Foley', 'Ambient'
  ]
}

interface TagSelectorProps {
  type: 'genre' | 'instrument'
  selectedTags: string[]
  onTagSelect: (tags: string[]) => void
}

export function TagSelector({ type, selectedTags, onTagSelect }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('')
  const [availableTags, setAvailableTags] = useState(PREDEFINED_TAGS[type])

  const handleAddCustomTag = () => {
    if (customTag && !availableTags.includes(customTag)) {
      setAvailableTags(prev => [...prev, customTag])
      if (!selectedTags.includes(customTag)) {
        onTagSelect([...selectedTags, customTag])
      }
      setCustomTag('')
    }
  }

  const toggleTag = (tag: string) => {
    const isSelected = selectedTags.includes(tag)
    if (isSelected) {
      onTagSelect(selectedTags.filter(t => t !== tag))
    } else {
      onTagSelect([...selectedTags, tag])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {selectedTags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => toggleTag(tag)}
          >
            {tag}
            <X className="ml-1 h-3 w-3" />
          </Badge>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder={`Add custom ${type}...`}
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddCustomTag()
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddCustomTag}
          disabled={!customTag}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[200px] rounded-md border p-2">
        <div className="grid grid-cols-2 gap-1">
          {availableTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer justify-center"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 