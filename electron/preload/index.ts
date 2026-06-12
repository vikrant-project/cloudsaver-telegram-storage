import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  telegram: {
    checkSession: () => ipcRenderer.invoke('telegram:check-session'),
    login: (data: { apiId: number; apiHash: string; phoneNumber: string }) =>
      ipcRenderer.invoke('telegram:login', data),
    verifyCode: (code: string) => ipcRenderer.invoke('telegram:verify-code', code),
    verify2FA: (password: string) => ipcRenderer.invoke('telegram:verify-2fa', password),
    reconnect: () => ipcRenderer.invoke('telegram:reconnect'),
    uploadFile: (filePath: string, id?: string) => ipcRenderer.invoke('telegram:upload-file', filePath, id),
    onUploadProgress: (cb: (data: { id?: string; sent: number; total: number; percent: number }) => void) => {
      const listener = (_: any, data: any) => cb(data)
      ipcRenderer.on('telegram:upload-progress', listener)
      return () => ipcRenderer.removeListener('telegram:upload-progress', listener)
    },
    onBulkProgress: (cb: (data: { kind: string; index: number; total: number }) => void) => {
      const listener = (_: any, data: any) => cb(data)
      ipcRenderer.on('telegram:bulk-progress', listener)
      return () => ipcRenderer.removeListener('telegram:bulk-progress', listener)
    },
    listFiles: () => ipcRenderer.invoke('telegram:list-files'),
    downloadFile: (messageId: number, fileName: string) =>
      ipcRenderer.invoke('telegram:download-file', messageId, fileName),
    deleteFile: (messageId: number) => ipcRenderer.invoke('telegram:delete-file', messageId),
    bulkDownload: (items: Array<{ messageId: number; fileName: string }>) =>
      ipcRenderer.invoke('telegram:bulk-download', items),
    bulkDelete: (ids: number[]) => ipcRenderer.invoke('telegram:bulk-delete', ids),
    logout: () => ipcRenderer.invoke('telegram:logout'),
    setupNewChannel: () => ipcRenderer.invoke('telegram:setup-new-channel'),
    setupExistingChannel: (key: string) => ipcRenderer.invoke('telegram:setup-existing-channel', key)
  },
  storage: {
    saveCredentials: (credentials: any) => ipcRenderer.invoke('storage:save-credentials', credentials),
    getCredentials: () => ipcRenderer.invoke('storage:get-credentials'),
    getDownloadPath: () => ipcRenderer.invoke('storage:get-download-path'),
    setDownloadPath: (p: string) => ipcRenderer.invoke('storage:set-download-path', p),
    getUploadConcurrency: () => ipcRenderer.invoke('storage:get-upload-concurrency'),
    setUploadConcurrency: (n: number) => ipcRenderer.invoke('storage:set-upload-concurrency', n),
    getSyncHistory: () => ipcRenderer.invoke('storage:get-sync-history'),
    appendSyncHistory: (entry: any) => ipcRenderer.invoke('storage:append-sync-history', entry),
    clearSyncHistory: () => ipcRenderer.invoke('storage:clear-sync-history'),
    factoryReset: () => ipcRenderer.invoke('storage:factory-reset')
  },
  dialog: {
    pickFile: () => ipcRenderer.invoke('dialog:pick-file'),
    pickMultipleFiles: () => ipcRenderer.invoke('dialog:pick-multiple-files'),
    pickFolder: () => ipcRenderer.invoke('dialog:pick-folder'),
    pickFolderRecursive: () => ipcRenderer.invoke('dialog:pick-folder-recursive'),
    pickDownloadDir: () => ipcRenderer.invoke('dialog:pick-download-dir'),
    saveKeyFile: (key: string, body: string) => ipcRenderer.invoke('dialog:save-key-file', key, body)
  },
  autoSync: {
    getConfig: () => ipcRenderer.invoke('autosync:get-config'),
    updateConfig: (config: any) => ipcRenderer.invoke('autosync:update-config', config),
    start: () => ipcRenderer.invoke('autosync:start'),
    stop: () => ipcRenderer.invoke('autosync:stop'),
    getStatus: () => ipcRenderer.invoke('autosync:get-status'),
    onStatus: (cb: (data: { status: string; file?: string }) => void) => {
      const listener = (_: any, data: any) => cb(data)
      ipcRenderer.on('autosync:status', listener)
      return () => ipcRenderer.removeListener('autosync:status', listener)
    }
  },
  app: {
    copyToClipboard: (text: string) => ipcRenderer.invoke('app:copy-to-clipboard', text),
    getVersion: () => ipcRenderer.invoke('app:get-version')
  },
  getPathForFile: (file: File): string => {
    try { return webUtils.getPathForFile(file) } catch { return '' }
  }
})
