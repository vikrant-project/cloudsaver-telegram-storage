import React from 'react'
import '../styles/filelist.css'

interface File {
  messageId: number
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: number
  caption: string
}

interface FileListProps {
  files: File[]
  loading: boolean
  onDownload: (messageId: number, fileName: string) => void
  onDelete: (messageId: number) => void
}

const FileList: React.FC<FileListProps> = ({ files, loading, onDownload, onDelete }) => {
  if (loading) {
    return (
      <div className="file-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading files...</p>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        <div className="empty-icon">📁</div>
        <p className="empty-text">No files uploaded yet</p>
        <p className="empty-hint">Upload your first file to get started</p>
      </div>
    )
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <div className="header-col col-name">Name</div>
        <div className="header-col col-size">Size</div>
        <div className="header-col col-date">Uploaded</div>
        <div className="header-col col-actions">Actions</div>
      </div>

      <div className="file-list-body">
        {files.map((file) => (
          <div key={file.messageId} className="file-item" data-testid="file-list-item">
            <div className="file-col col-name">
              <div className="file-icon-wrapper">
                <span className="file-icon">{getFileIcon(file.mimeType)}</span>
              </div>
              <div className="file-name-wrapper">
                <div className="file-name" data-testid="file-name">{file.fileName}</div>
                <div className="file-type">{getFileType(file.mimeType)}</div>
              </div>
            </div>

            <div className="file-col col-size" data-testid="file-size">
              {formatFileSize(file.fileSize)}
            </div>

            <div className="file-col col-date" data-testid="file-date">
              {formatDate(file.uploadedAt)}
            </div>

            <div className="file-col col-actions">
              <button
                className="action-button download-button"
                onClick={() => onDownload(file.messageId, file.fileName)}
                title="Download"
                data-testid="file-download-button"
              >
                ⬇️
              </button>
              <button
                className="action-button delete-button"
                onClick={() => onDelete(file.messageId)}
                title="Delete"
                data-testid="file-delete-button"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗄️'
  if (mimeType.includes('text')) return '📝'
  return '📄'
}

function getFileType(mimeType: string): string {
  const parts = mimeType.split('/')
  if (parts.length > 1) {
    return parts[1].toUpperCase()
  }
  return 'FILE'
}

function formatFileSize(bytes: any): string {
  let n: number
  if (bytes == null) n = 0
  else if (typeof bytes === 'number') n = bytes
  else if (typeof bytes === 'string') n = Number(bytes)
  else if (typeof bytes === 'bigint') n = Number(bytes)
  else if (typeof bytes === 'object' && typeof (bytes as any).toString === 'function') n = Number((bytes as any).toString())
  else n = Number(bytes)
  if (!isFinite(n) || n <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(n) / Math.log(k)))
  return Math.round(n / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

export default FileList
