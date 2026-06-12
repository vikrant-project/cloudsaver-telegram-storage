import React from 'react'

export default function SplashScreen() {
  return (
    <div className="splash-root">
      <div className="splash-bg" />
      <div className="splash-inner">
        <div className="splash-logo">
          <div className="splash-logo-mark">CS</div>
        </div>
        <h1 className="splash-title">CloudSaver</h1>
        <p className="splash-subtitle">Telegram Cloud Storage</p>
        <div className="splash-progress"><div className="splash-progress-fill" /></div>
        <p className="splash-loading">Loading CloudSaver v2&hellip;</p>
        <div className="splash-version">v2.0.0</div>
      </div>
    </div>
  )
}
