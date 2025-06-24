"use client"

import { useState, useEffect } from "react"
import { SampleUploader, SampleListSample } from "./sample-uploader"
import { SampleList, Sample } from "./sample-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { PlusCircle, Music2, Library, Info, FileMusic, Archive, Music } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

interface SampleManagerProps {
  packId: string
  initialSamples?: Sample[]
  onSamplesChange?: (samples: Sample[]) => void
  isLoading?: boolean
}

export function SampleManager({
  packId,
  initialSamples = [],
  onSamplesChange,
  isLoading = false
}: SampleManagerProps) {
  const [samples, setSamples] = useState<Sample[]>(initialSamples)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("samples")

  // Sync with initialSamples when they change
  useEffect(() => {
    setSamples(initialSamples)
  }, [initialSamples])

  const handleUploadComplete = async (newSamples: SampleListSample[]) => {
    try {
      setIsUploading(true)

      // Save samples to the database
      const response = await fetch(`/api/packs/${packId}/samples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          samples: newSamples
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to save samples')
      }

      const result = await response.json()
      const savedSamples = result.samples

      // Update local state with the new samples
      const updatedSamples = [...samples, ...savedSamples]
      setSamples(updatedSamples)
      
      // Notify parent of the update
      onSamplesChange?.(updatedSamples)

      // Switch to samples tab after upload
      setActiveTab("samples")
      
      toast.success(`Successfully added ${savedSamples.length} samples`)
    } catch (error) {
      console.error("Error handling upload:", error)
      toast.error(error instanceof Error ? error.message : "Failed to process samples")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveSample = async (index: number) => {
    try {
      const sampleToRemove = samples[index]
      
      // Remove from database
      const response = await fetch(`/api/packs/${packId}/samples/${sampleToRemove.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to remove sample')
      }

      // Update local state
      const updatedSamples = samples.filter((_, i) => i !== index)
      setSamples(updatedSamples)
      onSamplesChange?.(updatedSamples)
      
      toast.success('Sample removed successfully')
    } catch (error) {
      console.error("Error removing sample:", error)
      toast.error(error instanceof Error ? error.message : "Failed to remove sample")
    }
  }

  const handleUpdateSample = async (index: number, updatedSample: Sample) => {
    try {
      // Update in database
      const response = await fetch(`/api/packs/${packId}/samples/${updatedSample.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSample),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to update sample')
      }

      // Update local state
      const updatedSamples = samples.map((sample, i) =>
        i === index ? updatedSample : sample
      )
      setSamples(updatedSamples)
      onSamplesChange?.(updatedSamples)
    } catch (error) {
      console.error("Error updating sample:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update sample")
    }
  }

  const getFormatStats = () => {
    const stats = {
      wav: samples.filter(s => s.hasWav).length,
      stems: samples.filter(s => s.hasStems).length,
      midi: samples.filter(s => s.hasMidi).length,
    };
    return stats;
  }

  const formatStats = getFormatStats();
  const remaining = 100 - samples.length;

  return (
    <Card className="overflow-hidden border-border/30">
      <div className="bg-card p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">Sample Manager</h3>
            <p className="text-sm text-muted-foreground">
              Upload and organize your sample pack content
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-2 py-1">
              <Music2 className="w-3.5 h-3.5 mr-1" />
              <span>{samples.length} samples</span>
            </Badge>
            {remaining > 0 && (
              <Badge variant="outline" className="bg-primary/5 px-2 py-1">
                <span>{remaining} remaining</span>
              </Badge>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="samples" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-black/40 backdrop-blur-sm border border-zinc-800/40 p-1 rounded-md">
            <TabsTrigger 
              value="samples" 
              disabled={isLoading} 
              className="flex items-center gap-1.5 transition-all duration-200 hover:bg-zinc-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6D28D9] data-[state=active]:to-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-md rounded-sm"
            >
              <Library className="h-4 w-4" />
              <span>Your Samples</span>
              {samples.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-white/10 text-white">
                  {samples.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              disabled={isLoading} 
              className="flex items-center gap-1.5 transition-all duration-200 hover:bg-zinc-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6D28D9] data-[state=active]:to-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-md rounded-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Upload Samples</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="samples" className="pt-4">
            {samples.length > 0 ? (
              <div className="space-y-4">
                {/* Format stats summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-black/30 border border-zinc-800/40 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-primary-foreground">
                        <FileMusic className="h-4 w-4 text-primary/80" />
                        <div className="text-xs font-medium">WAV</div>
                      </div>
                      <Badge variant="outline" className="bg-gradient-to-r from-[#6D28D9]/20 to-[#2563EB]/20 border-zinc-800/40">
                        {formatStats.wav}/{samples.length}
                      </Badge>
                    </div>
                    <Progress 
                      value={(formatStats.wav / samples.length) * 100} 
                      className="h-1.5 bg-zinc-800/40 group-hover:bg-zinc-800/60 transition-colors" 
                      indicatorClassName="bg-gradient-to-r from-[#6D28D9] to-[#2563EB]"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-black/30 border border-zinc-800/40 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-primary-foreground">
                        <Archive className="h-4 w-4 text-primary/80" />
                        <div className="text-xs font-medium">Stems</div>
                      </div>
                      <Badge variant="outline" className="bg-gradient-to-r from-[#6D28D9]/20 to-[#2563EB]/20 border-zinc-800/40">
                        {formatStats.stems}/{samples.length}
                      </Badge>
                    </div>
                    <Progress 
                      value={(formatStats.stems / samples.length) * 100} 
                      className="h-1.5 bg-zinc-800/40 group-hover:bg-zinc-800/60 transition-colors" 
                      indicatorClassName="bg-gradient-to-r from-[#6D28D9] to-[#2563EB]"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-black/30 border border-zinc-800/40 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-primary-foreground">
                        <Music className="h-4 w-4 text-primary/80" />
                        <div className="text-xs font-medium">MIDI</div>
                      </div>
                      <Badge variant="outline" className="bg-gradient-to-r from-[#6D28D9]/20 to-[#2563EB]/20 border-zinc-800/40">
                        {formatStats.midi}/{samples.length}
                      </Badge>
                    </div>
                    <Progress 
                      value={(formatStats.midi / samples.length) * 100} 
                      className="h-1.5 bg-zinc-800/40 group-hover:bg-zinc-800/60 transition-colors" 
                      indicatorClassName="bg-gradient-to-r from-[#6D28D9] to-[#2563EB]"
                    />
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <SampleList
                  packId={packId}
                  samples={samples}
                  onRemoveAction={handleRemoveSample}
                  onUpdateAction={handleUpdateSample}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border/50 rounded-lg bg-card/30">
                <div className="flex flex-col items-center max-w-md mx-auto">
                  <Music2 className="h-10 w-10 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No samples yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Upload your first samples to get started with your pack
                  </p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Samples
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="pt-4">
            <div className="space-y-4">
              <Alert className="bg-primary/5 border-primary/10">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Upload up to {remaining} more samples. Supported formats: WAV, MP3, AIFF.
                </AlertDescription>
              </Alert>
            
              <SampleUploader
                onUploadCompleteAction={handleUploadComplete}
                isUploading={isUploading}
                maxFiles={100 - samples.length}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
} 