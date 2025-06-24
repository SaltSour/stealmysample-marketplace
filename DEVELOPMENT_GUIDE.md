# StealMySample Development Guide

## Project Overview
StealMySample is a platform for creators to upload, sell, and distribute sample packs, similar to Splice.com and WAVS.com. The platform uses Next.js, Prisma with PostgreSQL, and local file storage for development.

## Current Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Storage**: Local file system (development)
- **UI**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context + Hooks
- **Development Environment**: Windows

## Core Features Status

### Implemented ✅
- User authentication (login/register)
- Creator profiles
- Sample pack creation with cover image upload
- File upload system with local storage
- Audio processing pipeline with FFmpeg
- Batch sample processing
- Sample metadata extraction
- Waveform generation
- BPM detection
- Dashboard layout
- Navigation structure

### In Progress 🚧
- Advanced audio analysis
- Collaborative features
- Advanced search functionality
- User collections
- Analytics dashboard

### Upload Workflow
1. **Pack Creation (Upload Dialog)**
   - Step 1: Pack Details
     - Title (required, 3-100 chars)
     - Description (required, 10-1000 chars)
     - Automatic slug generation
   - Step 2: Cover Image
     - Image upload (required, max 5MB)
     - Supported formats: JPG, PNG, WebP
   - Step 3: Sample Management
     - Batch upload support (up to 100 samples)
     - Drag and drop interface
     - Progress tracking
     - Automatic metadata extraction

2. **Sample Processing Pipeline**
   - File Validation
     - Format: WAV, MP3, AIFF
     - Size limit: 50MB per file
   - Metadata Extraction
     - Format details
     - Sample rate
     - Bit depth
     - Channel count
     - Peak amplitude
   - Audio Analysis
     - BPM detection
     - Key detection (planned)
     - Waveform generation
   - Batch Processing
     - Concurrent processing (3 files at a time)
     - Automatic retry on failure
     - Progress tracking
     - Error handling

3. **Pack States**
   - Draft: Initial state
   - Published: Available in marketplace
   - Archived: Hidden from marketplace
   - State transitions:
     - Draft → Published (requires validation)
     - Published → Draft (unpublish)
     - Published → Archived (permanent)

4. **Validation Rules**
   - Pack Requirements:
     - Title: 1-100 characters
     - Description: 1-1000 characters
     - Genre: Must be selected
     - Cover image: Required, max 5MB
     - At least one sample
   - Sample Requirements:
     - Title: 1-100 characters
     - Valid audio file
     - Price settings if enabled
     - BPM if detected
     - Key if applicable

### Testing Strategy
1. **Unit Tests**
   - Validation functions
   - State transitions
   - File processing

2. **Integration Tests**
   - Upload workflow
   - Pack management
   - Sample processing

3. **E2E Tests**
   - Complete pack creation
   - Publishing flow
   - Sample management

## Development Rules

### 1. Code Organization
- Keep files small and focused (max 300 lines)
- Use feature-based folder structure
- Maintain clear separation of concerns
- Follow the established naming conventions

### 2. Component Structure
```typescript
// Template for new components
import { useState, useEffect } from "react"
import type { ComponentProps } from "./types"

interface Props {
  // Clear prop definitions
}

export function ComponentName({ prop1, prop2 }: Props) {
  // State management at the top
  const [state, setState] = useState()
  
  // Effects after state
  useEffect(() => {
    // Clear cleanup
    return () => cleanup()
  }, [dependencies])

  // Helper functions
  const handleAction = () => {
    // Implementation
  }

  // JSX with clear structure
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

### 3. File Structure
```
app/
├── (auth)/           # Authentication routes
├── (marketplace)/    # Public marketplace routes
├── dashboard/        # Dashboard routes
├── api/             # API routes
components/
├── audio/           # Audio-related components
├── creator/         # Creator-specific components
├── ui/             # Reusable UI components
├── upload/         # Upload-related components
lib/
├── utils/          # Utility functions
├── validators/     # Input validation
├── services/       # Business logic
├── constants/      # App constants
contexts/           # React contexts
hooks/              # Custom hooks
types/              # TypeScript types
```

### 4. API Structure
- Use RESTful conventions
- Implement proper error handling
- Validate inputs with Zod
- Return consistent response formats

### 5. Database Rules
- Always use transactions for related operations
- Implement soft deletes where appropriate
- Use appropriate indexes
- Keep relations clean and necessary

## Priority Features Roadmap

### Phase 1: Core Features Enhancement
1. Complete sample pack management
   - Robust upload dialog
   - Sample batch processing
   - Pack state management
   - Validation system
2. Implement audio preview system
3. Add batch upload functionality
4. Improve creator dashboard

### Phase 2: User Experience
1. Advanced search system
2. User collections
3. Download management
4. Favorites system

### Phase 3: Creator Tools
1. Analytics dashboard
2. Pack templates
3. Collaboration tools
4. Marketing features

## Error Handling
- Implement proper error boundaries
- Log errors appropriately
- Show user-friendly error messages
- Handle edge cases

Remember: Focus on core functionality first, then enhance user experience, and finally add advanced features.

## Data Fetching & Database Patterns

### API Routes Structure
```typescript
// Standard API route pattern
export async function GET/POST/PUT/DELETE(
  req: Request,
  { params }: { params: { [key: string]: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    // 2. Input validation
    // - Parse and validate params
    // - Parse and validate body if POST/PUT
    // - Return 400 for invalid inputs

    // 3. Database operation with Prisma
    const result = await prisma.model.operation({
      // Include related data
      include: {
        relation: {
          select: {
            // Select specific fields
          }
        }
      }
    })

    // 4. Transform response if needed
    const transformedData = {
      ...result,
      // Add computed fields
    }

    // 5. Return response
    return NextResponse.json(transformedData)
  } catch (error) {
    // 6. Error handling
    console.error("Error:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    )
  }
}
```

### Client-Side Fetching Pattern
```typescript
// React component fetch pattern
const [data, setData] = useState<DataType>()
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/endpoint")
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Failed to fetch data")
      }

      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  fetchData()
}, [dependencies])
```

### Database Operations
1. **Always use transactions** for related operations:
```typescript
await prisma.$transaction(async (tx) => {
  // Multiple database operations
})
```

2. **Include related data efficiently**:
```typescript
const data = await prisma.model.findUnique({
  include: {
    // Only include needed relations
    relation: {
      select: {
        // Only select needed fields
      }
    }
  }
})
```

3. **Handle numeric IDs**:
```typescript
const id = parseInt(params.id)
if (isNaN(id)) {
  return new NextResponse("Invalid ID", { status: 400 })
}
```

### Error Handling
1. **API Routes**:
   - Log errors with context
   - Return appropriate status codes
   - Return meaningful error messages

2. **Client-Side**:
   - Show loading states
   - Handle network errors
   - Show user-friendly error messages
   - Implement retry logic for transient failures

### Data Validation
1. **API Routes**:
   - Validate all inputs
   - Use TypeScript types
   - Return 400 for invalid inputs

2. **Client-Side**:
   - Validate form inputs
   - Show validation errors
   - Prevent invalid submissions

Remember: Focus on core functionality first, then enhance user experience, and finally add advanced features. Correct linters, and dont hesitate to read the codebase to understand the overall structure aswell as the prisma schema ( you can modify it ) and update this file after changes are made.

## Technical Implementation

### Upload Architecture
1. **File Upload Hook (`useFileUpload`)**
   ```typescript
   const { upload, isUploading } = useFileUpload(FileType.AUDIO, {
     maxSize: 50 * 1024 * 1024,
     onSuccess: (result) => { /* Handle success */ },
     onError: (error) => { /* Handle error */ }
   })
   ```

2. **Batch Processing Service**
   - Concurrent file processing (3 files at a time)
   - Automatic cleanup on failure
   - Progress tracking and error handling
   ```typescript
   const batchProcessor = new BatchProcessor({
     uploadFile: (file) => storage.upload(file),
     deleteFile: (url) => storage.delete(url)
   })
   ```

3. **Audio Processing Service**
   - FFmpeg integration for audio analysis
   - Metadata extraction
   - Waveform generation
   - BPM detection
   ```typescript
   const audioProcessor = new AudioProcessor()
   const metadata = await audioProcessor.extractMetadata(file)
   const waveform = await audioProcessor.generateWaveform(file)
   const bpm = await audioProcessor.detectBPM(file)
   ```

4. **File Storage Service**
   - Local file system storage (development)
   - File type validation
   - Size limits enforcement
   - Automatic directory management
   ```typescript
   const storage = new FileStorageService()
   const result = await storage.saveFile(buffer, metadata)
   ```

### Component Structure
1. **Upload Dialog**
   - Pack creation form
   - Cover image upload
   - Validation and error handling

2. **Sample Manager**
   - Sample list management
   - Batch upload handling
   - Sample metadata editing

3. **Sample List**
   - Drag and drop reordering
   - Individual sample management
   - Metadata display

### API Routes
1. **Pack Creation (`/api/packs`)**
   - Authentication check
   - Creator status validation
   - Cover image processing
   - Slug generation
   - Database creation

2. **Sample Upload (`/api/upload`)**
   - File validation
   - Storage handling
   - Metadata extraction
   - Error handling

Remember: Focus on core functionality first, then enhance user experience, and finally add advanced features. 