# Advanced Sample Management System

This document explains the enhanced sample management system implemented in the app.

> **IMPORTANT**: This system requires FFmpeg to be installed on your server for audio processing.
> Follow the installation instructions in the Setup section below.
> Without FFmpeg, audio duration and waveform generation will not work correctly.

## Key Features

1. **Server-side Audio Processing**
   - FFmpeg-based metadata extraction for accurate duration, sample rate, bit depth
   - Automatic waveform generation
   - Preview MP3 creation for each sample

2. **Improved Storage Architecture**
   - Audio files stored in S3 with presigned URLs for secure access
   - Metadata stored in Prisma database
   - Preview files automatically generated

3. **Enhanced Sample Model**
   - Tag support for better organization
   - Added more audio metadata fields (LUFS, true peak, etc)
   - Download analytics tracking

4. **Creator Dashboard**
   - Sample management UI for creators
   - Upload, edit, and delete capabilities
   - Search and filtering functionality

5. **Streaming and Downloading**
   - Secure access control for premium content
   - Analytics tracking for downloads
   - Short-lived presigned URLs for security

## Technical Architecture

### 1. Audio Processing Flow

```
[Client Upload] → [S3 Storage] → [Server-side Processing] → [Metadata in DB]
                                   │
                                   ├─ [Waveform Generation]
                                   ├─ [Preview Creation]
                                   └─ [Metadata Extraction]
```

### 2. Playback Flow

```
[Client Request] → [API Check Access] → [Generate Presigned URL] → [Stream Audio]
                                         │
                                         └─ [Log Analytics]
```

### 3. Database Schema

The system uses the following models:
- `Sample` - The core sample entity with metadata
- `Tag` - For categorizing samples
- `SampleDownload` - For tracking sample usage

## Setup Requirements

1. **S3 Configuration**
   - Set up an S3 bucket or compatible storage service
   - Configure the following environment variables:
     ```
     S3_REGION=your-region
     S3_ACCESS_KEY=your-access-key
     S3_SECRET_KEY=your-secret-key
     S3_BUCKET_NAME=your-bucket-name
     ```

2. **FFmpeg Installation**
   - Install FFmpeg on your server for audio processing
   - Ensure it's available in the system PATH
   - Test with `ffmpeg -version`

3. **Database Migration**
   - Run the following to update your database schema:
     ```
     npx prisma migrate dev
     npx prisma generate
     ```

## Usage Instructions

### For Developers

1. **Processing a Sample**
   ```typescript
   import { ServerAudioProcessor } from '@/lib/services/server-audio-processor';

   // Create a processor instance
   const processor = new ServerAudioProcessor();
   
   // Process the audio file
   const result = await processor.processAudio(fileBuffer, filename, sampleId);
   
   // Update the database with the metadata
   await prisma.sample.update({
     where: { id: sampleId },
     data: {
       duration: result.metadata.duration,
       // ... other metadata fields
     }
   });
   ```

2. **Generating a Streaming URL**
   ```typescript
   import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
   import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
   
   const s3Client = new S3Client({ /* config */ });
   
   const command = new GetObjectCommand({
     Bucket: BUCKET_NAME,
     Key: s3Key,
   });
   
   const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
   ```

### For Administrators

1. **Fixing Missing Durations**
   - Run the utility script: `npm run fix-durations`
   - This will update missing or incorrect durations

2. **Adding Tags**
   - Tags can be added through the API or manually in the database
   - They will be automatically connected to samples when specified

## Troubleshooting

- **Duration Issues**: If durations are still showing as 0:00, ensure the FFmpeg processing completed successfully
- **Playback Problems**: Check S3 permissions and CORS configuration
- **Upload Failures**: Verify proper write permissions to the S3 bucket

## Future Enhancements

1. Batch upload support for multiple samples
2. AI-based tag suggestions
3. Automatic BPM and key detection
4. Integration with DAW plugins for direct access 