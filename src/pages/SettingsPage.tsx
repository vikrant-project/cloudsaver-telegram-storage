import React, { useEffect, useState } from 'react'
import { FolderOpen, Copy, AlertTriangle } from 'lucide-react'

export default function SettingsPage({ channelInfo, onChangeChannel }: { channelInfo: any; onChangeChannel: () => void }) {
  const [downloadPath, setDownloadPath] = useState('')
  const [concurrency, setConcurrency] = useState(2)
  const [autoRename, setAutoRename] = useState(false)
  const [reduceAnim, setReduceAnim] = useState(false)
  const [compact, setCompact] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    (async () => {
      const a = await window.electronAPI.storage.getDownloadPath()
      if (a.success) setDownloadPath(a.data || '')
      const c = await window.electronAPI.storage.getUploadConcurrency()
      if (c.success) setConcurrency(c.data || 2)
      setAutoRename(localStorage.getItem('v2.autoRename') === '1')
      setReduceAnim(localStorage.getItem('v2.reduceAnim') === '1')
      setCompact(localStorage.getItem('v2.compact') === '1')
      if (localStorage.getItem('v2.reduceAnim') === '1') document.body.classList.add('reduce-anim')
      if (localStorage.getItem('v2.compact') === '1') document.body.classList.add('compact')
    })()
  }, [])

  const show = (s: string) => { setToast(s); setTimeout(() => setToast(''), 1800) }

  const pickDownload = async () => {
    const r = await window.electronAPI.dialog.pickDownloadDir()
    if (r.success) {
      setDownloadPath(r.data.folderPath)
      await window.electronAPI.storage.setDownloadPath(r.data.folderPath)
      show('Saved')
    }
  }

  const onConcurrency = async (n: number) => {
    setConcurrency(n)
    await window.electronAPI.storage.setUploadConcurrency(n)
  }

  const toggle = (key: string, val: boolean, cls: string, setter: (v: boolean) => void) => {
    setter(val); localStorage.setItem(key, val ? '1' : '0')
    document.body.classList.toggle(cls, val)
  }

  const copyKey = async () => {
    if (!channelInfo?.token) return
    await window.electronAPI.app.copyToClipboard(channelInfo.token)
    show('Key copied')
  }

  const clearAll = async () => {
    if (!confirm('Clear all local data? You will need to log in again.')) return
    await window.electronAPI.telegram.logout()
    onChangeChannel()
  }
  const factoryReset = async () => {
    if (!confirm('Factory reset will wipe ALL local data. Continue?')) return
    await window.electronAPI.storage.factoryReset()
    localStorage.clear()
    onChangeChannel()
  }

  return (
    <div className="se-root">
      <h1>Settings</h1>

      <section className="se-card">
        <h2>Appearance</h2>
        <label className="se-row"><span>Reduce animations</span>
          <input type="checkbox" checked={reduceAnim} onChange={e => toggle('v2.reduceAnim', e.target.checked, 'reduce-anim', setReduceAnim)} />
        </label>
        <label className="se-row"><span>Compact mode</span>
          <input type="checkbox" checked={compact} onChange={e => toggle('v2.compact', e.target.checked, 'compact', setCompact)} />
        </label>
      </section>

      <section className="se-card">
        <h2>Download Settings</h2>
        <div className="se-row">
          <span>Default download folder</span>
          <div className="se-path"><code>{downloadPath || 'Default'}</code><button onClick={pickDownload}><FolderOpen size={14} /> Change</button></div>
        </div>
      </section>

      <section className="se-card">
        <h2>Upload Settings</h2>
        <label className="se-row"><span>Auto-rename on conflict</span>
          <input type="checkbox" checked={autoRename} onChange={e => { setAutoRename(e.target.checked); localStorage.setItem('v2.autoRename', e.target.checked ? '1' : '0') }} />
        </label>
        <div className="se-row"><span>Upload concurrency</span>
          <input type="number" min={1} max={5} value={concurrency} onChange={e => onConcurrency(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))} style={{ width: 80 }} />
        </div>
      </section>

      <section className="se-card">
        <h2>Channel</h2>
        <div className="se-row"><span>Connected channel</span><strong>{channelInfo?.title || '—'}</strong></div>
        {channelInfo?.token && (
          <div className="se-row"><span>Channel key</span>
            <div className="se-path"><code>{String(channelInfo.token).slice(0, 12)}…</code>
              <button onClick={copyKey}><Copy size={14} /> Copy Key</button></div>
          </div>
        )}
        <button className="se-secondary" onClick={onChangeChannel}>Change Channel</button>
      </section>

      <section className="se-card se-danger">
        <h2><AlertTriangle size={16} /> Danger Zone</h2>
        <button className="se-warn" onClick={clearAll}>Clear All Local Data</button>
        <button className="se-warn" onClick={factoryReset}>Factory Reset</button>
      </section>

      {toast && <div className="mf-toast">{toast}</div>}
    </div>
  )
}
