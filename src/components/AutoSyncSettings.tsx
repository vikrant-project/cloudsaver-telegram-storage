import React, { useState, useEffect } from 'react'
import '../styles/autosync.css'

interface AutoSyncSettingsProps {
  onClose: () => void
}

interface SyncConfig {
  enabled: boolean
  mode: 'all' | 'custom'
  customPaths: string[]
  fileFilters: {
    enabled: boolean
    extensions: string[]
  }
  excludePatterns: string[]
}

const AutoSyncSettings: React.FC<AutoSyncSettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState<SyncConfig>({
    enabled: false,
    mode: 'custom',
    customPaths: [],
    fileFilters: {
      enabled: false,
      extensions: [],
    },
    excludePatterns: ['node_modules', '.git', '$RECYCLE.BIN', 'System Volume Information'],
  })
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [newExtension, setNewExtension] = useState('')
  const [statusMessage, setStatusMessage] = useState<{ text: string; file?: string } | null>(null)

  useEffect(() => {
    loadConfig()
    loadStatus()

    // Subscribe to status updates
    const api: any = (window as any).electronAPI
    const unsubscribe = api.autoSync.onStatus((data: any) => {
      setStatusMessage({ text: data.status, file: data.file })
      setTimeout(() => setStatusMessage(null), 5000)
      loadStatus()
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadConfig = async () => {
    const api: any = (window as any).electronAPI
    const result = await api.autoSync.getConfig()
    if (result.success && result.data) {
      setConfig(result.data)
    }
  }

  const loadStatus = async () => {
    const api: any = (window as any).electronAPI
    const result = await api.autoSync.getStatus()
    if (result.success && result.data) {
      setSyncStatus(result.data)
    }
  }

  const saveConfig = async (newConfig: SyncConfig) => {
    const api: any = (window as any).electronAPI
    await api.autoSync.updateConfig(newConfig)
    setConfig(newConfig)
    
    // Restart if enabled
    if (newConfig.enabled) {
      await api.autoSync.start()
    } else {
      await api.autoSync.stop()
    }
    loadStatus()
  }

  const handleToggleEnabled = async () => {
    const newConfig = { ...config, enabled: !config.enabled }
    await saveConfig(newConfig)
  }

  const handleModeChange = async (mode: 'all' | 'custom') => {
    const newConfig = { ...config, mode }
    await saveConfig(newConfig)
  }

  const handleAddFolder = async () => {
    const api: any = (window as any).electronAPI
    const result = await api.dialog.pickFolder()
    if (result.success && result.data?.folderPath) {
      const newPaths = [...config.customPaths, result.data.folderPath]
      const newConfig = { ...config, customPaths: newPaths }
      await saveConfig(newConfig)
    }
  }

  const handleRemoveFolder = async (index: number) => {
    const newPaths = config.customPaths.filter((_, i) => i !== index)
    const newConfig = { ...config, customPaths: newPaths }
    await saveConfig(newConfig)
  }

  const handleToggleFileFilters = async () => {
    const newConfig = {
      ...config,
      fileFilters: {
        ...config.fileFilters,
        enabled: !config.fileFilters.enabled,
      },
    }
    await saveConfig(newConfig)
  }

  const handleAddExtension = async () => {
    if (!newExtension.trim()) return
    let ext = newExtension.trim()
    if (!ext.startsWith('.')) ext = '.' + ext
    if (!config.fileFilters.extensions.includes(ext)) {
      const newConfig = {
        ...config,
        fileFilters: {
          ...config.fileFilters,
          extensions: [...config.fileFilters.extensions, ext],
        },
      }
      await saveConfig(newConfig)
      setNewExtension('')
    }
  }

  const handleRemoveExtension = async (ext: string) => {
    const newConfig = {
      ...config,
      fileFilters: {
        ...config.fileFilters,
        extensions: config.fileFilters.extensions.filter(e => e !== ext),
      },
    }
    await saveConfig(newConfig)
  }

  const defaultFolders = [
    '📥 Downloads',
    '📄 Documents',
    '🖼️ Pictures',
    '🎬 Videos',
    '🖥️ Desktop',
  ]

  return (
    <div className="autosync-overlay" onClick={onClose} data-testid="autosync-overlay">
      <div className="autosync-modal glass-card" onClick={(e) => e.stopPropagation()} data-testid="autosync-modal">
        <div className="modal-header">
          <h2 className="modal-title">🔄 Auto-Sync Settings</h2>
          <button className="close-btn" onClick={onClose} data-testid="close-autosync-btn">✕</button>
        </div>

        {statusMessage && (
          <div className="status-message">
            <span className="status-icon">ℹ️</span>
            <span className="status-text">
              {statusMessage.text}
              {statusMessage.file && `: ${statusMessage.file}`}
            </span>
          </div>
        )}

        <div className="modal-body">
          {/* Enable/Disable Auto-Sync */}
          <div className="setting-section">
            <div className="setting-row">
              <div className="setting-info">
                <h3 className="setting-title">Enable Auto-Sync</h3>
                <p className="setting-desc">Automatically upload files from monitored folders</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={handleToggleEnabled}
                  data-testid="autosync-enable-toggle"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {syncStatus?.isRunning && (
              <div className="sync-status-badge active">
                <span className="status-indicator"></span>
                <span>Active • {syncStatus.queueLength} file(s) in queue</span>
              </div>
            )}
          </div>

          {config.enabled && (
            <>
              {/* Sync Mode Selection */}
              <div className="setting-section">
                <h3 className="section-title">Sync Mode</h3>
                <div className="mode-options">
                  <div
                    className={`mode-option ${config.mode === 'all' ? 'selected' : ''}`}
                    onClick={() => handleModeChange('all')}
                    data-testid="sync-mode-all"
                  >
                    <div className="mode-icon">📁</div>
                    <div className="mode-content">
                      <h4 className="mode-title">Auto-Sync ALL</h4>
                      <p className="mode-desc">Monitor all default folders</p>
                      <div className="folder-list-preview">
                        {defaultFolders.map((folder, i) => (
                          <span key={i} className="folder-badge">{folder}</span>
                        ))}
                      </div>
                    </div>
                    {config.mode === 'all' && <span className="check-icon">✓</span>}
                  </div>

                  <div
                    className={`mode-option ${config.mode === 'custom' ? 'selected' : ''}`}
                    onClick={() => handleModeChange('custom')}
                    data-testid="sync-mode-custom"
                  >
                    <div className="mode-icon">📂</div>
                    <div className="mode-content">
                      <h4 className="mode-title">Custom Paths Only</h4>
                      <p className="mode-desc">Select specific folders to monitor</p>
                    </div>
                    {config.mode === 'custom' && <span className="check-icon">✓</span>}
                  </div>
                </div>
              </div>

              {/* Custom Paths */}
              {config.mode === 'custom' && (
                <div className="setting-section">
                  <h3 className="section-title">Custom Sync Folders</h3>
                  <div className="custom-paths-list">
                    {config.customPaths.length === 0 ? (
                      <div className="empty-state">
                        <p className="empty-text">No folders added yet</p>
                      </div>
                    ) : (
                      config.customPaths.map((folderPath, index) => (
                        <div key={index} className="path-item">
                          <span className="path-icon">📁</span>
                          <span className="path-text">{folderPath}</span>
                          <button
                            className="remove-path-btn"
                            onClick={() => handleRemoveFolder(index)}
                            data-testid={`remove-folder-${index}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    className="glass-button glass-button-primary"
                    onClick={handleAddFolder}
                    data-testid="add-folder-btn"
                  >
                    + Add Folder
                  </button>
                </div>
              )}

              {/* File Filters */}
              <div className="setting-section">
                <div className="setting-row">
                  <div className="setting-info">
                    <h3 className="setting-title">File Type Filters</h3>
                    <p className="setting-desc">Only sync specific file types</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.fileFilters.enabled}
                      onChange={handleToggleFileFilters}
                      data-testid="file-filters-toggle"
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {config.fileFilters.enabled && (
                  <div className="filter-config">
                    <div className="extensions-list">
                      {config.fileFilters.extensions.length === 0 ? (
                        <div className="empty-state-small">
                          <p className="empty-text-small">All file types will be synced</p>
                        </div>
                      ) : (
                        config.fileFilters.extensions.map((ext, index) => (
                          <div key={index} className="ext-badge">
                            <span>{ext}</span>
                            <button
                              className="remove-ext-btn"
                              onClick={() => handleRemoveExtension(ext)}
                              data-testid={`remove-ext-${index}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="add-extension-row">
                      <input
                        type="text"
                        className="ext-input"
                        placeholder=".jpg, .png, .pdf..."
                        value={newExtension}
                        onChange={(e) => setNewExtension(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddExtension()}
                        data-testid="extension-input"
                      />
                      <button
                        className="glass-button glass-button-sm"
                        onClick={handleAddExtension}
                        data-testid="add-extension-btn"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Watch Paths */}
              {syncStatus?.watchPaths && syncStatus.watchPaths.length > 0 && (
                <div className="setting-section">
                  <h3 className="section-title">Currently Monitoring</h3>
                  <div className="watch-paths-list">
                    {syncStatus.watchPaths.map((path: string, i: number) => (
                      <div key={i} className="watch-path-item">
                        <span className="watch-icon">👁️</span>
                        <span className="watch-path">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="glass-button" onClick={onClose} data-testid="close-footer-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AutoSyncSettings
