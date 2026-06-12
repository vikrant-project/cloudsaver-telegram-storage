import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { Api } from 'telegram/tl'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { app } from 'electron'

type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void; reject: (e: any) => void }

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void
  let reject!: (e: any) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

export class TelegramService {
  private client: TelegramClient | null = null
  private phoneNumber: string = ''
  private apiId: number = 0
  private apiHash: string = ''
  private channelId: bigint | null = null
  private channelToken: string = ''

  // Auth flow state
  private startPromise: Promise<void> | null = null
  private phoneCodeDef: Deferred<string> | null = null
  private passwordDef: Deferred<string> | null = null
  private codeAttempts: number = 0
  private authResolved: boolean = false
  private authError: Error | null = null
  private needs2FA: boolean = false
  private codeRequested: Deferred<void> | null = null
  private passwordRequested: Deferred<void> | null = null

  async startAuth(apiId: number, apiHash: string, phoneNumber: string) {
    // Reset state
    this.apiId = apiId
    this.apiHash = apiHash
    this.phoneNumber = phoneNumber.trim()
    this.codeAttempts = 0
    this.authResolved = false
    this.authError = null
    this.needs2FA = false
    this.phoneCodeDef = deferred<string>()
    this.passwordDef = deferred<string>()
    this.codeRequested = deferred<void>()
    this.passwordRequested = deferred<void>()

    const session = new StringSession('')
    this.client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
      useWSS: false,
    })

    // Lower noisy logs
    try { (this.client as any).setLogLevel?.('error') } catch {}

    // Kick off the long-running start() call. It will await our deferred callbacks.
    this.startPromise = this.client.start({
      phoneNumber: async () => this.phoneNumber,
      phoneCode: async () => {
        // Signal renderer that the code has been sent and we're awaiting input
        if (this.codeRequested && !(this.codeRequested as any)._done) {
          (this.codeRequested as any)._done = true
          this.codeRequested.resolve()
        }
        // Re-create deferred for retries
        if (!this.phoneCodeDef || (this.phoneCodeDef as any)._used) {
          this.phoneCodeDef = deferred<string>()
        }
        ;(this.phoneCodeDef as any)._used = true
        const code = await this.phoneCodeDef.promise
        return code
      },
      password: async () => {
        this.needs2FA = true
        if (this.passwordRequested && !(this.passwordRequested as any)._done) {
          (this.passwordRequested as any)._done = true
          this.passwordRequested.resolve()
        }
        if (!this.passwordDef || (this.passwordDef as any)._used) {
          this.passwordDef = deferred<string>()
        }
        ;(this.passwordDef as any)._used = true
        const pwd = await this.passwordDef.promise
        return pwd
      },
      onError: (err: any) => {
        console.error('[telegram.start onError]', err?.errorMessage || err?.message || err)
        // Returning false lets gramjs re-prompt for phoneCode/password on recoverable errors
        return false
      },
    })
      .then(() => {
        this.authResolved = true
      })
      .catch((err: any) => {
        this.authError = err instanceof Error ? err : new Error(String(err))
        this.authResolved = true
      })

    // Wait until the code has been sent and gramjs is ready to receive it
    await Promise.race([
      this.codeRequested.promise,
      this.startPromise.then(() => {
        if (this.authError) throw this.authError
      }),
    ])

    return { success: true, codeSent: true }
  }

  async verifyCode(code: string) {
    if (!this.client || !this.phoneCodeDef) {
      throw new Error('Auth flow not started')
    }
    const cleaned = String(code).replace(/\s+/g, '').trim()
    if (!/^\d{4,8}$/.test(cleaned)) {
      return { success: false, needs2FA: false, error: 'Code must be 4-8 digits' }
    }

    this.codeAttempts += 1

    // Provide the code to gramjs
    const currentDef = this.phoneCodeDef
    currentDef.resolve(cleaned)

    // Wait for one of: auth fully resolved (success), password requested (2FA), or new code requested (invalid code)
    const oldPasswordReqDone = (this.passwordRequested as any)?._done
    const winner = await Promise.race([
      this.startPromise!.then(() => 'done'),
      (async () => {
        // Watch for password being requested
        while (!this.authResolved && !((this.passwordRequested as any)?._done) && (this.phoneCodeDef === currentDef)) {
          await new Promise((r) => setTimeout(r, 50))
        }
        if ((this.passwordRequested as any)?._done && !oldPasswordReqDone) return '2fa'
        if (this.phoneCodeDef !== currentDef) return 'reprompt'
        return 'done'
      })(),
    ])

    if (winner === 'done' || this.authResolved) {
      if (this.authError) {
        const msg = (this.authError as any).errorMessage || this.authError.message || 'Authentication failed'
        if (msg.includes('PHONE_CODE_INVALID') || msg.includes('PHONE_CODE_EXPIRED')) {
          return { success: false, needs2FA: false, error: 'Invalid or expired verification code', attemptsLeft: Math.max(0, 3 - this.codeAttempts) }
        }
        return { success: false, needs2FA: false, error: msg }
      }
      return { success: true, needs2FA: false }
    }

    if (winner === '2fa') {
      return { success: false, needs2FA: true }
    }

    // reprompt -> code was invalid, gramjs is asking again
    return {
      success: false,
      needs2FA: false,
      error: 'Invalid or expired verification code',
      attemptsLeft: Math.max(0, 3 - this.codeAttempts),
    }
  }

  async verify2FA(password: string) {
    if (!this.client || !this.passwordDef) {
      throw new Error('Auth flow not started')
    }
    this.passwordDef.resolve(password)

    // Wait for start() to fully resolve
    await this.startPromise

    if (this.authError) {
      const msg = (this.authError as any).errorMessage || this.authError.message || ''
      if (msg.includes('PASSWORD_HASH_INVALID')) {
        return { success: false, error: 'Incorrect 2FA password' }
      }
      return { success: false, error: msg || '2FA verification failed' }
    }

    return { success: true }
  }

  async createNewChannel() {
    if (!this.client) throw new Error('Client not initialized')
    this.channelToken = crypto.randomBytes(16).toString('hex')
    const channelName = `cloudsaver_${this.channelToken}`
    const result: any = await this.client.invoke(
      new Api.channels.CreateChannel({
        title: channelName,
        about: 'CloudSaver Storage Channel',
        megagroup: false,
      })
    )
    if (result.chats && result.chats.length > 0) {
      const channel = result.chats[0] as any
      this.channelId = BigInt(channel.id.toString())
      return {
        channelId: this.channelId.toString(),
        channelToken: this.channelToken,
        channelName,
      }
    }
    throw new Error('Failed to create channel')
  }

  async findChannelByToken(token: string) {
    if (!this.client) throw new Error('Client not initialized')
    const wanted = `cloudsaver_${token}`
    const dialogs = await this.client.getDialogs({ limit: 500 })
    for (const dialog of dialogs) {
      const entity = dialog.entity as any
      if (entity?.title && entity.title === wanted) {
        this.channelId = BigInt(entity.id.toString())
        this.channelToken = token
        return {
          channelId: this.channelId.toString(),
          channelToken: token,
          channelName: wanted,
        }
      }
    }
    throw new Error('No CloudSaver channel found for that key')
  }

  async createPrivateChannel() {
    if (!this.client) throw new Error('Client not initialized')

    // Check if a cloudsaver_ channel already exists
    try {
      const dialogs = await this.client.getDialogs({ limit: 200 })
      for (const dialog of dialogs) {
        const entity = dialog.entity as any
        if (entity?.title && typeof entity.title === 'string' && entity.title.startsWith('cloudsaver_')) {
          this.channelId = BigInt(entity.id.toString())
          this.channelToken = entity.title.replace('cloudsaver_', '')
          return {
            channelId: this.channelId.toString(),
            channelToken: this.channelToken,
            channelName: entity.title,
          }
        }
      }
    } catch (e) {
      console.warn('Dialog scan failed, creating new channel:', (e as Error).message)
    }

    this.channelToken = crypto.randomBytes(16).toString('hex')
    const channelName = `cloudsaver_${this.channelToken}`

    const result: any = await this.client.invoke(
      new Api.channels.CreateChannel({
        title: channelName,
        about: 'CloudSaver Storage Channel',
        megagroup: false,
      })
    )

    if (result.chats && result.chats.length > 0) {
      const channel = result.chats[0] as any
      this.channelId = BigInt(channel.id.toString())
      return {
        channelId: this.channelId.toString(),
        channelToken: this.channelToken,
        channelName,
      }
    }
    throw new Error('Failed to create channel')
  }

  async reconnect(sessionString: string, apiId: number, apiHash: string) {
    this.apiId = apiId
    this.apiHash = apiHash

    const session = new StringSession(sessionString)
    this.client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 })
    await this.client.connect()

    const dialogs = await this.client.getDialogs({ limit: 200 })
    for (const dialog of dialogs) {
      const entity = dialog.entity as any
      if (entity?.title && typeof entity.title === 'string' && entity.title.startsWith('cloudsaver_')) {
        this.channelId = BigInt(entity.id.toString())
        this.channelToken = entity.title.replace('cloudsaver_', '')
        return {
          channelId: this.channelId.toString(),
          channelToken: this.channelToken,
          channelName: entity.title,
        }
      }
    }
    // No channel? Create one.
    return await this.createPrivateChannel()
  }

  async uploadFile(filePath: string, onProgress?: (sent: number, total: number) => void) {
    if (!this.client || !this.channelId) throw new Error('Client not initialized or channel not found')

    const fileStats = fs.statSync(filePath)
    const fileName = path.basename(filePath)
    const sizeBytes = fileStats.size
    const TWO_GB = 2 * 1024 * 1024 * 1024

    if (sizeBytes > TWO_GB) {
      throw new Error('File splitting not implemented yet. Files must be under 2GB.')
    }

    const result = await this.client.sendFile(this.channelId as any, {
      file: filePath,
      caption: `${fileName}\nSize: ${this.formatFileSize(sizeBytes)}\nUploaded: ${new Date().toISOString()}`,
      forceDocument: true,
      workers: 4,
      progressCallback: (progress: any, total: any) => {
        try {
          const sent = typeof progress === 'number' ? progress : Number(progress?.toString?.() ?? 0)
          const tot = typeof total === 'number' ? total : Number(total?.toString?.() ?? sizeBytes)
          onProgress?.(sent, tot || sizeBytes)
        } catch (err) {
          console.error('Progress callback error:', err)
        }
      },
    } as any)

    return {
      messageId: typeof (result as any).id === 'object' ? Number((result as any).id.toString()) : (result as any).id,
      fileName,
      fileSize: sizeBytes,
      uploadedAt: new Date().toISOString(),
    }
  }

  async listFiles() {
    if (!this.client || !this.channelId) throw new Error('Client not initialized or channel not found')
    const messages = await this.client.getMessages(this.channelId as any, { limit: 200 })
    const toNum = (v: any): number => {
      if (v == null) return 0
      if (typeof v === 'number') return v
      if (typeof v === 'bigint') return Number(v)
      if (typeof v === 'string') return Number(v)
      if (typeof v === 'object' && typeof v.toString === 'function') {
        const n = Number(v.toString())
        return isFinite(n) ? n : 0
      }
      return 0
    }
    return messages
      .filter((m: any) => m.file)
      .map((m: any) => ({
        messageId: typeof m.id === 'object' ? Number(m.id.toString()) : m.id,
        fileName: m.file?.name || 'Unknown',
        fileSize: toNum(m.file?.size),
        mimeType: m.file?.mimeType || 'application/octet-stream',
        uploadedAt: typeof m.date === 'number' ? m.date : toNum(m.date),
        caption: m.message || '',
      }))
  }

  async downloadFile(messageId: number, fileName: string) {
    if (!this.client || !this.channelId) throw new Error('Client not initialized or channel not found')
    const messages = await this.client.getMessages(this.channelId as any, { ids: [messageId] })
    if (!messages || messages.length === 0) throw new Error('Message not found')
    const message: any = messages[0]
    if (!message.file) throw new Error('No file attached to message')
    const downloadsPath = app.getPath('downloads')
    const downloadPath = path.join(downloadsPath, fileName)
    await this.client.downloadMedia(message, { outputFile: downloadPath } as any)
    return { filePath: downloadPath, fileName }
  }

  async deleteFile(messageId: number) {
    if (!this.client || !this.channelId) throw new Error('Client not initialized or channel not found')
    await this.client.invoke(
      new Api.channels.DeleteMessages({ channel: this.channelId as any, id: [messageId] })
    )
  }

  async logout() {
    if (this.client) {
      try { await this.client.invoke(new Api.auth.LogOut()) } catch {}
      try { await this.client.disconnect() } catch {}
      this.client = null
    }
  }

  getSessionString(): string {
    if (!this.client) throw new Error('Client not initialized')
    return this.client.session.save() as any
  }

  getCredentials() {
    return { apiId: this.apiId, apiHash: this.apiHash, phoneNumber: this.phoneNumber }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}
