"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface FilterBarProps {
  onFilterChangeAction: (type: string, value: string | null) => void
  activeFilters: Record<string, string | null>
}

const TEMPO_RANGES = [
  "60-80 BPM",
  "80-100 BPM",
  "100-120 BPM",
  "120-140 BPM",
  "140-160 BPM",
  "160+ BPM",
]

const KEYS = [
  "C", "C#/Db", "D", "D#/Eb", "E", "F",
  "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B",
]

const INSTRUMENTS = [
  "Drums",
  "Bass",
  "Guitar",
  "Piano",
  "Synth",
  "Vocals",
  "Strings",
  "Brass",
]

export function FilterBar({ onFilterChangeAction, activeFilters }: FilterBarProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 py-4">
        <Button
          variant={activeFilters.sort === "popular" ? "default" : "outline"}
          onClick={() => onFilterChangeAction("sort", activeFilters.sort === "popular" ? null : "popular")}
          className="min-w-[100px]"
        >
          POPULAR
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[100px]">
              TEMPO <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {TEMPO_RANGES.map((range) => (
              <DropdownMenuCheckboxItem
                key={range}
                checked={activeFilters.tempo === range}
                onCheckedChange={() => onFilterChangeAction("tempo", activeFilters.tempo === range ? null : range)}
              >
                {range}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[100px]">
              KEY <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {KEYS.map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={activeFilters.key === key}
                onCheckedChange={() => onFilterChangeAction("key", activeFilters.key === key ? null : key)}
              >
                {key}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[100px]">
              INSTRUMENT <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {INSTRUMENTS.map((instrument) => (
              <DropdownMenuCheckboxItem
                key={instrument}
                checked={activeFilters.instrument === instrument}
                onCheckedChange={() => onFilterChangeAction("instrument", activeFilters.instrument === instrument ? null : instrument)}
              >
                {instrument}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[100px]">
              LICENSE <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem onSelect={() => onFilterChangeAction("license", "standard")}>
              Standard License
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onFilterChangeAction("license", "exclusive")}>
              Exclusive License
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 