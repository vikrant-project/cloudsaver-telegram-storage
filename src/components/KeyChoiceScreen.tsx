import React, { useState, useEffect } from 'react'
import iconUrl from '../assets/icon.png'
import '../styles/login.css'

interface KeyChoiceScreenProps {
  onComplete: (channelData: any) => void
}

const WHY_CHOOSE_US = `Why choose CloudSaver?

CloudSaver is built for people who refuse to choose between privacy, reliability and price. Most consumer cloud-storage products force a hard trade-off: you either pay a recurring subscription that gets more expensive every year, or you accept arbitrary quotas, aggressive scanning of your personal files, and a constant stream of "upgrade now" prompts. CloudSaver takes a different path. It treats your own private Telegram channel as the storage backend, and turns this Electron desktop application into a fast, polished file manager that sits on top of it. The result is a cloud locker that you genuinely own, that you can move between devices effortlessly, and that you never have to renew.

The first reason customers stay with CloudSaver is the economics. Telegram offers an enormous personal-use allowance for free, and CloudSaver leverages that allowance directly. There is no monthly bill, no annual auto-renewal trap, and no credit card hostage situation. As long as you have a Telegram account and an internet connection, you have storage. Whether you upload a single text note or terabytes of family videos over time, the cost stays the same: zero. For freelancers, students, hobbyist photographers, indie game developers, archivists and anyone with an active digital life, this single fact is transformative.

The second reason is privacy. Every file you push through CloudSaver lands in a private channel that only you can see. You are not handing your data to a third-party startup that may pivot, get acquired, or quietly change its terms of service next quarter. Telegram already provides the encrypted transport, the global infrastructure, and the user identity. CloudSaver simply gives you a beautiful native window into that infrastructure and adds AES-256-CBC encryption on the local session metadata so even somebody with full access to your computer cannot trivially extract your login state. Your API credentials, your StringSession and your channel token are all encrypted at rest using a key derived from your machine fingerprint - no plaintext, no telemetry, no analytics calls home.

The third reason is portability. Traditional cloud accounts tie you to one vendor. If you ever want to leave Dropbox, Google Drive or iCloud, you face the painful task of bulk-downloading gigabytes, then re-uploading everything to a competitor. CloudSaver flips that model entirely. Your files live in a Telegram channel that you control. The application identifies that channel through a single 32-character token - the "key" - and that key is the only thing you need to bring with you. Reinstall Windows, switch to a new laptop, hand the application to a colleague: paste the key, sign in, and the same library of files appears instantly on the other side. You are never locked in. You are always one short string away from your entire archive.

The fourth reason is reliability. Telegram operates a globally distributed datacenter network with extremely high uptime. CloudSaver inherits that reliability. There is no single CloudSaver server you can DDoS, no backend startup that can run out of runway and shut down. The application is a thin, transparent client. As long as the official Telegram protocol keeps working, your files keep working. We use the official MTProto-based gramjs library with the recommended StringSession persistence pattern, retry-with-backoff on transient errors, and graceful handling of expired or invalid verification codes so you never get stuck in a broken auth state.

The fifth reason is the user experience. CloudSaver is not a command-line script bolted onto a Telegram bot - it is a real desktop application with a polished glass-morphism interface, drag-and-drop uploads, native open-file dialogs, search, file previews, dark mode, keyboard shortcuts and a clean, distraction-free file list. The login flow respects you: it asks for your API credentials only once, persists them encrypted, and gives you a clear, step-by-step path through phone verification, OTP and optional 2FA. After authentication you are presented with a simple choice: continue with an existing key to recover your previous library, or start fresh with a brand-new private channel. Either way, the experience is finished in under a minute.

The sixth reason is auditability. Because your files are stored as messages inside a Telegram channel that you can open in the official Telegram app at any time, you always have a second, completely independent way to verify that the data is intact. You can scroll the channel on your phone, search by file name, forward an item to a friend, or download a single attachment without launching CloudSaver at all. No other consumer cloud product gives you that kind of out-of-band, no-code, vendor-independent escape hatch.

The seventh reason is openness about limits. We don't pretend to be magic. Telegram caps individual files at two gigabytes, so CloudSaver tells you that up front. Files larger than two gigabytes are split client-side into 1.9 GB parts and rejoined automatically on download, so the limit is mostly invisible in practice. Videos can optionally be wrapped in a ZIP container before splitting to keep their internal frame index intact. We document every constraint in the README so you can plan your workflow with full information.

The eighth reason is local-first thinking. Downloads land in your Windows Downloads folder using the native filesystem APIs - not in some hidden application sandbox. You can move, rename, back up or further encrypt your files using whatever tools you already trust. CloudSaver stays out of your way once your data hits disk.

Finally, CloudSaver is honest about what it is. It is a focused, single-purpose tool. It does not try to be a photo editor, a chat client, a note-taking app, a video conferencing platform or an AI assistant. It does one job - turn Telegram into a personal cloud locker - and it tries to do that job better than anything else available. If that is the job you need done, we would love to have you as a user.

Treat your CloudSaver key the way you would treat the master password of a password manager: write it down, keep it offline, never share it. With that one string and your Telegram account, your storage follows you everywhere.`

const KeyChoiceScreen: React.FC<KeyChoiceScreenProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<'choose' | 'enter-key' | 'show-key'>('choose')
  const [keyInput, setKeyInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedKey, setGeneratedKey] = useState('')
  const [pendingChannelData, setPendingChannelData] = useState<any>(null)

  const handleHaveKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const key = keyInput.trim()
    if (!/^[a-f0-9]{32}$/i.test(key)) {
      setError('Invalid key format. Key must be 32 hexadecimal characters.')
      return
    }
    setLoading(true)
    try {
      const result = await (window as any).electronAPI.telegram.setupExistingChannel(key)
      if (result.success) {
        onComplete(result.data)
      } else {
        setError(result.error || 'Channel for that key was not found in your Telegram dialogs.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find channel')
    } finally {
      setLoading(false)
    }
  }

  const handleNewUser = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await (window as any).electronAPI.telegram.setupNewChannel()
      if (result.success) {
        setGeneratedKey(result.data.channelToken)
        setPendingChannelData(result.data)
        setMode('show-key')
      } else {
        setError(result.error || 'Failed to create channel')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create channel')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadKey = async () => {
    const result = await (window as any).electronAPI.dialog.saveKeyFile(generatedKey, WHY_CHOOSE_US)
    if (result.success) {
      alert(`Key saved to:\n${result.data.filePath}`)
    } else {
      alert('Failed to save key file: ' + (result.error || ''))
    }
  }

  const handleContinue = () => {
    if (pendingChannelData) onComplete(pendingChannelData)
  }

  return (
    <div className="login-container fade-in">
      <div className="login-box glass-card">
        <div className="login-header">
          <div className="logo-container">
            <img src={iconUrl} alt="CloudSaver" className="logo-img" />
          </div>
          <h1 className="login-title">
            Cloud<span className="text-gradient">Saver</span>
          </h1>
          <p className="login-subtitle">
            {mode === 'choose' && 'Welcome back. How would you like to continue?'}
            {mode === 'enter-key' && 'Enter your CloudSaver key to restore your library'}
            {mode === 'show-key' && 'Save this key. You will need it to sign in on another device.'}
          </p>
        </div>

        {error && (
          <div className="error-box" data-testid="key-error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {mode === 'choose' && (
          <div className="login-form">
            <button
              className="glass-button glass-button-primary"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={() => setMode('enter-key')}
              data-testid="key-have-existing-button"
              disabled={loading}
            >
              I have a key
            </button>
            <button
              className="glass-button"
              style={{ width: '100%' }}
              onClick={handleNewUser}
              data-testid="key-new-user-button"
              disabled={loading}
            >
              {loading ? 'Creating channel...' : "I'm a new user"}
            </button>
          </div>
        )}

        {mode === 'enter-key' && (
          <form className="login-form" onSubmit={handleHaveKey}>
            <div className="form-group">
              <label className="form-label">CloudSaver key</label>
              <input
                type="text"
                className="glass-input"
                placeholder="32-character hex key"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                data-testid="key-input"
                autoFocus
              />
              <p className="form-hint">Paste the key you saved when you first created your account.</p>
            </div>
            <button
              type="submit"
              className="glass-button glass-button-primary"
              style={{ width: '100%' }}
              disabled={loading}
              data-testid="key-submit-button"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
            <button
              type="button"
              className="glass-button"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => { setMode('choose'); setError('') }}
            >
              Back
            </button>
          </form>
        )}

        {mode === 'show-key' && (
          <div className="login-form">
            <div className="form-group">
              <label className="form-label">Your CloudSaver key (shown once)</label>
              <div
                className="glass-input"
                style={{ wordBreak: 'break-all', userSelect: 'all', fontFamily: 'monospace', padding: '12px 16px' }}
                data-testid="key-display"
              >
                {generatedKey}
              </div>
              <p className="form-hint" style={{ color: '#ffcc66' }}>
                Write this key down or download the text file below. You will not be able to see it again. If you lose it,
                you will lose access to the files in this channel.
              </p>
            </div>
            <button
              className="glass-button glass-button-primary"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={handleDownloadKey}
              data-testid="key-download-button"
            >
              Download cloudsave.txt
            </button>
            <button
              className="glass-button"
              style={{ width: '100%' }}
              onClick={handleContinue}
              data-testid="key-continue-button"
            >
              I have saved my key, continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default KeyChoiceScreen
