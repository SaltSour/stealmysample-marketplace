import path from "path"
import { z } from "zod"
import fs from "fs"

// Add UUID generation function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// File type enum
export enum FileType {
  IMAGE = 'image',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  DOCUMENT = 'document',
  MIDI = 'midi'
}

// Supported file types and their configurations
export const FileTypes: Record<FileType, {
  extensions: string[]
  maxSize: number
  directory: string
  allowedMimeTypes?: string[]
}> = {
  [FileType.IMAGE]: {
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxSize: 50 * 1024 * 1024, // 50MB
    directory: "images",
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  [FileType.AUDIO]: {
    extensions: [".wav"],  // Only allow WAV files
    maxSize: 100 * 1024 * 1024, // 100MB
    directory: "audio",
    allowedMimeTypes: ['audio/wav', 'audio/wave', 'audio/x-wav']
  },
  [FileType.ARCHIVE]: {
    extensions: [".zip", ".rar", ".7z"],
    maxSize: 200 * 1024 * 1024, // 200MB
    directory: "archives",
    allowedMimeTypes: [
      'application/zip', 
      'application/x-zip-compressed',
      'application/x-rar-compressed', 
      'application/x-7z-compressed',
      'application/octet-stream'
    ]
  },
  [FileType.DOCUMENT]: {
    extensions: [".pdf", ".doc", ".docx", ".txt"],
    maxSize: 10 * 1024 * 1024, // 10MB
    directory: "documents",
    allowedMimeTypes: [
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  },
  [FileType.MIDI]: {
    extensions: [".mid", ".midi"],
    maxSize: 1 * 1024 * 1024, // 1MB
    directory: "midi",
    allowedMimeTypes: [
      'audio/midi', 
      'audio/mid',
      'audio/x-midi',
      'application/x-midi',
      'application/octet-stream'
    ]
  }
}

export interface FileMetadata {
  type: FileType
  originalName: string
  size: number
  mimeType: string
}

export const FileMetadataSchema = z.object({
  type: z.nativeEnum(FileType),
  originalName: z.string(),
  size: z.number().positive(),
  mimeType: z.string()
})

interface SavedFile {
  url: string
  path: string
  metadata: FileMetadata
}

export interface UploadOptions {
  maxSize?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  allowedTypes?: string[];
}

export class FileStorageService {
  private baseUrl: string
  private uploadDir: string

  constructor() {
    // Use absolute paths and normalize for Windows
    this.baseUrl = "/uploads"
    this.uploadDir = path.resolve(process.cwd(), "public", "uploads")
    // Initialize directories synchronously to ensure they exist before any operations
    this.initializeDirectoriesSync()
  }

  /**
   * Initialize required directories synchronously
   */
  private initializeDirectoriesSync() {
    try {
      // Ensure base upload directory exists
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true })
      }
      
      // Ensure type-specific directories exist
      Object.values(FileTypes).forEach(config => {
        const dir = path.join(this.uploadDir, config.directory)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
      })
    } catch (error) {
      console.error("Error initializing directories:", error)
      console.error("Upload directory path:", this.uploadDir)
    }
  }

  /**
   * Ensures a directory exists, creating it if necessary
   */
  private ensureDirSync(dir: string): void {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error)
      throw error
    }
  }

  /**
   * Validates a file against type-specific constraints
   */
  async validateFile(metadata: FileMetadata): Promise<void> {
    const fileConfig = FileTypes[metadata.type]
    
    // Validate file size
    if (metadata.size > fileConfig.maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${fileConfig.maxSize / 1024 / 1024}MB`)
    }

    // Validate file extension
    const extension = path.extname(metadata.originalName).toLowerCase()
    if (!fileConfig.extensions.includes(extension)) {
      throw new Error(`File extension ${extension} is not allowed. Supported extensions: ${fileConfig.extensions.join(", ")}`)
    }

    // Validate MIME type if allowedMimeTypes is specified
    if (fileConfig.allowedMimeTypes && !fileConfig.allowedMimeTypes.includes(metadata.mimeType)) {
      throw new Error(`MIME type ${metadata.mimeType} is not allowed for ${metadata.type} files`)
    }
  }

  /**
   * Generates a unique filename while preserving the original extension
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName)
    const uuid = generateUUID()
    return `${uuid}${ext}`
  }

  /**
   * Saves a file to the appropriate directory
   */
  async saveFile(buffer: Buffer, metadata: FileMetadata): Promise<SavedFile> {
    try {
      // Validate the file
      await this.validateFile(metadata)

      const filename = this.generateFilename(metadata.originalName)
      const subdir = FileTypes[metadata.type].directory
      const relativePath = path.join(subdir, filename).replace(/\\/g, '/')
      const fullPath = path.resolve(this.uploadDir, subdir, filename)

      // Double-check directory exists
      this.ensureDirSync(path.dirname(fullPath))

      // Write file synchronously
      fs.writeFileSync(fullPath, buffer)

      // Verify file was written successfully
      const stats = fs.statSync(fullPath)
      if (!stats.isFile() || stats.size === 0) {
        throw new Error("File was not written successfully")
      }

      // Ensure URL uses forward slashes and starts with /uploads
      const url = `/uploads/${relativePath}`.replace(/\\/g, '/')

      return {
        url,
        path: relativePath,
        metadata
      }
    } catch (error) {
      console.error("Error saving file:", error)
      throw new Error(
        error instanceof Error 
          ? `Failed to save file: ${error.message}`
          : "Failed to save file"
      )
    }
  }

  /**
   * Deletes a file from storage
   */
  async deleteFile(url: string): Promise<void> {
    try {
      const relativePath = url.replace(this.baseUrl, "").replace(/^\/+/, "")
      const fullPath = path.join(this.uploadDir, relativePath)
      fs.unlinkSync(fullPath)
    } catch (error) {
      console.error("Error deleting file:", error)
      throw new Error(error instanceof Error ? error.message : "Failed to delete file")
    }
  }

  /**
   * Moves a file to a new location within storage
   */
  async moveFile(
    sourceUrl: string,
    metadata: FileMetadata
  ): Promise<{ filename: string; url: string }> {
    // Extract source filepath
    const urlParts = sourceUrl.split("/")
    const sourceFilename = urlParts[urlParts.length - 1]
    const sourceDirectory = urlParts[urlParts.length - 2]
    const sourceFilepath = path.join(this.uploadDir, sourceDirectory, sourceFilename)

    // Generate new filename and ensure directory exists
    const newFilename = this.generateFilename(metadata.originalName)
    const targetDirectory = path.join(this.uploadDir, FileTypes[metadata.type].directory)
    this.ensureDirSync(targetDirectory)

    // Move the file
    const targetFilepath = path.join(targetDirectory, newFilename)
    const fileContent = fs.readFileSync(sourceFilepath)
    fs.writeFileSync(targetFilepath, fileContent)

    // Generate new URL
    const url = `/uploads/${FileTypes[metadata.type].directory}/${newFilename}`

    return { filename: newFilename, url }
  }

  private getExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    return ext || ""
  }
} 