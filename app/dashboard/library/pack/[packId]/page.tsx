"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AudioPlayer } from "@/components/audio/audio-player"

interface SampleMetadata {
  tempo: string
  key: string
  genre: string
  instrument: string
  keywords: string[]
  pricing: {
    wav: number
    stems: number
    midi: number
  }
  license: string
}

interface Sample {
  id: string
  name: string
  url: string
  metadata: SampleMetadata
}

export default function PackEditPage() {
  const params = useParams()
  const [samples, setSamples] = useState<Sample[]>([])
  const [requiresUpdate, setRequiresUpdate] = useState(false)

  const updateSampleMetadata = (index: number, field: string, value: any) => {
    const newSamples = [...samples]
    newSamples[index].metadata = {
      ...newSamples[index].metadata,
      [field]: value
    }
    setSamples(newSamples)
    setRequiresUpdate(true)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        My library &gt; Pack {params.packId} &gt; Samples
      </div>

      {/* Sample List */}
      <div className="space-y-4">
        {samples.map((sample, index) => (
          <div key={sample.id} className="space-y-4">
            {/* Audio Player */}
            <div className="flex items-center gap-4">
              <AudioPlayer
                url={sample.url}
                title={sample.name}
              />
              <Button variant="ghost" size="sm">
                Demo
              </Button>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-8 gap-2">
              <Select
                value={sample.metadata.tempo}
                onValueChange={(value) => updateSampleMetadata(index, "tempo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tempo" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(200)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1} BPM
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sample.metadata.key}
                onValueChange={(value) => updateSampleMetadata(index, "key", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cmaj">C</SelectItem>
                  <SelectItem value="dmaj">D</SelectItem>
                  {/* Add more keys */}
                </SelectContent>
              </Select>

              <Select
                value={sample.metadata.genre}
                onValueChange={(value) => updateSampleMetadata(index, "genre", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trap">Trap</SelectItem>
                  <SelectItem value="hiphop">Hip Hop</SelectItem>
                  <SelectItem value="rnb">R&B</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sample.metadata.instrument}
                onValueChange={(value) => updateSampleMetadata(index, "instrument", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Instrument" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drums">Drums</SelectItem>
                  <SelectItem value="bass">Bass</SelectItem>
                  <SelectItem value="synth">Synth</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Keywords"
                value={sample.metadata.keywords.join(", ")}
                onChange={(e) => updateSampleMetadata(index, "keywords", e.target.value.split(",").map(k => k.trim()))}
                className="col-span-2"
              />

              <Select
                value={sample.metadata.license}
                onValueChange={(value) => updateSampleMetadata(index, "license", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="License" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  MIDI
                </Button>
                <Button variant="ghost" size="sm">
                  Stems
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {requiresUpdate && (
        <div className="fixed bottom-0 right-0 p-4 bg-background border-t w-full flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Changes require user update
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Save as Draft</Button>
            <Button>Submit for Review</Button>
          </div>
        </div>
      )}
    </div>
  )
} 