import React, { useState, useCallback } from 'react'
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface ConversionResult {
  success: boolean
  fileName: string
  url: string
  size: number
}

interface StepUploaderProps {
  onModelConverted?: (result: ConversionResult) => void
}

export const StepUploader: React.FC<StepUploaderProps> = ({ onModelConverted }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.step') && !file.name.toLowerCase().endsWith('.stp')) {
      setStatus('error')
      setMessage('Please upload a .step or .stp file')
      return
    }

    setIsUploading(true)
    setStatus('uploading')
    setMessage(`Converting ${file.name}...`)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:3001/api/convert', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setStatus('success')
        setMessage(`Converted: ${result.fileName} (${(result.size / 1024).toFixed(1)} KB)`)
        onModelConverted?.(result)
      } else {
        setStatus('error')
        setMessage(result.error || 'Conversion failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Server not running. Start with: cd server && npm start')
    } finally {
      setIsUploading(false)
    }
  }, [onModelConverted])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <div className="p-4 border-t border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">Import STEP File</h3>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors duration-200
          ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('step-file-input')?.click()}
      >
        <input
          id="step-file-input"
          type="file"
          accept=".step,.stp"
          onChange={handleFileChange}
          className="hidden"
        />

        {isUploading ? (
          <Loader2 className="w-8 h-8 mx-auto text-blue-400 animate-spin" />
        ) : (
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
        )}

        <p className="mt-2 text-sm text-gray-400">
          {dragOver ? 'Drop STEP file here' : 'Click or drag STEP file'}
        </p>
      </div>

      {status !== 'idle' && (
        <div className={`
          mt-2 p-2 rounded text-sm flex items-center gap-2
          ${status === 'success' ? 'bg-green-500/20 text-green-400' : ''}
          ${status === 'error' ? 'bg-red-500/20 text-red-400' : ''}
          ${status === 'uploading' ? 'bg-blue-500/20 text-blue-400' : ''}
        `}>
          {status === 'success' && <CheckCircle className="w-4 h-4" />}
          {status === 'error' && <XCircle className="w-4 h-4" />}
          {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
          <span className="truncate">{message}</span>
        </div>
      )}
    </div>
  )
}
