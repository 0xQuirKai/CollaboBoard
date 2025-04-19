"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, ZoomIn, ZoomOut } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface ImageUploaderProps {
  children: React.ReactNode
  onImageUpload: (imageUrl: string) => void
}

export default function ImageUploader({ children, onImageUpload }: ImageUploaderProps) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageSize, setImageSize] = useState(100) // percentage of original size
  const [originalWidth, setOriginalWidth] = useState(0)
  const [originalHeight, setOriginalHeight] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert("File is too large. Please select an image under 10MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)

      // Get original dimensions
      const img = new Image()
      img.onload = () => {
        setOriginalWidth(img.width)
        setOriginalHeight(img.height)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert("File is too large. Please select an image under 10MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)

      // Get original dimensions
      const img = new Image()
      img.onload = () => {
        setOriginalWidth(img.width)
        setOriginalHeight(img.height)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleConfirm = () => {
    if (previewUrl) {
      // If we need to resize the image before adding to whiteboard
      if (imageSize !== 100 && originalWidth > 0 && originalHeight > 0) {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (ctx) {
          const scaleFactor = imageSize / 100
          canvas.width = originalWidth * scaleFactor
          canvas.height = originalHeight * scaleFactor

          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const resizedImageUrl = canvas.toDataURL("image/png")
            onImageUpload(resizedImageUrl)
            setOpen(false)
            setPreviewUrl(null)
            setImageSize(100)
          }
          img.src = previewUrl
        } else {
          // Fallback if canvas context is not available
          onImageUpload(previewUrl)
          setOpen(false)
          setPreviewUrl(null)
          setImageSize(100)
        }
      } else {
        // Use original image
        onImageUpload(previewUrl)
        setOpen(false)
        setPreviewUrl(null)
        setImageSize(100)
      }
    }
  }

  const handleZoomIn = () => {
    setImageSize((prev) => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setImageSize((prev) => Math.max(prev - 10, 10))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="max-h-48 mx-auto object-contain"
                    style={{
                      maxWidth: "100%",
                      transform: `scale(${imageSize / 100})`,
                      transformOrigin: "center",
                    }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={imageSize <= 10}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <div className="w-32">
                    <Slider
                      value={[imageSize]}
                      min={10}
                      max={200}
                      step={5}
                      onValueChange={(value) => setImageSize(value[0])}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={imageSize >= 200}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">{imageSize}%</span>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewUrl(null)
                      setImageSize(100)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                  >
                    Remove
                  </Button>

                  <Button onClick={handleConfirm}>Add to Whiteboard</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Drag and drop an image, or click to browse</p>
                  <p className="text-xs mt-1">Maximum file size: 10MB</p>
                </div>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
