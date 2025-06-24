'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import S3SampleUpload from '@/components/audio/s3-sample-upload';
import SecurePlayer from '@/components/audio/secure-player';
import { v4 as uuidv4 } from 'uuid';

interface S3DemoProps {
  userId: string;
}

export default function S3Demo({ userId }: S3DemoProps) {
  // Use a constant initial value and update with UUID only on client side
  const [sampleId, setSampleId] = useState("temp-sample-id");
  const [uploadComplete, setUploadComplete] = useState(false);
  
  // Generate UUID only on the client side to avoid hydration mismatch
  useEffect(() => {
    setSampleId(uuidv4());
  }, []);
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="player">Secure Player</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Audio to S3</CardTitle>
              <CardDescription>
                Upload WAV files securely to S3 with automatic preview generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <S3SampleUpload 
                sampleId={sampleId} 
                onUploadComplete={() => setUploadComplete(true)}
              />
            </CardContent>
            <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
              <p>Sample ID: {sampleId}</p>
              <p>This sample ID would typically be linked to a product in your database.</p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="player" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Secure Audio Player</CardTitle>
              <CardDescription>
                Play audio without exposing the source URL using blob URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadComplete ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Preview Quality (128kbps)</h3>
                    <SecurePlayer
                      sampleId={sampleId}
                      isPreview={true}
                      showWaveform={true}
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Lower quality preview for browsing - accessible to all users
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Full Quality (After Purchase)</h3>
                    <SecurePlayer
                      sampleId={sampleId}
                      isPreview={false}
                      format="WAV"
                      showWaveform={true}
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Full quality - only accessible to users who have purchased
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Upload a sample first to see the secure player in action
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="download" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Secure Downloads</CardTitle>
              <CardDescription>
                Generate time-limited signed URLs for secure downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadComplete ? (
                <div className="space-y-4">
                  <p>
                    Clicking the button below will generate a time-limited signed URL
                    that expires after 2 minutes. 
                  </p>
                  <p>
                    In a real app, this would only work if the user has purchased the sample.
                  </p>
                  <Button 
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/download/sample/${sampleId}?format=WAV`);
                        const data = await res.json();
                        
                        if (res.ok) {
                          window.location.href = data.url;
                        } else {
                          alert(data.error || 'Failed to generate download link');
                        }
                      } catch (error) {
                        alert('Error generating download link');
                      }
                    }}
                  >
                    Download Sample
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Upload a sample first to test the secure download
                </div>
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <p>Signed URL cannot be shared or reused after expiration</p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>1. Secure Storage:</strong> Audio files are stored in a private S3 bucket</p>
          <p><strong>2. Preview Generation:</strong> Lower quality preview files are created automatically</p>
          <p><strong>3. Secure Streaming:</strong> Audio is streamed through a secure API without exposing URLs</p>
          <p><strong>4. Blob URLs:</strong> Client-side uses blob URLs to hide the actual source from DevTools</p>
          <p><strong>5. Purchase Verification:</strong> Server validates ownership before allowing downloads</p>
          <p><strong>6. Time-limited Downloads:</strong> Download links expire after 2 minutes</p>
        </CardContent>
      </Card>
    </div>
  );
} 