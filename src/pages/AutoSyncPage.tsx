import React, { useEffect, useState } from 'react'
import { Trash2, X, FolderPlus } from 'lucide-react'

const DEFAULTS = ['Documents', 'Downloads', 'Pictures', 'Desktop']

export default function AutoSyncPage() {
  const [config, setConfig] = useState<any>({
    enabled: false, mode: 'default',
    customPaths: [], fileFilter: { enabled: false, extensions: [] },
    excludePatterns: []
  })
  const [history, setHistory] = useState<any[]>([])
  const [newExt, setNewExt] = useState('')
  const [newExclude, setNewExclude] = useState('')

  const load = async () => {
    const c = await window.electronAPI.autoSync.getConfig()
    if (c.success) setConfig({ ...config, ...c.data })
    const h = await window.electronAPI.storage.getSyncHistory()
    if (h.success) setHistory(h.data || [])
  }
  useEffect(() => { load() }, [])

  const save = async (c: any) => {
    setConfig(c)
    await window.electronAPI.autoSync.updateConfig(c)
    if (c.enabled) await window.electronAPI.autoSync.start()
    else await window.electronAPI.autoSync.stop()
  }

  const addPath = async () => {
    const r = await window.electronAPI.dialog.pickFolder()
    if (r.success) save({ ...config, customPaths: [...(config.customPaths || []), r.data.folderPath] })
  }
  const removePath = (p: string) => save({ ...config, customPaths: config.customPaths.filter((x: string) => x !== p) })

  const addExt = () => {
    const e = newExt.trim().replace(/^\./, '').toLowerCase()
    if (!e) return
    save({ ...config, fileFilter: { ...config.fileFilter, extensions: [...(config.fileFilter?.extensions || []), e] } })
    setNewExt('')
  }
  const addExclude = () => {
    if (!newExclude.trim()) return
    save({ ...config, excludePatterns: [...(config.excludePatterns || []), newExclude.trim()] })
    setNewExclude('')
  }

  const clearHistory = async () => {
    await window.electronAPI.storage.clearSyncHistory()
    setHistory([])
  }

  return (
    <div className="as-root">
      <div className="as-main">
        <div className="as-card as-master">
          <div>
            <h1>Auto-Sync</h1>
            <p>Automatically upload new files in watched folders</p>
          </div>
          <label className="as-toggle">
            <input type="checkbox" checked={!!config.enabled} onChange={e => save({ ...config, enabled: e.target.checked })} />
            <span className="as-toggle-slider" />
          </label>
        </div>

        <div className="as-card">
          <h2>Mode</h2>
          <div className="as-mode">
            <label><input type="radio" checked={config.mode === 'default'} onChange={() => save({ ...config, mode: 'default' })} /> Default folders ({DEFAULTS.join(', ')})</label>
            <label><input type="radio" checked={config.mode === 'custom'} onChange={() => save({ ...config, mode: 'custom' })} /> Custom paths</label>
          </div>

          {config.mode === 'custom' && (
            <div className="as-paths">
              {(config.customPaths || []).map((p: string) => (
                <div key={p} className="as-pill"><span>{p}</span><button onClick={() => removePath(p)}><X size={12} /></button></div>
              ))}
              <button className="as-add" onClick={addPath}><FolderPlus size={14} /> Add folder</button>
            </div>
          )}
        </div>

        <div className="as-card">
          <h2>File filter</h2>
          <label className="as-row">
            <input type="checkbox" checked={!!config.fileFilter?.enabled}
              onChange={e => save({ ...config, fileFilter: { ...(config.fileFilter || {}), enabled: e.target.checked } })} />
            Only sync these extensions
          </label>
          {config.fileFilter?.enabled && (
            <div className="as-tags">
              {(config.fileFilter.extensions || []).map((x: string) => (
                <div key={x} className="as-pill">.{x}
                  <button onClick={() => save({ ...config, fileFilter: { ...config.fileFilter, extensions: config.fileFilter.extensions.filter((y: string) => y !== x) } })}><X size={12} /></button>
                </div>
              ))}
              <input placeholder="pdf" value={newExt} onChange={e => setNewExt(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExt()} />
              <button onClick={addExt}>Add</button>
            </div>
          )}
        </div>

        <div className="as-card">
          <h2>Exclude patterns</h2>
          <div className="as-tags">
            {(config.excludePatterns || []).map((x: string) => (
              <div key={x} className="as-pill">{x}
                <button onClick={() => save({ ...config, excludePatterns: config.excludePatterns.filter((y: string) => y !== x) })}><X size={12} /></button>
              </div>
            ))}
            <input placeholder="*.tmp" value={newExclude} onChange={e => setNewExclude(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExclude()} />
            <button onClick={addExclude}>Add</button>
          </div>
        </div>
      </div>

      <aside className="as-history">
        <div className="as-history-head">
          <h2>Sync History</h2>
          <button onClick={clearHistory}><Trash2 size={14} /></button>
        </div>
        {history.length === 0 ? <div className="as-empty">No events yet</div> : (
          <ul>
            {history.slice(0, 50).map((h, i) => (
              <li key={i} className={'as-hist-' + (h.status || 'info')}>
                <div className="as-hist-name">{h.fileName}</div>
                <div className="as-hist-meta">{new Date(h.timestamp).toLocaleString()} • {h.status}</div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
