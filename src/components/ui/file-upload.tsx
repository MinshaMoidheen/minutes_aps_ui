"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
  label?: string
}

export function FileUpload({
  onFileSelect,
  accept = { "text/csv": [".csv"] },
  maxFiles = 1,
  disabled = false,
  placeholder = "Choose file or drag and drop",
  className,
  id,
  label,
}: FileUploadProps) {
  const [file, setFile] = React.useState<File | null>(null)

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        onFileSelect(selectedFile)
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    disabled,
  })

  const handleRemoveFile = () => {
    setFile(null)
    onFileSelect(null)
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          file && "border-green-500 bg-green-50",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <input {...getInputProps()} id={id} />
        
        {file ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <FileText className="h-5 w-5" />
              <span className="font-medium">{file.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              className="mt-2"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="text-sm font-medium">
              {isDragActive ? "Drop the file here" : placeholder}
            </div>
            <div className="text-xs text-muted-foreground">
              CSV files only
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
