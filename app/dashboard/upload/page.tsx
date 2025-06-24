"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { FileUploader } from "@/components/upload/file-uploader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Upload,
  Package,
  Music2,
  Info,
  AlertCircle,
  CheckCircle2,
  Clock,
  Music,
  ImageIcon,
} from "lucide-react"

interface UploadStatus {
  id: string
  name: string
  progress: number
  status: "uploading" | "processing" | "complete" | "error"
  errorMessage?: string
  fileType: "audio" | "image"
  url?: string
}

export default function UploadDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("samples")
  const [uploads, setUploads] = useState<UploadStatus[]>([])

  // Handle file upload
  const handleUpload = async (files: any) => {
    const newUploads = Array.isArray(files) ? files : [files]
    
    newUploads.forEach(file => {
      const uploadId = Math.random().toString(36).substring(7)
      setUploads(prev => [...prev, {
        id: uploadId,
        name: file.name,
        progress: 0,
        status: "uploading",
        fileType: file.type.startsWith("audio/") ? "audio" : "image",
      }])

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId && upload.status === "uploading") {
            const newProgress = upload.progress + 10
            if (newProgress >= 100) {
              clearInterval(interval)
              return { ...upload, progress: 100, status: "processing" }
            }
            return { ...upload, progress: newProgress }
          }
          return upload
        }))
      }, 500)

      // Process the file
      setTimeout(() => {
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId) {
            return {
              ...upload,
              status: "complete",
              url: file.url,
            }
          }
          return upload
        }))
      }, 6000)
    })
  }

  // Remove upload from list
  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id))
  }

  // Get upload stats
  const stats = {
    total: uploads.length,
    completed: uploads.filter(u => u.status === "complete").length,
    processing: uploads.filter(u => u.status === "processing").length,
    error: uploads.filter(u => u.status === "error").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Upload Center</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage your samples and sample packs
        </p>
      </div>

      {/* Upload Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Uploads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{stats.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="dashboard-tabs-list mb-4">
              <TabsTrigger value="samples" className="dashboard-tab flex items-center gap-2">
                <Music2 className="h-4 w-4" />
                Upload Samples
              </TabsTrigger>
              <TabsTrigger value="packs" className="dashboard-tab flex items-center gap-2">
                <Package className="h-4 w-4" />
                Create Pack
              </TabsTrigger>
            </TabsList>

            <TabsContent value="samples">
              <div className="space-y-6">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-muted rounded-lg p-6">
                  <FileUploader
                    type="audio"
                    accept="audio/*"
                    multiple={true}
                    maxSize={50 * 1024 * 1024} // 50MB
                    onUploadAction={handleUpload}
                  />
                </div>

                {/* Upload List */}
                {uploads.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Progress</CardTitle>
                    </CardHeader>
                    <ScrollArea className="h-[300px]">
                      <div className="p-4 space-y-4">
                        {uploads.map((upload) => (
                          <div
                            key={upload.id}
                            className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                          >
                            <div className="p-2 bg-background rounded">
                              {upload.fileType === "audio" ? (
                                <Music className="h-4 w-4" />
                              ) : (
                                <ImageIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium truncate">
                                  {upload.name}
                                </p>
                                <Badge
                                  variant={
                                    upload.status === "complete"
                                      ? "default"
                                      : upload.status === "error"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {upload.status}
                                </Badge>
                              </div>
                              {upload.status === "uploading" && (
                                <Progress value={upload.progress} className="h-1" />
                              )}
                              {upload.errorMessage && (
                                <p className="text-xs text-destructive mt-1">
                                  {upload.errorMessage}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUpload(upload.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                )}

                {/* Upload Tips */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-2">Upload Tips</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Maximum file size: 50MB per sample</li>
                          <li>• Supported formats: WAV, MP3, AIFF</li>
                          <li>• Higher quality files (WAV) are recommended</li>
                          <li>• Name your files descriptively for better organization</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="packs">
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Create a New Pack</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating a new sample pack to organize your samples
                </p>
                <Button onClick={() => router.push("/dashboard/packs/new")} className="dashboard-cta-primary">
                  <Package className="h-4 w-4 mr-2" />
                  Create New Pack
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 