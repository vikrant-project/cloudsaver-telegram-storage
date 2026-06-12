import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

interface SessionData {
  session: string
  credentials: {
    apiId: number
    apiHash: string
    phoneNumber: string
  }
  encryptedAt: string
}

export interface SyncConfig {
  enabled: boolean
  mode: 'all' | 'custom'
  customPaths: string[]
  fileFilters: {
    enabled: boolean
    extensions: string[]
  }
  excludePatterns: string[]
}

export class StorageService {
  private userDataPath: string
  private sessionFilePath: string
  private credentialsFilePath: string
  private syncConfigFilePath: string
  private encryptionKey: Buffer

  constructor() {
    this.userDataPath = app.getPath('userData')
    this.sessionFilePath = path.join(this.userDataPath, 'session_data.enc')
    this.credentialsFilePath = path.join(this.userDataPath, 'credentials.enc')
    this.syncConfigFilePath = path.join(this.userDataPath, 'sync_config.json')
    
    // Generate encryption key from machine ID
    const machineId = this.getMachineId()
    this.encryptionKey = crypto.scryptSync(machineId, 'cloudsaver-salt', 32)
  }

  private getMachineId(): string {
    // Use a combination of system info as machine ID
    const os = require('os')
    return crypto
      .createHash('sha256')
      .update(os.hostname() + os.platform() + os.arch())
      .digest('hex')
  }

  private encrypt(data: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }

  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  async saveSession(sessionString: string, credentials: any): Promise<void> {
    const sessionData: SessionData = {
      session: sessionString,
      credentials: credentials,
      encryptedAt: new Date().toISOString(),
    }

    const encrypted = this.encrypt(JSON.stringify(sessionData))
    fs.writeFileSync(this.sessionFilePath, encrypted, 'utf8')
  }

  async getSession(): Promise<SessionData | null> {
    if (!fs.existsSync(this.sessionFilePath)) {
      return null
    }

    try {
      const encrypted = fs.readFileSync(this.sessionFilePath, 'utf8')
      const decrypted = this.decrypt(encrypted)
      return JSON.parse(decrypted) as SessionData
    } catch (error) {
      console.error('Failed to read session:', error)
      return null
    }
  }

  async clearSession(): Promise<void> {
    if (fs.existsSync(this.sessionFilePath)) {
      fs.unlinkSync(this.sessionFilePath)
    }
  }

  async saveCredentials(credentials: any): Promise<void> {
    const encrypted = this.encrypt(JSON.stringify(credentials))
    fs.writeFileSync(this.credentialsFilePath, encrypted, 'utf8')
  }

  async getCredentials(): Promise<any | null> {
    if (!fs.existsSync(this.credentialsFilePath)) {
      return null
    }

    try {
      const encrypted = fs.readFileSync(this.credentialsFilePath, 'utf8')
      const decrypted = this.decrypt(encrypted)
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Failed to read credentials:', error)
      return null
    }
  }

  async saveSyncConfig(config: SyncConfig): Promise<void> {
    fs.writeFileSync(this.syncConfigFilePath, JSON.stringify(config, null, 2), 'utf8')
  }

  async getSyncConfig(): Promise<SyncConfig | null> {
    if (!fs.existsSync(this.syncConfigFilePath)) {
      return null
    }

    try {
      const data = fs.readFileSync(this.syncConfigFilePath, 'utf8')
      return JSON.parse(data) as SyncConfig
    } catch (error) {
      console.error('Failed to read sync config:', error)
      return null
    }
  }
}
