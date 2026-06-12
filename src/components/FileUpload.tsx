import React, { useState, useRef } from 'react'
import '../styles/fileupload.css'

interface FileUploadProps {
  onUploadComplete: () => void
}

interface UploadFileItem {
  file: File
  path: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadFileItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const resolvePath = (file: File): string => {
    const api: any = (window as any).electronAPI
    let p = ''
    try { p = api?.getPathForFile?.(file) || '' } catch {}
    if (!p) p = (file as any).path || ''
    return p
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    addFilesToQueue(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      addFilesToQueue(Array.from(files))
    }
  }

  const handlePickViaDialog = async () => {
    const api: any = (window as any).electronAPI
    const res = await api?.dialog?.pickMultipleFiles?.()
    if (res?.success && res.data && res.data.length > 0) {
      const files = res.data.map((item: any) => ({
        name: item.fileName,
        size: item.fileSize,
        path: item.filePath,
      } as unknown as File))
      addFilesToQueue(files)
    }
  }

  const addFilesToQueue = (files: File[]) => {
    const TWO_GB = 2 * 1024 * 1024 * 1024
    const newItems: UploadFileItem[] = files.map(file => {
      const fileSizeGB = file.size / TWO_GB
      if (fileSizeGB > 2) {
        return {
          file,
          path: resolvePath(file),
          status: 'error' as const,
          progress: 0,
          error: 'File exceeds 2GB limit',
        }
      }
      return {
        file,
        path: resolvePath(file),
        status: 'pending' as const,
        progress: 0,
      }
    })
    setUploadQueue(prev => [...prev, ...newItems])
  }

  const startUploadQueue = async () => {
    if (isUploading) return
    setIsUploading(true)

    const api: any = (window as any).electronAPI

    // Subscribe to progress once
    unsubscribeRef.current = api.telegram.onUploadProgress((data: any) => {
      setUploadQueue(prev => {
        const updated = [...prev]
        const uploadingIdx = updated.findIndex(item => item.status === 'uploading')
        if (uploadingIdx !== -1) {
          updated[uploadingIdx].progress = data.percent
        }
        return updated
      })
    })

    // Upload files one by one
    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i]
      if (item.status === 'error') continue

      // Mark as uploading
      setUploadQueue(prev => {
        const updated = [...prev]
        updated[i].status = 'uploading'
        updated[i].progress = 0
        return updated
      })

      let filePath = item.path
      if (!filePath) {
        const res = await api?.dialog?.pickFile?.()
        if (res?.success && res.data?.filePath) {
          filePath = res.data.filePath
        }
      }

      if (!filePath) {
        setUploadQueue(prev => {
          const updated = [...prev]
          updated[i].status = 'error'
          updated[i].error = 'Unable to access file path'
          return updated
        })
        continue
      }

      try {
        const result = await api.telegram.uploadFile(filePath)
        if (result.success) {
          setUploadQueue(prev => {
            const updated = [...prev]
            updated[i].status = 'completed'
            updated[i].progress = 100
            return updated
          })
        } else {
          setUploadQueue(prev => {
            const updated = [...prev]
            updated[i].status = 'error'
            updated[i].error = result.error || 'Upload failed'
            return updated
          })
        }
      } catch (error) {
        setUploadQueue(prev => {
          const updated = [...prev]
          updated[i].status = 'error'
          updated[i].error = (error as Error).message
          return updated
        })
      }
    }

    // Cleanup
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    setIsUploading(false)
    
    // Auto-clear completed items after 2 seconds
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status !== 'completed'))
      onUploadComplete()
      if (fileInputRef.current) fileInputRef.current.value = ''
    }, 2000)
  }

  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index))
  }

  const clearQueue = () => {
    if (!isUploading) {
      setUploadQueue([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const pendingCount = uploadQueue.filter(item => item.status === 'pending').length
  const totalProgress = uploadQueue.length > 0
    ? Math.floor(uploadQueue.reduce((sum, item) => sum + item.progress, 0) / uploadQueue.length)
    : 0

  return (
    <div className="upload-section glass-card">
      <div className="upload-header">
        <h2 className="section-title">⬆️ Upload Files</h2>
        <p className="upload-subtitle">Drag and drop multiple files or click to select (up to 2GB each)</p>
      </div>

      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${uploadQueue.length > 0 ? 'has-file' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => uploadQueue.length === 0 && handlePickViaDialog()}
        data-testid="upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          data-testid="upload-file-input"
        />

        {uploadQueue.length === 0 ? (
          <div className="dropzone-content">
            <div className="dropzone-icon">📤</div>
            <p className="dropzone-text">Drop multiple files here or click to browse</p>
            <p className="dropzone-hint">Maximum file size: 2GB per file</p>
          </div>
        ) : (
          <div className="upload-queue">
            <div className="queue-header">
              <span className="queue-count">{uploadQueue.length} file(s) in queue</span>
              {!isUploading && (
                <button
                  className="clear-queue-btn"
                  onClick={(e) => { e.stopPropagation(); clearQueue() }}
                  data-testid="clear-queue-button"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="queue-list">
              {uploadQueue.map((item, index) => (
                <div key={index} className={`queue-item status-${item.status}`}>
                  <div className="file-info">
                    <div className="file-icon">
                      {item.status === 'completed' && '✅'}
                      {item.status === 'error' && '❌'}
                      {item.status === 'uploading' && '⏳'}
                      {item.status === 'pending' && '📄'}
                    </div>
                    <div className="file-details">
                      <div className="file-name" data-testid={`queue-file-name-${index}`}>
                        {item.file.name}
                      </div>
                      <div className="file-size">{formatFileSize(item.file.size)}</div>
                      {item.error && <div className="file-error">{item.error}</div>}
                    </div>
                  </div>

                  {item.status === 'uploading' && (
                    <div className="file-progress">
                      <div className="progress-bar-small">
                        <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                      </div>
                      <span className="progress-text-small">{item.progress}%</span>
                    </div>
                  )}

                  {item.status === 'pending' && !isUploading && (
                    <button
                      className="remove-item-btn"
                      onClick={(e) => { e.stopPropagation(); removeFromQueue(index) }}
                      data-testid={`remove-queue-item-${index}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isUploading && (
              <div className="overall-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${totalProgress}%` }}></div>
                </div>
                <div className="progress-text" data-testid="overall-progress-text">
                  Overall: {totalProgress}%
                </div>
              </div>
            )}

            {!isUploading && pendingCount > 0 && (
              <div className="upload-actions">
                <button
                  className="glass-button glass-button-primary"
                  onClick={(e) => { e.stopPropagation(); startUploadQueue() }}
                  data-testid="start-upload-button"
                >
                  Upload {pendingCount} File(s) to Cloud
                </button>
                <button
                  className="glass-button"
                  onClick={(e) => { e.stopPropagation(); handlePickViaDialog() }}
                  data-testid="add-more-files-button"
                >
                  Add More Files
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default FileUpload
