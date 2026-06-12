import React, { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'

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
const COLORS = ['#7c83ff', '#4ed3a8', '#ffb84d', '#ff6b9b', '#6bc6ff', '#b78bff']

export default function StatisticsPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const r = await window.electronAPI.telegram.listFiles()
      if (r.success) setFiles(r.data || [])
      setLoading(false)
    })()
  }, [])

  const totalFiles = files.length
  const totalBytes = files.reduce((s, f) => s + (f.fileSize || 0), 0)

  const activity = useMemo(() => {
    const map: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().slice(5, 10)
      map[k] = 0
    }
    files.forEach(f => {
      if (!f.date) return
      const d = new Date(f.date * 1000); const k = d.toISOString().slice(5, 10)
      if (k in map) map[k] += 1
    })
    return Object.entries(map).map(([date, count]) => ({ date, count }))
  }, [files])

  const breakdown = useMemo(() => {
    const m: Record<string, number> = {}
    files.forEach(f => { const t = typeOf(f.fileName || ''); m[t] = (m[t] || 0) + (f.fileSize || 0) })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [files])

  const largest = useMemo(() => [...files].sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0)).slice(0, 10), [files])
  const last = useMemo(() => [...files].sort((a, b) => (b.date || 0) - (a.date || 0))[0], [files])

  return (
    <div className="st-root">
      <h1>Statistics</h1>

      <div className="st-cards">
        <div className="st-card"><div className="st-card-label">Total Files</div><div className="st-card-value">{loading ? '…' : totalFiles}</div></div>
        <div className="st-card"><div className="st-card-label">Data Stored</div><div className="st-card-value">{loading ? '…' : fmtSize(totalBytes)}</div></div>
        <div className="st-card"><div className="st-card-label">Last Upload</div><div className="st-card-value small">{last ? last.fileName : '—'}</div>
          <div className="st-card-sub">{last ? new Date(last.date * 1000).toLocaleString() : ''}</div></div>
      </div>

      <div className="st-grid">
        <div className="st-panel">
          <h2>Upload Activity (last 30 days)</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" stroke="#9ca3c4" fontSize={11} />
                <YAxis stroke="#9ca3c4" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'rgba(20,22,38,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#7c83ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="st-panel">
          <h2>Storage Breakdown</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmtSize(Number(v))} contentStyle={{ background: 'rgba(20,22,38,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="st-panel">
        <h2>Largest Files</h2>
        <table className="st-table">
          <thead><tr><th>#</th><th>Name</th><th>Type</th><th>Size</th></tr></thead>
          <tbody>
            {largest.map((f, i) => (
              <tr key={f.messageId}><td>{i + 1}</td><td className="ellip">{f.fileName}</td><td>{typeOf(f.fileName)}</td><td>{fmtSize(f.fileSize)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
