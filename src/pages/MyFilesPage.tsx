import React, { useEffect, useMemo, useState } from 'react'
import { Search, Grid, List as ListIcon, Download, Trash2, Copy, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react'

function fmtSize(n: number) {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; let v = n
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return v.toFixed(v < 10 && i > 0 ? 1 : 0) + ' ' + u[i]
}
function typeOf(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'Images'
  if (['mp4', 'mov', 'mkv', 'avi', 'webm'].includes(ext)) return 'Videos'
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'Audio'
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext)) return 'Documents'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Archives'
  return 'Others'
}

const PER_PAGE = 50

export default function MyFilesPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'size' | 'date'>('date')
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<{ idx: number } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [toast, setToast] = useState<string>('')

  const load = async () => {
    setLoading(true)
    const r = await window.electronAPI.telegram.listFiles()
    if (r.success) setFiles(r.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let arr = [...files]
    if (search) arr = arr.filter(f => (f.fileName || '').toLowerCase().includes(search.toLowerCase()))
    if (filter !== 'All') arr = arr.filter(f => typeOf(f.fileName || '') === filter)
    arr.sort((a, b) => {
      if (sort === 'name') return (a.fileName || '').localeCompare(b.fileName || '')
      if (sort === 'size') return (b.fileSize || 0) - (a.fileSize || 0)
      return (b.date || 0) - (a.date || 0)
    })
    return arr
  }, [files, search, sort, filter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const showToast = (s: string) => { setToast(s); setTimeout(() => setToast(''), 1800) }

  const toggleSelect = (id: number) => {
    const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s)
  }
  const selectAllPage = () => {
    const s = new Set(selected); pageItems.forEach(f => s.add(f.messageId)); setSelected(s)
  }
  const clearSelection = () => setSelected(new Set())

  const handleDownload = async (f: any) => {
    showToast('Downloading ' + f.fileName)
    const r = await window.electronAPI.telegram.downloadFile(f.messageId, f.fileName)
    showToast(r.success ? 'Saved: ' + (r.data?.filePath || f.fileName) : 'Download failed')
  }
  const handleDelete = async (f: any) => {
    if (!confirm('Delete ' + f.fileName + '?')) return
    const r = await window.electronAPI.telegram.deleteFile(f.messageId)
    if (r.success) { showToast('Deleted'); load() } else showToast('Delete failed')
  }
  const handleCopyLink = async (f: any) => {
    const link = `https://t.me/c/${f.chatId || ''}/${f.messageId}`
    await window.electronAPI.app.copyToClipboard(link)
    showToast('Link copied')
  }
  const handlePreview = async (f: any, idx: number) => {
    if (typeOf(f.fileName) !== 'Images') return
    setPreview({ idx })
    const r = await window.electronAPI.telegram.downloadFile(f.messageId, f.fileName)
    if (r.success && r.data?.filePath) setPreviewUrl('file://' + r.data.filePath)
  }
  const navPreview = (dir: number) => {
    if (!preview) return
    const imgs = filtered.map((f, i) => ({ f, i })).filter(x => typeOf(x.f.fileName) === 'Images')
    if (imgs.length === 0) return
    const curr = imgs.findIndex(x => x.i === preview.idx)
    const next = (curr + dir + imgs.length) % imgs.length
    setPreviewUrl(''); handlePreview(imgs[next].f, imgs[next].i)
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} files?`)) return
    showToast('Deleting…')
    await window.electronAPI.telegram.bulkDelete(Array.from(selected))
    clearSelection(); load()
  }
  const bulkDownload = async () => {
    if (selected.size === 0) return
    const items = files.filter(f => selected.has(f.messageId)).map(f => ({ messageId: f.messageId, fileName: f.fileName }))
    showToast('Downloading ' + items.length + ' files…')
    await window.electronAPI.telegram.bulkDownload(items)
    showToast('Bulk download complete')
  }

  return (
    <div className="mf-root">
      <div className="mf-toolbar">
        <div className="mf-search">
          <Search size={16} />
          <input placeholder="Search files…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}>
          {['All', 'Images', 'Documents', 'Videos', 'Audio', 'Archives', 'Others'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="date">Newest</option>
          <option value="name">Name</option>
          <option value="size">Largest</option>
        </select>
        <div className="mf-view-toggle">
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Grid size={16} /></button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><ListIcon size={16} /></button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mf-bulkbar">
          <span>{selected.size} selected</span>
          <button onClick={bulkDownload}><Download size={14} /> Download</button>
          <button className="danger" onClick={bulkDelete}><Trash2 size={14} /> Delete</button>
          <button onClick={clearSelection}>Clear</button>
        </div>
      )}

      {loading ? <div className="mf-empty">Loading…</div> : filtered.length === 0 ? <div className="mf-empty">No files</div> : view === 'grid' ? (
        <div className="mf-grid">
          {pageItems.map((f, i) => (
            <div key={f.messageId} className={'mf-card' + (selected.has(f.messageId) ? ' selected' : '')}>
              <input type="checkbox" className="mf-check" checked={selected.has(f.messageId)} onChange={() => toggleSelect(f.messageId)} />
              <div className="mf-card-icon" data-type={typeOf(f.fileName)}>{(f.fileName.split('.').pop() || '?').slice(0, 4).toUpperCase()}</div>
              <div className="mf-card-name" title={f.fileName}>{f.fileName}</div>
              <div className="mf-card-meta">{fmtSize(f.fileSize)} • {new Date((f.date || 0) * 1000).toLocaleDateString()}</div>
              <div className="mf-card-actions">
                <button title="Download" onClick={() => handleDownload(f)}><Download size={14} /></button>
                {typeOf(f.fileName) === 'Images' && <button title="Preview" onClick={() => handlePreview(f, (page - 1) * PER_PAGE + i)}><Eye size={14} /></button>}
                <button title="Copy link" onClick={() => handleCopyLink(f)}><Copy size={14} /></button>
                <button title="Delete" className="danger" onClick={() => handleDelete(f)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="mf-table">
          <thead><tr>
            <th><input type="checkbox" onChange={selectAllPage} /></th>
            <th>Name</th><th>Type</th><th>Size</th><th>Date</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {pageItems.map((f, i) => (
              <tr key={f.messageId} className={selected.has(f.messageId) ? 'selected' : ''}>
                <td><input type="checkbox" checked={selected.has(f.messageId)} onChange={() => toggleSelect(f.messageId)} /></td>
                <td className="ellip" title={f.fileName}>{f.fileName}</td>
                <td>{typeOf(f.fileName)}</td>
                <td>{fmtSize(f.fileSize)}</td>
                <td>{new Date((f.date || 0) * 1000).toLocaleDateString()}</td>
                <td>
                  <button title="Download" onClick={() => handleDownload(f)}><Download size={14} /></button>
                  {typeOf(f.fileName) === 'Images' && <button title="Preview" onClick={() => handlePreview(f, (page - 1) * PER_PAGE + i)}><Eye size={14} /></button>}
                  <button title="Copy link" onClick={() => handleCopyLink(f)}><Copy size={14} /></button>
                  <button title="Delete" className="danger" onClick={() => handleDelete(f)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pageCount > 1 && (
        <div className="mf-pager">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></button>
          <span>Page {page} of {pageCount}</span>
          <button disabled={page === pageCount} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></button>
        </div>
      )}

      {preview && (
        <div className="mf-modal" onClick={() => setPreview(null)}>
          <button className="mf-modal-close" onClick={() => setPreview(null)}><X size={18} /></button>
          <button className="mf-modal-nav left" onClick={(e) => { e.stopPropagation(); navPreview(-1) }}><ChevronLeft size={22} /></button>
          {previewUrl ? <img src={previewUrl} onClick={e => e.stopPropagation()} /> : <div className="mf-modal-loading">Loading preview…</div>}
          <button className="mf-modal-nav right" onClick={(e) => { e.stopPropagation(); navPreview(1) }}><ChevronRight size={22} /></button>
        </div>
      )}

      {toast && <div className="mf-toast">{toast}</div>}
    </div>
  )
}
