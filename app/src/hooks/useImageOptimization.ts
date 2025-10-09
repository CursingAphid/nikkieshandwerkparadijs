import { useState, useCallback } from 'react'
import { optimizeImage, optimizeImages, validateImageFile, formatFileSize, type OptimizedImageResult } from '../utils/imageOptimizer'

interface UseImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  maxSizeMB?: number
}

interface UseImageOptimizationReturn {
  optimizeSingleImage: (file: File) => Promise<OptimizedImageResult>
  optimizeMultipleImages: (files: File[]) => Promise<OptimizedImageResult[]>
  isOptimizing: boolean
  optimizationProgress: number
  lastOptimizationStats: OptimizedImageResult | null
}

/**
 * React hook for image optimization
 * Provides easy-to-use functions for optimizing images in components
 */
export function useImageOptimization(
  options: UseImageOptimizationOptions = {}
): UseImageOptimizationReturn {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [lastOptimizationStats, setLastOptimizationStats] = useState<OptimizedImageResult | null>(null)

  const optimizeSingleImage = useCallback(async (file: File): Promise<OptimizedImageResult> => {
    // Validate file first
    const validation = validateImageFile(file, options.maxSizeMB)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    setIsOptimizing(true)
    setOptimizationProgress(0)

    try {
      const result = await optimizeImage(file, {
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        quality: options.quality,
        format: options.format
      })

      setLastOptimizationStats(result)
      setOptimizationProgress(100)
      
      console.log(`Image optimized: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.optimizedSize)} (${result.compressionRatio.toFixed(1)}% reduction)`)
      
      return result
    } catch (error) {
      console.error('Image optimization failed:', error)
      throw error
    } finally {
      setIsOptimizing(false)
      setTimeout(() => setOptimizationProgress(0), 1000)
    }
  }, [options])

  const optimizeMultipleImages = useCallback(async (files: File[]): Promise<OptimizedImageResult[]> => {
    // Validate all files first
    for (const file of files) {
      const validation = validateImageFile(file, options.maxSizeMB)
      if (!validation.isValid) {
        throw new Error(`${file.name}: ${validation.error}`)
      }
    }

    setIsOptimizing(true)
    setOptimizationProgress(0)

    try {
      const results = await optimizeImages(files, {
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        quality: options.quality,
        format: options.format
      })

      // Calculate total savings
      const totalOriginalSize = results.reduce((sum: number, result: OptimizedImageResult) => sum + result.originalSize, 0)
      const totalOptimizedSize = results.reduce((sum: number, result: OptimizedImageResult) => sum + result.optimizedSize, 0)
      const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100

      console.log(`Optimized ${files.length} images: ${formatFileSize(totalOriginalSize)} → ${formatFileSize(totalOptimizedSize)} (${totalSavings.toFixed(1)}% reduction)`)

      // Set the last optimization stats for display
      setLastOptimizationStats({
        file: results[0].file, // Use first file as representative
        originalSize: totalOriginalSize,
        optimizedSize: totalOptimizedSize,
        compressionRatio: totalSavings
      })

      setOptimizationProgress(100)
      return results
    } catch (error) {
      console.error('Batch image optimization failed:', error)
      throw error
    } finally {
      setIsOptimizing(false)
      setTimeout(() => setOptimizationProgress(0), 1000)
    }
  }, [options])

  return {
    optimizeSingleImage,
    optimizeMultipleImages,
    isOptimizing,
    optimizationProgress,
    lastOptimizationStats
  }
}
