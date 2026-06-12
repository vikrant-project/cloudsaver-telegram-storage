import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Upload, HardDrive, FileText, TrendingUp } from 'lucide-react'

function fmtSize(n: number) {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0; let v = n
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

export default function DashboardHome({ channelInfo }: { channelInfo: any }) {
  const navigate = useNavigate()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const res = await window.electronAPI.telegram.listFiles()
      if (res.success) setFiles(res.data || [])
      setLoading(false)
    })()
  }, [])

  const total = files.length
  const totalSize = files.reduce((s, f) => s + (f.fileSize || 0), 0)
  const oneWeekAgo = Date.now() / 1000 - 7 * 24 * 3600
  const weekFiles = files.filter(f => (f.date || 0) >= oneWeekAgo).length
  const avgSize = total ? totalSize / total : 0

  const typeMap: Record<string, number> = {}
  files.forEach(f => { const t = typeOf(f.fileName || ''); typeMap[t] = (typeMap[t] || 0) + 1 })
  const chartData = Object.entries(typeMap).map(([name, value]) => ({ name, value }))

  const recent = [...files].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 5)

  const onQuickUpload = async () => {
    const r = await window.electronAPI.dialog.pickMultipleFiles()
    if (r.success) navigate('/upload', { state: { initialFiles: r.data } })
  }

  return (
    <div className="dh-root">
      <div className="dh-banner">
        <div>
          <h1>Welcome to CloudSaver <span className="dh-v">v2</span></h1>
          <p>{channelInfo?.title ? `Connected to ${channelInfo.title}` : 'Your private Telegram cloud'}</p>
        </div>
        <button className="dh-cta" onClick={() => navigate('/upload')}>
          <Upload size={16} /> Upload Files
        </button>
      </div>

      <div className="dh-stats">
        <div className="dh-card"><div className="dh-card-icon"><FileText size={20} /></div>
          <div className="dh-card-body"><div className="dh-card-label">Total Files</div>
            <div className="dh-card-value">{loading ? '…' : total}</div></div></div>
        <div className="dh-card"><div className="dh-card-icon"><HardDrive size={20} /></div>
          <div className="dh-card-body"><div className="dh-card-label">Storage Used</div>
            <div className="dh-card-value">{loading ? '…' : fmtSize(totalSize)}</div></div></div>
        <div className="dh-card"><div className="dh-card-icon"><TrendingUp size={20} /></div>
          <div className="dh-card-body"><div className="dh-card-label">This Week</div>
            <div className="dh-card-value">{loading ? '…' : weekFiles}</div></div></div>
        <div className="dh-card"><div className="dh-card-icon"><BarChart3Icon /></div>
          <div className="dh-card-body"><div className="dh-card-label">Avg File Size</div>
            <div className="dh-card-value">{loading ? '…' : fmtSize(avgSize)}</div></div></div>
      </div>

      <div className="dh-grid">
        <div className="dh-panel">
          <div className="dh-panel-head"><h2>Storage by Type</h2></div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#9ca3c4" fontSize={12} />
                <YAxis stroke="#9ca3c4" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'rgba(20,22,38,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Bar dataKey="value" fill="url(#dhBarGrad)" radius={[6, 6, 0, 0]} />
                <defs><linearGradient id="dhBarGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7c83ff" /><stop offset="100%" stopColor="#3a3fa4" />
                </linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dh-panel">
          <div className="dh-panel-head"><h2>Recent Files</h2></div>
          {recent.length === 0 ? <div className="dh-empty">No files yet</div> : (
            <ul className="dh-recent">
              {recent.map(f => (
                <li key={f.messageId}>
                  <div className="dh-recent-name" title={f.fileName}>{f.fileName}</div>
                  <div className="dh-recent-meta">{fmtSize(f.fileSize)} • {new Date((f.date || 0) * 1000).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dh-quick" onClick={onQuickUpload}>
        <Upload size={28} />
        <div className="dh-quick-title">Quick Upload</div>
        <div className="dh-quick-sub">Click to pick files</div>
      </div>
    </div>
  )
}

function BarChart3Icon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16V8"/><path d="M12 16v-5"/><path d="M17 16v-3"/></svg>
}
