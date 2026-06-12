import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Upload as UploadIcon, FolderOpen, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

interface QueueItem {
  id: string
  filePath: string
  fileName: string
  fileSize: number
  status: 'waiting' | 'uploading' | 'done' | 'failed'
  percent: number
  error?: string
}

function fmtSize(n: number) {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; let v = n
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return v.toFixed(v < 10 && i > 0 ? 1 : 0) + ' ' + u[i]
}
const TG_LIMIT = 2 * 1024 * 1024 * 1024

export default function UploadPage() {
  const location = useLocation() as any
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const queueRef = useRef<QueueItem[]>([])
  queueRef.current = queue

  useEffect(() => {
    const off = window.electronAPI.telegram.onUploadProgress((d: any) => {
      if (!d.id) return
      setQueue(prev => prev.map(q => q.id === d.id ? { ...q, percent: d.percent, status: 'uploading' } : q))
    })
    return off
  }, [])

  useEffect(() => {
    const initial = location.state?.initialFiles
    if (initial && Array.isArray(initial)) addFiles(initial)
  }, [])

  const addFiles = (files: Array<{ filePath: string; fileName: string; fileSize: number }>) => {
    const items: QueueItem[] = files.map(f => ({
      id: Math.random().toString(36).slice(2),
      filePath: f.filePath, fileName: f.fileName, fileSize: f.fileSize,
      status: 'waiting', percent: 0
    }))
    setQueue(prev => [...prev, ...items])
    setTimeout(() => processQueue(), 50)
  }

  const processQueue = async () => {
    const items = queueRef.current.filter(q => q.status === 'waiting')
    for (const it of items) {
      if (it.fileSize > TG_LIMIT) {
        setQueue(prev => prev.map(q => q.id === it.id ? { ...q, status: 'failed', error: 'Exceeds 2GB' } : q))
        continue
      }
      setQueue(prev => prev.map(q => q.id === it.id ? { ...q, status: 'uploading' } : q))
      const res = await window.electronAPI.telegram.uploadFile(it.filePath, it.id)
      setQueue(prev => prev.map(q => q.id === it.id
        ? { ...q, status: res.success ? 'done' : 'failed', percent: res.success ? 100 : q.percent, error: res.success ? undefined : res.error }
        : q))
    }
  }

  const pickFiles = async () => {
    const r = await window.electronAPI.dialog.pickMultipleFiles()
    if (r.success) addFiles(r.data)
  }
  const pickFolder = async () => {
    const r = await window.electronAPI.dialog.pickFolderRecursive()
    if (r.success) addFiles(r.data.files)
  }
  const removeItem = (id: string) => setQueue(prev => prev.filter(q => q.id !== id))
  const clearDone = () => setQueue(prev => prev.filter(q => q.status !== 'done'))

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const dropped: any[] = []
    for (const file of Array.from(e.dataTransfer.files)) {
      const p = window.electronAPI.getPathForFile(file)
      if (p) dropped.push({ filePath: p, fileName: file.name, fileSize: file.size })
    }
    if (dropped.length) addFiles(dropped)
  }

  const doneCount = queue.filter(q => q.status === 'done').length
  const failedCount = queue.filter(q => q.status === 'failed').length

  return (
    <div className="up-root">
      <div className="up-head">
        <h1>Upload Files</h1>
        <div className="up-stats">
          <span>{doneCount} done</span>
          {failedCount > 0 && <span className="warn">{failedCount} failed</span>}
          <span>{queue.length} total</span>
        </div>
      </div>

      <div className={'up-drop' + (dragOver ? ' over' : '')}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}>
        <UploadIcon size={48} />
        <h2>Drag & drop files here</h2>
        <p>or use one of the buttons below</p>
        <div className="up-actions">
          <button className="primary" onClick={pickFiles}><UploadIcon size={16} /> Browse Files</button>
          <button onClick={pickFolder}><FolderOpen size={16} /> Pick Folder</button>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="up-queue">
          <div className="up-queue-head">
            <h2>Upload Queue</h2>
            <button onClick={clearDone}>Clear completed</button>
          </div>
          <ul>
            {queue.map(q => (
              <li key={q.id} className={'up-item up-item-' + q.status}>
                <div className="up-item-info">
                  <div className="up-item-name">
                    {q.fileName}
                    {q.fileSize > TG_LIMIT && (
                      <span className="up-warn"><AlertTriangle size={12} /> Exceeds Telegram 2GB limit</span>
                    )}
                  </div>
                  <div className="up-item-meta">{fmtSize(q.fileSize)} • {q.status}{q.error ? ' - ' + q.error : ''}</div>
                </div>
                <div className="up-item-progress">
                  {q.status === 'uploading' && <Loader2 size={16} className="spin" />}
                  {q.status === 'done' && <CheckCircle2 size={16} className="ok" />}
                  {q.status === 'failed' && <AlertTriangle size={16} className="err" />}
                  <div className="up-bar"><div className="up-bar-fill" style={{ width: q.percent + '%' }} /></div>
                  <span className="up-pct">{q.percent}%</span>
                  {q.status === 'waiting' && <button onClick={() => removeItem(q.id)}><Trash2 size={14} /></button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
