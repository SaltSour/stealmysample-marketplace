import fs from "fs"
import path from "path"
import crypto from "crypto"

// Define storage paths
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const AUDIO_DIR = path.join(UPLOAD_DIR, "audio")
const IMAGES_DIR = path.join(UPLOAD_DIR, "images")

// Ensure directories exist
function ensureDirectories() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    }
    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true })
    }
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true })
    }
  } catch (error) {
    console.error("Error creating directories:", error)
  }
}

// Initialize directories
ensureDirectories()

// Helper to get file extension category
function getFileCategory(ext: string): string {
  const audioExts = ['.wav', '.mp3', '.aiff', '.mid', '.midi']
  const archiveExts = ['.zip', '.rar']
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp']
  
  ext = ext.toLowerCase()
  if (audioExts.includes(ext)) return 'audio'
  if (archiveExts.includes(ext)) return 'stems'
  if (imageExts.includes(ext)) return 'image'
  return 'other'
}

// Helper to validate file extension
function validateFileExtension(fileName: string, type: "audio" | "image"): boolean {
  const ext = path.extname(fileName).toLowerCase()
  const category = getFileCategory(ext)
  
  if (type === "audio") {
    return category === "audio" || category === "stems"
  } else if (type === "image") {
    return category === "image"
  }
  
  return false
}

export async function saveFile(
  file: Buffer,
  fileName: string,
  type: "audio" | "image"
): Promise<{ url: string; originalName: string }> {
  try {
    // Validate file extension
    if (!validateFileExtension(fileName, type)) {
      throw new Error(`Invalid file type for ${type} upload`)
    }

    // Clean the filename to ensure it's safe for the filesystem
    const fileExt = path.extname(fileName)
    const fileNameWithoutExt = path.basename(fileName, fileExt)
      .replace(/[<>:"/\\|?*]/g, '') // Remove unsafe filesystem characters
      .toLowerCase()
    
    // Choose directory based on type
    const dir = type === "audio" ? AUDIO_DIR : IMAGES_DIR
    
    // Generate a unique filename using timestamp and random string
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const finalFileName = `${fileNameWithoutExt}-${timestamp}-${randomString}${fileExt}`
    
    const filePath = path.join(dir, finalFileName)
    
    // Save file synchronously
    fs.writeFileSync(filePath, file)
    
    // Return public URL and original filename
    const publicPath = `/uploads/${type === "audio" ? "audio" : "images"}/${finalFileName}`
    return {
      url: publicPath,
      originalName: fileName
    }
  } catch (error) {
    console.error("Error saving file:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to save file")
  }
} 