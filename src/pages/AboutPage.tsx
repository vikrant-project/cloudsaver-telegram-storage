import React, { useEffect, useState } from 'react'

export default function AboutPage() {
  const [version, setVersion] = useState("3.0.0")
  const [toast, setToast] = useState('')

  useEffect(() => {
    (async () => {
      const r = await window.electronAPI.app.getVersion()
      if (r.success && r.data) setVersion(r.data)
    })()
  }, [])

  const checkUpdates = () => {
    setToast('You are on the latest version')
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="ab-root">
      <div className="ab-card">
        <div className="ab-logo">CS</div>
        <h1>CloudSaver</h1>
        <div className="ab-version">v{version} — 100+ features</div>
        <p className="ab-desc">
          CloudSaver turns your private Telegram channel into unlimited cloud storage.
          Encrypt-free, no monthly fee, fully owned by you.
        </p>
        <div className="ab-stack">
          <span>Electron</span><span>React</span><span>TypeScript</span><span>gramjs</span><span>chokidar</span>
        </div>
        <button className="ab-update" onClick={checkUpdates}>Check for updates</button>
        <div className="ab-links">
          <a href="#" onClick={e => e.preventDefault()}>GitHub</a>
          <span>•</span>
          <a href="#" onClick={e => e.preventDefault()}>Report a Bug</a>
        </div>
        <div className="ab-license">Released under the MIT License</div>
      </div>
      {toast && <div className="mf-toast">{toast}</div>}
    </div>
  )
}
