"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sample } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Music, Edit, Trash2, Upload, Clock, BarChart, Play, Download, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils";
import { TagSelector } from "@/components/upload/tag-selector";

// Types for the component props
interface SamplesDashboardProps {
  userId: string;
  creatorId: string;
  samplePacks: Array<{
    id: number;
    title: string;
  }>;
  availableTags: Array<{
    id: string;
    name: string;
  }>;
}

// Sample with additional fields for UI
interface ExtendedSample extends Omit<Sample, 'tags'> {
  tags: Array<{
    id: string;
    name: string;
  }>;
  samplePack: {
    id: number;
    title: string;
  };
  isPlaying?: boolean;
  isLoading?: boolean;
}

export function SamplesDashboard({ userId, creatorId, samplePacks, availableTags }: SamplesDashboardProps) {
  const router = useRouter();
  const [samples, setSamples] = useState<ExtendedSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPack, setSelectedPack] = useState<number | "all">("all");
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [currentSample, setCurrentSample] = useState<ExtendedSample | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  
  // Form state for creating new sample
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    samplePackId: samplePacks.length > 0 ? samplePacks[0].id : 0,
    bpm: "",
    key: "",
    genre: "",
    selectedTags: [] as string[],
    newTags: [] as string[],
    file: null as File | null,
    isUploading: false,
  });
  
  // Load the samples when the component mounts
  useEffect(() => {
    fetchSamples();
  }, []);
  
  // Stop audio playback when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
    };
  }, [currentAudio]);
  
  // Filter samples based on search query and selected pack
  const filteredSamples = samples.filter(sample => {
    const matchesQuery = 
      searchQuery === "" || 
      sample.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPack = selectedPack === "all" || sample.samplePackId === selectedPack;
    
    return matchesQuery && matchesPack;
  });
  
  // Fetch samples from the API
  const fetchSamples = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/samples");
      if (!response.ok) throw new Error("Failed to fetch samples");
      
      const data = await response.json();
      setSamples(data);
    } catch (error) {
      console.error("Error fetching samples:", error);
      toast.error("Failed to load samples");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission for creating a new sample
  const handleCreateSample = async () => {
    try {
      if (!formState.title) {
        toast.error("Please enter a title");
        return;
      }
      
      if (!formState.samplePackId) {
        toast.error("Please select a sample pack");
        return;
      }
      
      // First create the sample in the database
      const response = await fetch("/api/samples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formState.title,
          description: formState.description,
          samplePackId: formState.samplePackId,
          bpm: formState.bpm ? parseInt(formState.bpm) : undefined,
          key: formState.key,
          genre: formState.genre,
          tagIds: formState.selectedTags,
          tagNames: formState.newTags,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create sample");
      }
      
      const sample = await response.json();
      
      // If file exists, upload it
      if (formState.file) {
        await uploadSampleFile(sample.id, formState.file);
      }
      
      // Reset form and fetch updated samples
      setFormState({
        title: "",
        description: "",
        samplePackId: samplePacks.length > 0 ? samplePacks[0].id : 0,
        bpm: "",
        key: "",
        genre: "",
        selectedTags: [],
        newTags: [],
        file: null,
        isUploading: false,
      });
      
      // Close dialog and refresh samples
      setOpenCreateDialog(false);
      fetchSamples();
      
      toast.success("Sample created successfully");
    } catch (error) {
      console.error("Error creating sample:", error);
      toast.error("Failed to create sample");
    }
  };
  
  // Handle file upload for a sample
  const uploadSampleFile = async (sampleId: string, file: File) => {
    try {
      // Set uploading state
      setFormState(prev => ({ ...prev, isUploading: true }));
      
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "audio");
      formData.append("sampleId", sampleId);
      
      // Upload the file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      throw error;
    } finally {
      setFormState(prev => ({ ...prev, isUploading: false }));
    }
  };
  
  // Handle file selection for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.includes("audio")) {
        toast.error("Please select an audio file");
        return;
      }
      
      setFormState(prev => ({ ...prev, file: selectedFile }));
    }
  };
  
  // Handle sample deletion
  const handleDeleteSample = async (sampleId: string) => {
    if (!confirm("Are you sure you want to delete this sample? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/samples?id=${sampleId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete sample");
      }
      
      // Remove the sample from state
      setSamples(prev => prev.filter(sample => sample.id !== sampleId));
      toast.success("Sample deleted successfully");
    } catch (error) {
      console.error("Error deleting sample:", error);
      toast.error("Failed to delete sample");
    }
  };
  
  // Handle sample playback
  const handlePlaySample = async (sample: ExtendedSample) => {
    try {
      // If already playing, pause it
      if (currentSample?.id === sample.id && currentSample.isPlaying) {
        if (currentAudio) {
          currentAudio.pause();
        }
        setSamples(prev => 
          prev.map(s => s.id === sample.id ? { ...s, isPlaying: false, isLoading: false } : s)
        );
        setCurrentSample({ ...sample, isPlaying: false, isLoading: false });
        return;
      }
      
      // Set loading state
      setSamples(prev => 
        prev.map(s => s.id === sample.id ? { ...s, isLoading: true } : s)
      );
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
      
      // Get the streaming URL
      const response = await fetch(`/api/audio/stream?sampleId=${sample.id}&format=preview`);
      if (!response.ok) {
        throw new Error("Failed to get audio stream");
      }
      
      const data = await response.json();
      
      // Create a new audio element
      const audio = new Audio(data.url);
      
      // Set up event listeners
      audio.addEventListener("playing", () => {
        setSamples(prev => 
          prev.map(s => s.id === sample.id 
            ? { ...s, isPlaying: true, isLoading: false } 
            : { ...s, isPlaying: false })
        );
        setCurrentSample({ ...sample, isPlaying: true, isLoading: false });
      });
      
      audio.addEventListener("ended", () => {
        setSamples(prev => 
          prev.map(s => s.id === sample.id ? { ...s, isPlaying: false, isLoading: false } : s)
        );
        setCurrentSample({ ...sample, isPlaying: false, isLoading: false });
      });
      
      audio.addEventListener("error", (e) => {
        console.error("Audio playback error:", e);
        setSamples(prev => 
          prev.map(s => s.id === sample.id ? { ...s, isPlaying: false, isLoading: false } : s)
        );
        setCurrentSample({ ...sample, isPlaying: false, isLoading: false });
        toast.error("Failed to play audio");
      });
      
      // Start playback
      audio.play().catch(error => {
        console.error("Playback failed:", error);
        setSamples(prev => 
          prev.map(s => s.id === sample.id ? { ...s, isPlaying: false, isLoading: false } : s)
        );
        toast.error("Playback failed. Try again later.");
      });
      
      // Save reference to current audio
      setCurrentAudio(audio);
      
    } catch (error) {
      console.error("Error playing sample:", error);
      setSamples(prev => 
        prev.map(s => s.id === sample.id ? { ...s, isPlaying: false, isLoading: false } : s)
      );
      toast.error("Failed to play sample");
    }
  };
  
  // Handle sample download
  const handleDownloadSample = async (sample: ExtendedSample) => {
    try {
      // Set loading state
      setSamples(prev => 
        prev.map(s => s.id === sample.id ? { ...s, isLoading: true } : s)
      );
      
      const response = await fetch(`/api/audio/stream?sampleId=${sample.id}&download=true&format=wav`);
      if (!response.ok) {
        throw new Error("Failed to get download link");
      }
      
      const data = await response.json();
      
      // Create a hidden link and click it to trigger download
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName || `${sample.title}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Reset loading state
      setSamples(prev => 
        prev.map(s => s.id === sample.id ? { ...s, isLoading: false } : s)
      );
      
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading sample:", error);
      setSamples(prev => 
        prev.map(s => s.id === sample.id ? { ...s, isLoading: false } : s)
      );
      toast.error("Failed to download sample");
    }
  };

  const handleOpenEditDialog = (sample: ExtendedSample) => {
    setCurrentSample(sample);
    setEditTags(sample.tags.map(t => t.name));
    setOpenEditDialog(true);
  };

  // Handle sample update
  const handleUpdateSample = async () => {
    if (!currentSample) return;

    try {
      const response = await fetch(`/api/packs/${currentSample.samplePackId}/samples/${currentSample.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: currentSample.title,
          bpm: currentSample.bpm,
          key: currentSample.key,
          tags: editTags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update sample");
      }

      // Update the sample in the local state
      setSamples(prev =>
        prev.map(s => (s.id === currentSample.id ? { ...s, ...currentSample, tags: editTags.map(name => ({ id: '', name })) } : s))
      );

      setOpenEditDialog(false);
      toast.success("Sample updated successfully");
    } catch (error) {
      console.error("Error updating sample:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update sample");
    }
  };

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 mr-4">
          <Input
            placeholder="Search samples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 mr-4">
          <Select value={selectedPack.toString()} onValueChange={(value) => setSelectedPack(value === "all" ? "all" : parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by sample pack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sample Packs</SelectItem>
              {samplePacks.map((pack) => (
                <SelectItem key={pack.id} value={pack.id.toString()}>
                  {pack.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setOpenCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Sample
        </Button>
      </div>
      
      {/* Samples list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredSamples.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Music className="h-16 w-16 mb-4 text-muted-foreground" />
          <h3 className="text-xl font-medium">No samples found</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedPack !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first sample"}
          </p>
          <Button className="mt-4" onClick={() => setOpenCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Sample
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSamples.map((sample) => (
            <Card key={sample.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold truncate">{sample.title}</h3>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlaySample(sample)}
                      disabled={sample.isLoading}
                    >
                      {sample.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : sample.isPlaying ? (
                        <PauseCircle className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadSample(sample)}
                      disabled={sample.isLoading}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {sample.description || "No description"}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {sample.duration ? formatDuration(sample.duration) : "0:00"}
                  </div>
                  <div className="flex items-center">
                    <BarChart className="h-3 w-3 mr-1" />
                    {sample.bpm ? `${sample.bpm} BPM` : "No BPM"}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {sample.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="bg-muted/50 px-6 py-3 justify-between text-sm">
                <div className="truncate">
                  Pack: {sample.samplePack.title}
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(sample)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSample(sample.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Sample Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Sample</DialogTitle>
            <DialogDescription>
              Add a new sample to your collection. Upload an audio file and add metadata.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formState.title}
                onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                placeholder="Sample title"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Describe your sample"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="samplePack">Sample Pack</Label>
                <Select 
                  value={formState.samplePackId.toString()} 
                  onValueChange={(value) => setFormState({ ...formState, samplePackId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sample pack" />
                  </SelectTrigger>
                  <SelectContent>
                    {samplePacks.map((pack) => (
                      <SelectItem key={pack.id} value={pack.id.toString()}>
                        {pack.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={formState.genre}
                  onChange={(e) => setFormState({ ...formState, genre: e.target.value })}
                  placeholder="e.g. Hip Hop, Lo-fi"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bpm">BPM</Label>
                <Input
                  id="bpm"
                  type="number"
                  value={formState.bpm}
                  onChange={(e) => setFormState({ ...formState, bpm: e.target.value })}
                  placeholder="e.g. 120"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={formState.key}
                  onChange={(e) => setFormState({ ...formState, key: e.target.value })}
                  placeholder="e.g. C Minor"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="file">Audio File</Label>
              <Input
                id="file"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
              />
              {formState.file && (
                <div className="text-sm text-muted-foreground">
                  Selected: {formState.file.name} ({(formState.file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSample} 
              disabled={formState.isUploading || !formState.title || !formState.samplePackId}
            >
              {formState.isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Create Sample"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Sample Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Sample</DialogTitle>
            <DialogDescription>
              Make changes to your sample here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={currentSample?.title || ""}
                onChange={(e) =>
                  setCurrentSample(prev => prev ? { ...prev, title: e.target.value } : null)
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bpm" className="text-right">
                BPM
              </Label>
              <Input
                id="bpm"
                type="number"
                value={currentSample?.bpm || ""}
                onChange={(e) =>
                  setCurrentSample(prev => prev ? { ...prev, bpm: parseInt(e.target.value) } : null)
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="key" className="text-right">
                Key
              </Label>
              <TagSelector
                type="key"
                selectedTags={currentSample?.key ? [currentSample.key] : []}
                onTagsChange={(keys) => {
                  setCurrentSample(prev => prev ? { ...prev, key: keys[0] || null } : null)
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tags
              </Label>
              <div className="col-span-3">
              <TagSelector
                type="genre"
                selectedTags={editTags}
                onTagsChange={setEditTags}
              />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateSample}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 