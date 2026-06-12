import React, { useState, useEffect } from 'react'
import iconUrl from '../assets/icon.png'
import FileUpload from './FileUpload'
import FileList from './FileList'
import AutoSyncSettings from './AutoSyncSettings'
import '../styles/dashboard.css'

interface DashboardProps {
  channelInfo: any
  onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ channelInfo, onLogout }) => {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showAutoSync, setShowAutoSync] = useState(false)
  const [autoSyncActive, setAutoSyncActive] = useState(false)

  useEffect(() => {
    loadFiles()
    checkAutoSyncStatus()
  }, [refreshTrigger])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const result = await window.electronAPI.telegram.listFiles()
      if (result.success) {
        setFiles(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAutoSyncStatus = async () => {
    try {
      const api: any = (window as any).electronAPI
      const statusResult = await api.autoSync.getStatus()
      if (statusResult.success) {
        setAutoSyncActive(statusResult.data?.isRunning || false)
      }
    } catch (error) {
      console.error('Failed to check auto-sync status:', error)
    }
  }

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleDownload = async (messageId: number, fileName: string) => {
    try {
      const result = await window.electronAPI.telegram.downloadFile(messageId, fileName)
      if (result.success) {
        alert(`File downloaded to: ${result.data.filePath}`)
      }
    } catch (error) {
      alert('Download failed: ' + (error as Error).message)
    }
  }

  const handleDelete = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      const result = await window.electronAPI.telegram.deleteFile(messageId)
      if (result.success) {
        setRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      alert('Delete failed: ' + (error as Error).message)
    }
  }

  const filteredFiles = files.filter(file =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSize = files.reduce((acc, file) => acc + (Number(file.fileSize) || 0), 0)

  return (
    <div className="dashboard-container fade-in">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <img src={iconUrl} alt="CloudSaver" className="logo-img-sm" />
            <h1 className="dashboard-title">
              Cloud<span className="text-gradient">Saver</span>
            </h1>
            <div className="channel-info">
              <span className="channel-badge" data-testid="dashboard-channel-name">
                📡 {channelInfo?.channelName || 'Connected'}
              </span>
            </div>
          </div>

          <div className="header-right">
            <button
              className={`glass-button header-button ${autoSyncActive ? 'autosync-active' : ''}`}
              onClick={() => setShowAutoSync(true)}
              data-testid="dashboard-autosync-button"
            >
              {autoSyncActive ? '🔄 Auto-Sync ON' : '🔄 Auto-Sync'}
            </button>
            <button
              className="glass-button header-button"
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              data-testid="dashboard-refresh-button"
            >
              🔄 Refresh
            </button>
            <button
              className="glass-button header-button"
              onClick={onLogout}
              data-testid="dashboard-logout-button"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Stats Bar */}
        <div className="stats-bar glass-card">
          <div className="stat-item">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <div className="stat-value" data-testid="dashboard-file-count">{files.length}</div>
              <div className="stat-label">Total Files</div>
            </div>
          </div>
          
          <div className="stat-divider"></div>
          
          <div className="stat-item">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <div className="stat-value" data-testid="dashboard-total-size">
                {formatFileSize(totalSize)}
              </div>
              <div className="stat-label">Total Storage</div>
            </div>
          </div>
          
          <div className="stat-divider"></div>
          
          <div className="stat-item">
            <div className="stat-icon">☁️</div>
            <div className="stat-content">
              <div className="stat-value">Unlimited</div>
              <div className="stat-label">Cloud Space</div>
            </div>
          </div>

          {autoSyncActive && (
            <>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <div className="stat-value autosync-badge">Active</div>
                  <div className="stat-label">Auto-Sync</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upload Section */}
        <FileUpload onUploadComplete={handleUploadComplete} />

        {/* Search & Files */}
        <div className="files-section glass-card">
          <div className="files-header">
            <h2 className="section-title">📂 My Files</h2>
            <div className="search-box">
              <input
                type="text"
                className="glass-input search-input"
                placeholder="🔍 Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="dashboard-search-input"
              />
            </div>
          </div>

          <FileList
            files={filteredFiles}
            loading={loading}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        </div>
      </main>

      {/* Auto-Sync Settings Modal */}
      {showAutoSync && (
        <AutoSyncSettings
          onClose={() => {
            setShowAutoSync(false)
            checkAutoSyncStatus()
          }}
        />
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  const n = Number(bytes)
  if (!isFinite(n) || n <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(n) / Math.log(k)))
  return Math.round(n / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default Dashboard
