/**
 * Image optimization utility
 * Automatically resizes and compresses images before upload
 */

interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface OptimizedImageResult {
  file: File
  originalSize: number
  optimizedSize: number
  compressionRatio: number
}

/**
 * Optimizes an image file by resizing and compressing it
 * @param file - The original image file
 * @param options - Optimization options
 * @returns Promise with optimized file and compression stats
 */
export async function optimizeImage(
  file: File, 
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height
          
          if (width > height) {
            width = Math.min(width, maxWidth)
            height = width / aspectRatio
          } else {
            height = Math.min(height, maxHeight)
            width = height * aspectRatio
          }
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and optimize the image
        ctx?.drawImage(img, 0, 0, width, height)

        // Convert to blob with specified quality and format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create optimized image'))
              return
            }

            // Create new file with optimized data
            const optimizedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now()
            })

            const originalSize = file.size
            const optimizedSize = optimizedFile.size
            const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

            resolve({
              file: optimizedFile,
              originalSize,
              optimizedSize,
              compressionRatio
            })
          },
          `image/${format}`,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Optimizes multiple images in parallel
 * @param files - Array of image files
 * @param options - Optimization options
 * @returns Promise with array of optimized files and stats
 */
export async function optimizeImages(
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult[]> {
  const optimizationPromises = files.map(file => optimizeImage(file, options))
  return Promise.all(optimizationPromises)
}

/**
 * Gets file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Checks if a file is an image
 * @param file - File to check
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Validates image file size and type
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Validation result
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): {
  isValid: boolean
  error?: string
} {
  if (!isImageFile(file)) {
    return { isValid: false, error: 'File must be an image' }
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size must be less than ${maxSizeMB}MB` 
    }
  }

  return { isValid: true }
}
