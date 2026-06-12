import React, { useState, useEffect } from 'react'
import iconUrl from '../assets/icon.png'
import '../styles/login.css'

interface LoginScreenProps {
  onLoginSuccess: (channelData: any) => void
}

type Step = 'credentials' | 'phone' | 'code' | '2fa'

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<Step>('credentials')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [apiId, setApiId] = useState('')
  const [apiHash, setApiHash] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [saveCredentials, setSaveCredentials] = useState(true)

  useEffect(() => {
    loadSavedCredentials()
  }, [])

  const loadSavedCredentials = async () => {
    try {
      const result = await window.electronAPI.storage.getCredentials()
      if (result.success && result.data) {
        setApiId(result.data.apiId || '')
        setApiHash(result.data.apiHash || '')
      }
    } catch (err) {
      console.error('Failed to load credentials:', err)
    }
  }

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!apiId || !apiHash) {
      setError('Please enter both API ID and API Hash')
      return
    }

    if (saveCredentials) {
      try {
        await window.electronAPI.storage.saveCredentials({
          apiId: parseInt(apiId),
          apiHash: apiHash,
        })
      } catch (err) {
        console.error('Failed to save credentials:', err)
      }
    }

    setStep('phone')
  }

  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await window.electronAPI.telegram.login({
        apiId: parseInt(apiId),
        apiHash: apiHash,
        phoneNumber: phoneNumber,
      })

      if (result.success) {
        setStep('code')
      } else {
        setError(result.error || 'Failed to send verification code')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await window.electronAPI.telegram.verifyCode(code)

      if (result.success) {
        onLoginSuccess({ needsKeyChoice: true })
      } else if (result.needs2FA) {
        setStep('2fa')
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await window.electronAPI.telegram.verify2FA(password)

      if (result.success) {
        onLoginSuccess({ needsKeyChoice: true })
      } else {
        setError(result.error || 'Invalid 2FA password')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container fade-in">
      <div className="login-box glass-card">
        {/* Logo & Title */}
        <div className="login-header">
          <div className="logo-container">
            <img src={iconUrl} alt="CloudSaver" className="logo-img" />
          </div>
          <h1 className="login-title">
            Cloud<span className="text-gradient">Saver</span>
          </h1>
          <p className="login-subtitle">Telegram Cloud Storage for Your Files</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-box" data-testid="login-error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: API Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleSubmitCredentials} className="login-form">
            <div className="form-group">
              <label htmlFor="apiId" className="form-label">
                API ID
              </label>
              <input
                id="apiId"
                type="text"
                className="glass-input"
                placeholder="Enter your API ID"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                data-testid="login-api-id-input"
              />
              <p className="form-hint">
                Get your API credentials from{' '}
                <a
                  href="https://my.telegram.org/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="form-link"
                >
                  my.telegram.org/apps
                </a>
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="apiHash" className="form-label">
                API Hash
              </label>
              <input
                id="apiHash"
                type="text"
                className="glass-input"
                placeholder="Enter your API Hash"
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                data-testid="login-api-hash-input"
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="saveCredentials"
                checked={saveCredentials}
                onChange={(e) => setSaveCredentials(e.target.checked)}
                className="glass-checkbox"
              />
              <label htmlFor="saveCredentials" className="checkbox-label">
                Save API credentials locally (encrypted)
              </label>
            </div>

            <button
              type="submit"
              className="glass-button glass-button-primary submit-button"
              data-testid="login-credentials-submit-button"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Phone Number */}
        {step === 'phone' && (
          <form onSubmit={handleSubmitPhone} className="login-form">
            <button
              type="button"
              className="back-button"
              onClick={() => setStep('credentials')}
              data-testid="login-back-button"
            >
              ← Back
            </button>

            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className="glass-input"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="login-phone-input"
              />
              <p className="form-hint">Include country code (e.g., +1 for US)</p>
            </div>

            <button
              type="submit"
              className="glass-button glass-button-primary submit-button"
              disabled={loading}
              data-testid="login-phone-submit-button"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 3: Verification Code */}
        {step === 'code' && (
          <form onSubmit={handleSubmitCode} className="login-form">
            <button
              type="button"
              className="back-button"
              onClick={() => setStep('phone')}
              data-testid="login-back-button-code"
            >
              ← Back
            </button>

            <div className="form-group">
              <label htmlFor="code" className="form-label">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                className="glass-input code-input"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={5}
                data-testid="login-code-input"
              />
              <p className="form-hint">Check your Telegram app for the code</p>
            </div>

            <button
              type="submit"
              className="glass-button glass-button-primary submit-button"
              disabled={loading}
              data-testid="login-code-submit-button"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {/* Step 4: 2FA Password */}
        {step === '2fa' && (
          <form onSubmit={handleSubmit2FA} className="login-form">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Two-Factor Authentication
              </label>
              <input
                id="password"
                type="password"
                className="glass-input"
                placeholder="Enter your 2FA password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-2fa-input"
              />
              <p className="form-hint">Your Telegram Cloud Password</p>
            </div>

            <button
              type="submit"
              className="glass-button glass-button-primary submit-button"
              disabled={loading}
              data-testid="login-2fa-submit-button"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p>
            🔒 All data is encrypted and stored locally on your device
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
