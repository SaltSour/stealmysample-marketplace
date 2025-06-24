'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TagSelector } from '@/components/tag-selector'

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const QUALITY_LEVELS = ['low', 'medium', 'high']
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export function AdvancedSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isOpen, setIsOpen] = useState(false)
  const [searchState, setSearchState] = useState({
    query: searchParams.get('q') || '',
    genres: searchParams.getAll('genres') || [],
    instruments: searchParams.getAll('instruments') || [],
    bpmRange: {
      min: parseInt(searchParams.get('bpm_min') || '0'),
      max: parseInt(searchParams.get('bpm_max') || '999')
    },
    key: searchParams.get('key') || '',
    quality: searchParams.get('quality') as 'low' | 'medium' | 'high' | undefined,
    priceRange: {
      min: parseFloat(searchParams.get('price_min') || '0'),
      max: parseFloat(searchParams.get('price_max') || '999999')
    },
    format: {
      wav: searchParams.get('format') === 'wav',
      stems: searchParams.get('format') === 'stems',
      midi: searchParams.get('format') === 'midi'
    },
    duration: {
      min: parseFloat(searchParams.get('duration_min') || '0'),
      max: parseFloat(searchParams.get('duration_max') || '999999')
    },
    sort: searchParams.get('sort') || 'relevance'
  })

  const handleSearch = () => {
    const params = new URLSearchParams()
    
    if (searchState.query) params.set('q', searchState.query)
    searchState.genres.forEach(genre => params.append('genres', genre))
    searchState.instruments.forEach(instrument => params.append('instruments', instrument))
    
    if (searchState.bpmRange.min > 0) params.set('bpm_min', searchState.bpmRange.min.toString())
    if (searchState.bpmRange.max < 999) params.set('bpm_max', searchState.bpmRange.max.toString())
    
    if (searchState.key) params.set('key', searchState.key)
    if (searchState.quality) params.set('quality', searchState.quality)
    
    if (searchState.priceRange.min > 0) params.set('price_min', searchState.priceRange.min.toString())
    if (searchState.priceRange.max < 999999) params.set('price_max', searchState.priceRange.max.toString())
    
    if (searchState.format.wav) params.set('format', 'wav')
    else if (searchState.format.stems) params.set('format', 'stems')
    else if (searchState.format.midi) params.set('format', 'midi')
    
    if (searchState.duration.min > 0) params.set('duration_min', searchState.duration.min.toString())
    if (searchState.duration.max < 999999) params.set('duration_max', searchState.duration.max.toString())
    
    if (searchState.sort !== 'relevance') params.set('sort', searchState.sort)
    
    router.push(`/search?${params.toString()}`)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Advanced Search</Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Advanced Search</SheetTitle>
          <SheetDescription>
            Fine-tune your sample search with advanced filters
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="query">Search Query</Label>
            <Input
              id="query"
              value={searchState.query}
              onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
              placeholder="Enter keywords..."
            />
          </div>

          <div className="space-y-2">
            <Label>Genres</Label>
            <TagSelector
              type="genre"
              selectedTags={searchState.genres}
              onTagSelect={(tags) => setSearchState(prev => ({ ...prev, genres: tags }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Instruments</Label>
            <TagSelector
              type="instrument"
              selectedTags={searchState.instruments}
              onTagSelect={(tags) => setSearchState(prev => ({ ...prev, instruments: tags }))}
            />
          </div>

          <div className="space-y-2">
            <Label>BPM Range</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max="999"
                value={searchState.bpmRange.min}
                onChange={(e) => setSearchState(prev => ({
                  ...prev,
                  bpmRange: { ...prev.bpmRange, min: parseInt(e.target.value) }
                }))}
                className="w-20"
              />
              <span>to</span>
              <Input
                type="number"
                min="0"
                max="999"
                value={searchState.bpmRange.max}
                onChange={(e) => setSearchState(prev => ({
                  ...prev,
                  bpmRange: { ...prev.bpmRange, max: parseInt(e.target.value) }
                }))}
                className="w-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Key</Label>
            <Select
              value={searchState.key}
              onValueChange={(value) => setSearchState(prev => ({ ...prev, key: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Key</SelectItem>
                {MUSICAL_KEYS.map(key => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quality Level</Label>
            <Select
              value={searchState.quality || ''}
              onValueChange={(value) => setSearchState(prev => ({
                ...prev,
                quality: value as typeof searchState.quality
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Quality</SelectItem>
                {QUALITY_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Price Range ($)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={searchState.priceRange.min}
                onChange={(e) => setSearchState(prev => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, min: parseFloat(e.target.value) }
                }))}
                className="w-24"
              />
              <span>to</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={searchState.priceRange.max}
                onChange={(e) => setSearchState(prev => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, max: parseFloat(e.target.value) }
                }))}
                className="w-24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={searchState.format.wav}
                  onCheckedChange={(checked) => setSearchState(prev => ({
                    ...prev,
                    format: { wav: checked, stems: false, midi: false }
                  }))}
                />
                <Label>WAV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={searchState.format.stems}
                  onCheckedChange={(checked) => setSearchState(prev => ({
                    ...prev,
                    format: { wav: false, stems: checked, midi: false }
                  }))}
                />
                <Label>Stems</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={searchState.format.midi}
                  onCheckedChange={(checked) => setSearchState(prev => ({
                    ...prev,
                    format: { wav: false, stems: false, midi: checked }
                  }))}
                />
                <Label>MIDI</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration (seconds)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                step="0.1"
                value={searchState.duration.min}
                onChange={(e) => setSearchState(prev => ({
                  ...prev,
                  duration: { ...prev.duration, min: parseFloat(e.target.value) }
                }))}
                className="w-24"
              />
              <span>to</span>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={searchState.duration.max}
                onChange={(e) => setSearchState(prev => ({
                  ...prev,
                  duration: { ...prev.duration, max: parseFloat(e.target.value) }
                }))}
                className="w-24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={searchState.sort}
              onValueChange={(value) => setSearchState(prev => ({ ...prev, sort: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 