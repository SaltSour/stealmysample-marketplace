import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { FileType } from "@/lib/services/file-storage"
import { UploadService } from "@/lib/services/upload-service"
import { ServerAudioProcessor } from "@/lib/services/server-audio-processor"
import { apiErrors } from "@/lib/utils/api-error"
import { prisma } from "@/lib/prisma"

// Route Segment Config
export const runtime = 'nodejs'

const uploadService = new UploadService()
const audioProcessor = new ServerAudioProcessor()

// Add ARCHIVE to the file type mapping
function getFileType(mimeType: string, fileName: string): FileType {
  // Check by file extension first for more reliability
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (extension === 'zip' || extension === 'rar' || extension === '7z') {
    return FileType.ARCHIVE;
  }
  
  // Then check by MIME type
  if (mimeType.startsWith('image/')) {
    return FileType.IMAGE
  }
  
  if (mimeType === 'audio/wav' || mimeType === 'audio/wave' || mimeType === 'audio/x-wav') {
    return FileType.AUDIO
  }
  
  if (mimeType === 'application/zip' || 
      mimeType === 'application/x-rar-compressed' || 
      mimeType === 'application/x-7z-compressed' ||
      mimeType === 'application/octet-stream') {
    return FileType.ARCHIVE
  }
  
  // Default to the specified type or throw an error
  throw new Error(`Unsupported file type: ${mimeType}`)
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return apiErrors.unauthorized("You must be logged in to upload files")
    }

    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get("file") as File
    const requestedType = formData.get("type") as string
    const sampleId = formData.get("sampleId") as string
    
    if (!file) {
      return apiErrors.validationError({ file: ["No file provided"] })
    }

    // Validate file type
    if (!file.type && !file.name) {
      return apiErrors.validationError({ file: ["Invalid file format"] })
    }

    // Determine file type using our helper function
    let fileType: FileType;
    try {
      fileType = getFileType(file.type, file.name);
    } catch (error) {
      // If the helper fails, try to use the requested type as fallback
      if (requestedType && Object.values(FileType).includes(requestedType as FileType)) {
        fileType = requestedType as FileType;
      } else {
        return apiErrors.validationError({ 
          file: ["Could not determine file type. Please specify a valid type."] 
        });
      }
    }

    // Convert the file to a buffer for server-side processing
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // If this is an audio file for a specific sample
    if (fileType === FileType.AUDIO && sampleId) {
      // First upload the original file to S3
      const uploadedFile = await uploadService.uploadFile({
        file,
        type: fileType,
        sampleId
      });
      
      // Process the audio file on the server
      try {
        // Process audio (extract metadata, generate waveform, create preview)
        const processedAudio = await audioProcessor.processAudio(
          fileBuffer,
          file.name,
          sampleId
        );
        
        // Update the sample in the database with the processed metadata
        const updatedSample = await prisma.sample.update({
          where: { id: sampleId },
          data: {
            fileUrl: uploadedFile.url,
            waveformUrl: `waveforms/${sampleId}.svg`,
            waveformData: JSON.stringify(processedAudio.waveform.points),
            duration: processedAudio.metadata.duration,
            sampleRate: processedAudio.metadata.sampleRate,
            bitDepth: processedAudio.metadata.bitDepth,
            channels: processedAudio.metadata.channels,
            format: processedAudio.metadata.format,
            lufs: processedAudio.metadata.lufs,
            truePeak: processedAudio.metadata.truePeak,
            peakAmplitude: processedAudio.metadata.peakAmplitude,
            isProcessed: true,
          },
        });
        
        return NextResponse.json({
          url: uploadedFile.url,
          waveformUrl: `waveforms/${sampleId}.svg`,
          path: uploadedFile.path,
          originalName: file.name,
          size: file.size,
          type: fileType,
          mimeType: file.type,
          storageType: uploadedFile.storageType,
          sampleId: sampleId,
          metadata: processedAudio.metadata,
        });
      } catch (processingError) {
        console.error("Error processing audio file:", processingError);
        
        // Still return the uploaded file info, but with a processing error flag
        return NextResponse.json({
          url: uploadedFile.url,
          path: uploadedFile.path,
          originalName: file.name,
          size: file.size,
          type: fileType,
          mimeType: file.type,
          storageType: uploadedFile.storageType,
          sampleId: sampleId,
          processingError: true,
        });
      }
    } else {
      // Regular file upload
      const uploadedFile = await uploadService.uploadFile({
        file,
        type: fileType
      });
      
      // Return success with file details
      return NextResponse.json({
        url: uploadedFile.url,
        path: uploadedFile.path,
        originalName: file.name,
        size: file.size,
        type: fileType,
        mimeType: file.type,
        storageType: uploadedFile.storageType,
      });
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return apiErrors.internal(
      error instanceof Error ? error : new Error("Failed to upload file")
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return apiErrors.unauthorized("You must be logged in to delete files")
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")
    const storageType = searchParams.get("storageType") as 's3' | 'local' | null

    if (!url) {
      return apiErrors.validationError({ url: ["No file URL provided"] })
    }

    await uploadService.deleteFile(url, storageType || undefined)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return apiErrors.internal(
      error instanceof Error ? error : new Error("Failed to delete file")
    )
  }
} 