export {}

declare global {
  interface Window {
    electronAPI: {
      telegram: {
        checkSession: () => Promise<{ success: boolean; hasSession?: boolean; error?: string }>
        login: (data: { apiId: number; apiHash: string; phoneNumber: string }) => Promise<{ success: boolean; data?: any; error?: string }>
        verifyCode: (code: string) => Promise<{ success: boolean; data?: any; error?: string }>
        verify2FA: (password: string) => Promise<{ success: boolean; data?: any; error?: string }>
        reconnect: () => Promise<{ success: boolean; data?: any; error?: string }>
        uploadFile: (filePath: string, id?: string) => Promise<{ success: boolean; data?: any; error?: string }>
        onUploadProgress: (cb: (data: { id?: string; sent: number; total: number; percent: number }) => void) => () => void
        onBulkProgress: (cb: (data: { kind: string; index: number; total: number }) => void) => () => void
        listFiles: () => Promise<{ success: boolean; data?: any[]; error?: string }>
        downloadFile: (messageId: number, fileName: string) => Promise<{ success: boolean; data?: any; error?: string }>
        deleteFile: (messageId: number) => Promise<{ success: boolean; error?: string }>
        bulkDownload: (items: Array<{ messageId: number; fileName: string }>) => Promise<{ success: boolean; data?: any; error?: string }>
        bulkDelete: (ids: number[]) => Promise<{ success: boolean; data?: any; error?: string }>
        logout: () => Promise<{ success: boolean; error?: string }>
        setupNewChannel: () => Promise<{ success: boolean; data?: any; error?: string }>
        setupExistingChannel: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>
      }
      storage: {
        saveCredentials: (credentials: any) => Promise<{ success: boolean; error?: string }>
        getCredentials: () => Promise<{ success: boolean; data?: any; error?: string }>
        getDownloadPath: () => Promise<{ success: boolean; data?: string; error?: string }>
        setDownloadPath: (p: string) => Promise<{ success: boolean; error?: string }>
        getUploadConcurrency: () => Promise<{ success: boolean; data?: number; error?: string }>
        setUploadConcurrency: (n: number) => Promise<{ success: boolean; error?: string }>
        getSyncHistory: () => Promise<{ success: boolean; data?: any[]; error?: string }>
        appendSyncHistory: (entry: any) => Promise<{ success: boolean; error?: string }>
        clearSyncHistory: () => Promise<{ success: boolean; error?: string }>
        factoryReset: () => Promise<{ success: boolean; error?: string }>
      }
      dialog: {
        pickFile: () => Promise<{ success: boolean; data?: { filePath: string; fileName: string; fileSize: number }; error?: string }>
        pickMultipleFiles: () => Promise<{ success: boolean; data?: Array<{ filePath: string; fileName: string; fileSize: number }>; error?: string }>
        pickFolder: () => Promise<{ success: boolean; data?: { folderPath: string }; error?: string }>
        pickFolderRecursive: () => Promise<{ success: boolean; data?: { folderPath: string; files: Array<{ filePath: string; fileName: string; fileSize: number }> }; error?: string }>
        pickDownloadDir: () => Promise<{ success: boolean; data?: { folderPath: string }; error?: string }>
        saveKeyFile: (key: string, body: string) => Promise<{ success: boolean; data?: { filePath: string }; error?: string }>
      }
      autoSync: {
        getConfig: () => Promise<{ success: boolean; data?: any; error?: string }>
        updateConfig: (config: any) => Promise<{ success: boolean; error?: string }>
        start: () => Promise<{ success: boolean; error?: string }>
        stop: () => Promise<{ success: boolean; error?: string }>
        getStatus: () => Promise<{ success: boolean; data?: any; error?: string }>
        onStatus: (callback: (data: { status: string; file?: string }) => void) => () => void
      }
      app: {
        copyToClipboard: (text: string) => Promise<{ success: boolean; error?: string }>
        getVersion: () => Promise<{ success: boolean; data?: string; error?: string }>
      }
      getPathForFile: (file: File) => string
    }
  }
}
