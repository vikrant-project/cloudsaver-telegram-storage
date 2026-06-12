import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import chokidar from 'chokidar'
import { TelegramService } from './telegram-service'

export interface SyncConfig {
  enabled: boolean
  mode: 'all' | 'custom' // 'all' monitors default folders, 'custom' monitors only user-specified paths
  customPaths: string[]
  fileFilters: {
    enabled: boolean
    extensions: string[] // e.g., ['.jpg', '.png', '.pdf']
  }
  excludePatterns: string[] // e.g., ['node_modules', '.git']
}

export class AutoSyncService {
  private watcher: chokidar.FSWatcher | null = null
  private config: SyncConfig
  private telegramService: TelegramService
  private isRunning: boolean = false
  private uploadQueue: Set<string> = new Set()
  private statusCallback: ((status: string, file?: string) => void) | null = null

  constructor(telegramService: TelegramService) {
    this.telegramService = telegramService
    this.config = {
      enabled: false,
      mode: 'custom',
      customPaths: [],
      fileFilters: {
        enabled: false,
        extensions: [],
      },
      excludePatterns: ['node_modules', '.git', '$RECYCLE.BIN', 'System Volume Information'],
    }
  }

  setStatusCallback(callback: (status: string, file?: string) => void) {
    this.statusCallback = callback
  }

  private emitStatus(status: string, file?: string) {
    if (this.statusCallback) {
      this.statusCallback(status, file)
    }
  }

  getConfig(): SyncConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<SyncConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    // Restart watcher if running
    if (this.isRunning) {
      this.stop()
      if (this.config.enabled) {
        this.start()
      }
    }
  }

  private getDefaultPaths(): string[] {
    const paths: string[] = []
    try {
      paths.push(app.getPath('downloads'))
      paths.push(app.getPath('documents'))
      paths.push(app.getPath('pictures'))
      paths.push(app.getPath('videos'))
      paths.push(app.getPath('desktop'))
    } catch (err) {
      console.error('Error getting default paths:', err)
    }
    return paths.filter(p => fs.existsSync(p))
  }

  private getWatchPaths(): string[] {
    if (this.config.mode === 'all') {
      return this.getDefaultPaths()
    }
    return this.config.customPaths.filter(p => fs.existsSync(p))
  }

  private shouldUploadFile(filePath: string): boolean {
    // Check file filters
    if (this.config.fileFilters.enabled && this.config.fileFilters.extensions.length > 0) {
      const ext = path.extname(filePath).toLowerCase()
      if (!this.config.fileFilters.extensions.includes(ext)) {
        return false
      }
    }

    // Check exclude patterns
    for (const pattern of this.config.excludePatterns) {
      if (filePath.includes(pattern)) {
        return false
      }
    }

    // Check file size (max 2GB)
    try {
      const stats = fs.statSync(filePath)
      const TWO_GB = 2 * 1024 * 1024 * 1024
      if (stats.size > TWO_GB) {
        console.log(`Skipping file (>2GB): ${filePath}`)
        return false
      }
      // Skip very small files (likely temp files)
      if (stats.size < 1024) {
        return false
      }
    } catch (err) {
      return false
    }

    return true
  }

  private async uploadFile(filePath: string) {
    if (this.uploadQueue.has(filePath)) {
      return // Already queued
    }

    this.uploadQueue.add(filePath)
    this.emitStatus('uploading', path.basename(filePath))

    try {
      // Wait a bit to ensure file is fully written
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Check if file still exists
      if (!fs.existsSync(filePath)) {
        this.uploadQueue.delete(filePath)
        return
      }

      await this.telegramService.uploadFile(filePath)
      this.emitStatus('completed', path.basename(filePath))
      console.log(`Auto-synced: ${filePath}`)
    } catch (err) {
      this.emitStatus('error', path.basename(filePath))
      console.error(`Failed to auto-sync ${filePath}:`, err)
    } finally {
      this.uploadQueue.delete(filePath)
    }
  }

  start() {
    if (this.isRunning || !this.config.enabled) {
      return
    }

    const watchPaths = this.getWatchPaths()
    if (watchPaths.length === 0) {
      console.warn('No valid paths to watch')
      return
    }

    console.log('Starting auto-sync on:', watchPaths)

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true, // Don't trigger on existing files
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    })

    this.watcher.on('add', (filePath: string) => {
      if (this.shouldUploadFile(filePath)) {
        console.log(`New file detected: ${filePath}`)
        this.uploadFile(filePath)
      }
    })

    this.watcher.on('error', (error: Error) => {
      console.error('Watcher error:', error)
      this.emitStatus('error')
    })

    this.isRunning = true
    this.emitStatus('started')
  }

  stop() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    this.isRunning = false
    this.uploadQueue.clear()
    this.emitStatus('stopped')
    console.log('Auto-sync stopped')
  }

  isActive(): boolean {
    return this.isRunning
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      watchPaths: this.getWatchPaths(),
      queueLength: this.uploadQueue.size,
      currentFiles: Array.from(this.uploadQueue),
    }
  }
}
