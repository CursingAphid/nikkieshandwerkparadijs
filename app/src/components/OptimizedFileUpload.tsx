import React, { useRef, useState, useEffect } from 'react'
import { useImageOptimization } from '../hooks/useImageOptimization'
import { formatFileSize, isImageFile } from '../utils/imageOptimizer'

interface OptimizedFileUploadProps {
  onFileSelect?: (file: File) => void
  onMultipleFilesSelect?: (files: File[]) => void
  onFilesChange?: (files: File[]) => void // New callback for when files change
  accept?: string
  multiple?: boolean
  maxSizeMB?: number
  optimizationOptions?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  }
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

export function OptimizedFileUpload({
  onFileSelect,
  onMultipleFilesSelect,
  onFilesChange,
  accept = 'image/*',
  multiple = false,
  maxSizeMB = 10,
  optimizationOptions = {},
  className = '',
  disabled = false,
  children
}: OptimizedFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileOptimizationStats, setFileOptimizationStats] = useState<{[key: string]: {originalSize: number, optimizedSize: number, compressionRatio: number}}>({})
  const { optimizeSingleImage, optimizeMultipleImages, isOptimizing, optimizationProgress } = useImageOptimization({
    maxSizeMB,
    ...optimizationOptions
  })

  // Notify parent component when files change
  useEffect(() => {
    onFilesChange?.(uploadedFiles)
  }, [uploadedFiles, onFilesChange])

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(isImageFile)

    if (imageFiles.length === 0) {
      alert('Please select image files only')
      return
    }

    try {
      if (multiple && onMultipleFilesSelect) {
        const optimizedResults = await optimizeMultipleImages(imageFiles)
        const optimizedFiles = optimizedResults.map(result => result.file)
        
        // Store individual file stats
        const newStats: {[key: string]: {originalSize: number, optimizedSize: number, compressionRatio: number}} = {}
        optimizedResults.forEach((result, index) => {
          const fileKey = `${result.file.name}-${Date.now()}-${index}`
          newStats[fileKey] = {
            originalSize: result.originalSize,
            optimizedSize: result.optimizedSize,
            compressionRatio: result.compressionRatio
          }
        })
        setFileOptimizationStats(prev => ({...prev, ...newStats}))
        
        setUploadedFiles(prev => [...prev, ...optimizedFiles])
        onMultipleFilesSelect(optimizedFiles)
      } else if (onFileSelect) {
        const optimizedResult = await optimizeSingleImage(imageFiles[0])
        const fileKey = `${optimizedResult.file.name}-${Date.now()}`
        setFileOptimizationStats(prev => ({
          ...prev,
          [fileKey]: {
            originalSize: optimizedResult.originalSize,
            optimizedSize: optimizedResult.optimizedSize,
            compressionRatio: optimizedResult.compressionRatio
          }
        }))
        setUploadedFiles([optimizedResult.file])
        onFileSelect(optimizedResult.file)
      } else {
        throw new Error('No callback function provided for file selection')
      }
    } catch (error) {
      console.error('File optimization failed:', error)
      alert(`File optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    // Note: We don't remove stats as they're keyed by filename+timestamp
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isOptimizing ? 'pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {isOptimizing ? (
          <div className="space-y-2">
            <div className="text-blue-600 font-medium">Optimizing images...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${optimizationProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">{optimizationProgress}% complete</div>
          </div>
        ) : (
          <div className="space-y-2">
            {children || (
              <>
                <div className="text-gray-600">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-gray-500">
                  Images will be automatically optimized (max {maxSizeMB}MB)
                </div>
              </>
            )}
          </div>
        )}
      </div>


      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Images ({uploadedFiles.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {uploadedFiles.map((file, index) => {
              // Find stats for this file (simplified - just use index for now)
              const fileStats = Object.values(fileOptimizationStats)[index]
              return (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {formatFileSize(file.size)}
                  </div>
                  {fileStats && (
                    <div className="text-xs text-green-600 mt-1">
                      {formatFileSize(fileStats.originalSize)} → {formatFileSize(fileStats.optimizedSize)}
                      <br />
                      ({fileStats.compressionRatio.toFixed(1)}% smaller)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
