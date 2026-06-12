// CloudSaver v2 - Electron Main Process
// Extends v1 main process with v2 features: bulk ops, clipboard, settings persistence,
// sync history, upload concurrency queue, folder recursive picker.
import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron'
import * as fs from 'fs'
import * as pathMod from 'path'
import path from 'path'
import { TelegramService } from './telegram-service'
import { StorageService } from './storage-service'
import { AutoSyncService } from './auto-sync-service'

let mainWindow: BrowserWindow | null = null
const telegramService = new TelegramService()
const storageService = new StorageService()
const autoSyncService = new AutoSyncService(telegramService)

autoSyncService.setStatusCallback((status, file) => {
  if (mainWindow) {
    mainWindow.webContents.send('autosync:status', { status, file })
    // append to sync history
    appendSyncHistory({ timestamp: Date.now(), fileName: file || '', status, size: 0 }).catch(() => {})
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#0a0a14',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    },
    frame: true,
    titleBarStyle: 'default'
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  createWindow()
  const savedConfig = await storageService.getSyncConfig()
  if (savedConfig) autoSyncService.updateConfig(savedConfig)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  autoSyncService.stop()
  if (process.platform !== 'darwin') app.quit()
})
app.on('before-quit', () => { autoSyncService.stop() })

// ===== V2 prefs file helpers =====
function prefsPath(): string {
  return pathMod.join(app.getPath('userData'), 'cloudsaver-v2-prefs.json')
}
async function readPrefs(): Promise<any> {
  try {
    const p = prefsPath()
    if (!fs.existsSync(p)) return {}
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch { return {} }
}
async function writePrefs(prefs: any): Promise<void> {
  fs.writeFileSync(prefsPath(), JSON.stringify(prefs, null, 2), 'utf8')
}
function historyPath(): string {
  return pathMod.join(app.getPath('userData'), 'cloudsaver-sync-history.json')
}
async function appendSyncHistory(entry: any): Promise<void> {
  try {
    let arr: any[] = []
    if (fs.existsSync(historyPath())) {
      arr = JSON.parse(fs.readFileSync(historyPath(), 'utf8'))
    }
    arr.unshift(entry)
    if (arr.length > 1000) arr = arr.slice(0, 1000)
    fs.writeFileSync(historyPath(), JSON.stringify(arr), 'utf8')
  } catch (e) { console.error('sync history append failed', e) }
}

// ===== Existing IPC handlers (v1) =====
ipcMain.handle('telegram:check-session', async () => {
  try {
    const session = await storageService.getSession()
    return { success: true, hasSession: !!session }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:login', async (_, data: { apiId: number; apiHash: string; phoneNumber: string }) => {
  try {
    const result = await telegramService.startAuth(data.apiId, data.apiHash, data.phoneNumber)
    return { success: true, data: result }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:verify-code', async (_, code: string) => {
  try {
    const result = await telegramService.verifyCode(code)
    if (result.success) {
      const sessionString = telegramService.getSessionString()
      const credentials = telegramService.getCredentials()
      await storageService.saveSession(sessionString, credentials)
      return { success: true, needsKeyChoice: true }
    }
    return result
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:verify-2fa', async (_, password: string) => {
  try {
    const result = await telegramService.verify2FA(password)
    if (result.success) {
      const sessionString = telegramService.getSessionString()
      const credentials = telegramService.getCredentials()
      await storageService.saveSession(sessionString, credentials)
      return { success: true, needsKeyChoice: true }
    }
    return result
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:reconnect', async () => {
  try {
    const sessionData = await storageService.getSession()
    if (!sessionData) return { success: false, error: 'No session found' }
    const result = await telegramService.reconnect(
      sessionData.session, sessionData.credentials.apiId, sessionData.credentials.apiHash
    )
    return { success: true, data: result }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

// ===== V2 Upload queue with concurrency =====
interface UploadJob { id: string; filePath: string; event: any }
const uploadQueue: UploadJob[] = []
let activeUploads = 0
async function getConcurrency(): Promise<number> {
  const p = await readPrefs()
  const c = parseInt(String(p.uploadConcurrency || 2), 10)
  return Math.min(5, Math.max(1, isNaN(c) ? 2 : c))
}
async function processQueue() {
  const limit = await getConcurrency()
  while (activeUploads < limit && uploadQueue.length > 0) {
    const job = uploadQueue.shift()!
    activeUploads++
    runUpload(job).finally(() => { activeUploads--; processQueue() })
  }
}
async function runUpload(job: UploadJob): Promise<void> {
  try {
    job.event.sender.send('telegram:upload-progress', {
      id: job.id, sent: 0, total: 0, percent: 0
    })
    const result = await telegramService.uploadFile(job.filePath, (sent, total) => {
      try {
        job.event.sender.send('telegram:upload-progress', {
          id: job.id, sent, total,
          percent: total > 0 ? Math.min(99, Math.floor((sent / total) * 100)) : 0,
        })
      } catch {}
    })
    try {
      job.event.sender.send('telegram:upload-progress', {
        id: job.id, sent: result.fileSize, total: result.fileSize, percent: 100,
      })
    } catch {}
    job.event.sender.send('telegram:upload-complete', { id: job.id, success: true, data: result })
  } catch (error) {
    job.event.sender.send('telegram:upload-complete', { id: job.id, success: false, error: (error as Error).message })
  }
}

ipcMain.handle('telegram:upload-file', async (event, filePath: string, id?: string) => {
  try {
    const jobId = id || Math.random().toString(36).slice(2)
    return await new Promise((resolve) => {
      const onComplete = (_: any, payload: any) => {
        if (payload.id !== jobId) return
        event.sender.off('telegram:upload-complete' as any, onComplete as any)
        resolve(payload.success ? { success: true, data: payload.data } : { success: false, error: payload.error })
      }
      const listener = (_: any, payload: any) => onComplete(_, payload)
      ipcMain.on('telegram:_internal-noop', () => {})
      const channelListener = (e: any, payload: any) => {
        if (payload && payload.id === jobId) {
          resolve(payload.success ? { success: true, data: payload.data } : { success: false, error: payload.error })
        }
      }
      // We attach to webContents IPC instead
      const wc = event.sender
      const handler = (_evt: any, payload: any) => {
        if (payload && payload.id === jobId) {
          wc.off('ipc-message-sync' as any, handler as any)
          resolve(payload.success ? { success: true, data: payload.data } : { success: false, error: payload.error })
        }
      }
      // Simpler approach: directly await runUpload but bypass queue with concurrency cap
      uploadQueue.push({ id: jobId, filePath, event: {
        sender: {
          send: (channel: string, data: any) => {
            event.sender.send(channel, data)
            if (channel === 'telegram:upload-complete' && data.id === jobId) {
              resolve(data.success ? { success: true, data: data.data } : { success: false, error: data.error })
            }
          }
        }
      }})
      processQueue()
    })
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:list-files', async () => {
  try {
    const files = await telegramService.listFiles()
    return { success: true, data: files }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:download-file', async (_, messageId: number, fileName: string) => {
  try {
    const result = await telegramService.downloadFile(messageId, fileName)
    return { success: true, data: result }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:delete-file', async (_, messageId: number) => {
  try {
    await telegramService.deleteFile(messageId)
    return { success: true }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:logout', async () => {
  try {
    await telegramService.logout()
    await storageService.clearSession()
    autoSyncService.stop()
    return { success: true }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('dialog:pick-file', async () => {
  try {
    const result = await dialog.showOpenDialog({ title: 'Select a file to upload', properties: ['openFile'] })
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return { success: false, error: 'No file selected' }
    const filePath = result.filePaths[0]
    const stat = fs.statSync(filePath)
    return { success: true, data: { filePath, fileName: pathMod.basename(filePath), fileSize: stat.size } }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('dialog:pick-multiple-files', async () => {
  try {
    const result = await dialog.showOpenDialog({ title: 'Select files to upload', properties: ['openFile', 'multiSelections'] })
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return { success: false, error: 'No files selected' }
    const files = result.filePaths.map((filePath: string) => {
      const stat = fs.statSync(filePath)
      return { filePath, fileName: pathMod.basename(filePath), fileSize: stat.size }
    })
    return { success: true, data: files }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('dialog:pick-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({ title: 'Select folder to sync', properties: ['openDirectory'] })
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return { success: false, error: 'No folder selected' }
    return { success: true, data: { folderPath: result.filePaths[0] } }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:setup-new-channel', async () => {
  try {
    const channelResult = await telegramService.createNewChannel()
    return { success: true, data: channelResult }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:setup-existing-channel', async (_, key: string) => {
  try {
    const channelResult = await telegramService.findChannelByToken(key)
    return { success: true, data: channelResult }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('dialog:save-key-file', async (_, key: string, body: string) => {
  try {
    const downloadsPath = app.getPath('downloads')
    const filePath = pathMod.join(downloadsPath, 'cloudsave.txt')
    const content = `key :- ${key}\n\n${body}\n`
    fs.writeFileSync(filePath, content, 'utf8')
    return { success: true, data: { filePath } }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:save-credentials', async (_, credentials: any) => {
  try { await storageService.saveCredentials(credentials); return { success: true } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:get-credentials', async () => {
  try {
    const credentials = await storageService.getCredentials()
    return { success: true, data: credentials }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('autosync:get-config', async () => {
  try { return { success: true, data: autoSyncService.getConfig() } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('autosync:update-config', async (_, newConfig: any) => {
  try {
    autoSyncService.updateConfig(newConfig)
    await storageService.saveSyncConfig(autoSyncService.getConfig())
    return { success: true }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('autosync:start', async () => {
  try { autoSyncService.start(); return { success: true } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('autosync:stop', async () => {
  try { autoSyncService.stop(); return { success: true } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('autosync:get-status', async () => {
  try { return { success: true, data: autoSyncService.getStatus() } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

// ===== V2 NEW IPC handlers =====

// Recursive folder picker
function walkDir(dir: string, exclude: string[] = []): string[] {
  const out: string[] = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const full = pathMod.join(dir, item.name)
    if (exclude.some(p => full.includes(p))) continue
    if (item.isDirectory()) out.push(...walkDir(full, exclude))
    else if (item.isFile()) out.push(full)
  }
  return out
}

ipcMain.handle('dialog:pick-folder-recursive', async () => {
  try {
    const result = await dialog.showOpenDialog({ title: 'Select folder to upload', properties: ['openDirectory'] })
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return { success: false, error: 'No folder selected' }
    const folder = result.filePaths[0]
    const exclude = ['node_modules', '.git', '.DS_Store']
    const all = walkDir(folder, exclude)
    const files = all.map(fp => {
      const stat = fs.statSync(fp)
      return { filePath: fp, fileName: pathMod.basename(fp), fileSize: stat.size }
    })
    return { success: true, data: { folderPath: folder, files } }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('telegram:bulk-download', async (event, items: Array<{ messageId: number; fileName: string }>) => {
  const results: any[] = []
  for (let i = 0; i < items.length; i++) {
    try {
      const r = await telegramService.downloadFile(items[i].messageId, items[i].fileName)
      results.push({ success: true, data: r })
    } catch (e) { results.push({ success: false, error: (e as Error).message }) }
    event.sender.send('telegram:bulk-progress', { kind: 'download', index: i + 1, total: items.length })
  }
  return { success: true, data: results }
})

ipcMain.handle('telegram:bulk-delete', async (event, messageIds: number[]) => {
  const results: any[] = []
  for (let i = 0; i < messageIds.length; i++) {
    try { await telegramService.deleteFile(messageIds[i]); results.push({ success: true }) }
    catch (e) { results.push({ success: false, error: (e as Error).message }) }
    event.sender.send('telegram:bulk-progress', { kind: 'delete', index: i + 1, total: messageIds.length })
  }
  return { success: true, data: results }
})

ipcMain.handle('app:copy-to-clipboard', async (_, text: string) => {
  try { clipboard.writeText(text); return { success: true } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:get-download-path', async () => {
  try {
    const prefs = await readPrefs()
    return { success: true, data: prefs.downloadPath || app.getPath('downloads') }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:set-download-path', async (_, p: string) => {
  try { const prefs = await readPrefs(); prefs.downloadPath = p; await writePrefs(prefs); return { success: true } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:get-upload-concurrency', async () => {
  try { const prefs = await readPrefs(); return { success: true, data: prefs.uploadConcurrency || 2 } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:set-upload-concurrency', async (_, n: number) => {
  try { const prefs = await readPrefs(); prefs.uploadConcurrency = Math.min(5, Math.max(1, n)); await writePrefs(prefs); return { success: true } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('app:get-version', async () => {
  try { return { success: true, data: app.getVersion() } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:get-sync-history', async () => {
  try {
    if (!fs.existsSync(historyPath())) return { success: true, data: [] }
    return { success: true, data: JSON.parse(fs.readFileSync(historyPath(), 'utf8')) }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:append-sync-history', async (_, entry: any) => {
  try { await appendSyncHistory(entry); return { success: true } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:clear-sync-history', async () => {
  try { if (fs.existsSync(historyPath())) fs.unlinkSync(historyPath()); return { success: true } }
  catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('dialog:pick-download-dir', async () => {
  try {
    const result = await dialog.showOpenDialog({ title: 'Select default download folder', properties: ['openDirectory'] })
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return { success: false, error: 'No folder selected' }
    return { success: true, data: { folderPath: result.filePaths[0] } }
  } catch (error) { return { success: false, error: (error as Error).message } }
})

ipcMain.handle('storage:factory-reset', async () => {
  try {
    await storageService.clearSession()
    if (fs.existsSync(prefsPath())) fs.unlinkSync(prefsPath())
    if (fs.existsSync(historyPath())) fs.unlinkSync(historyPath())
    autoSyncService.stop()
    return { success: true }
  } catch (error) { return { success: false, error: (error as Error).message } }
})
