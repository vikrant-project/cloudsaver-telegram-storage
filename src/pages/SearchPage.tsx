import React, { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { v3store, fmtBytes } from "../lib/v3store"

export default function SearchPage() {
  const [q, setQ] = useState("")
  const [files, setFiles] = useState<any[]>([])
  useEffect(() => {
    window.electronAPI?.telegram?.listFiles?.().then((r: any) => { if (r?.success) setFiles(r.data || []) })
  }, [])
  const results = useMemo(() => {
    if (!q.trim()) return []
    const ql = q.toLowerCase()
    return files.filter((f: any) => {
      const name = (f.fileName || "").toLowerCase()
      const tags = v3store.tagsForFile(f.messageId).join(" ").toLowerCase()
      const note = v3store.noteFor(f.messageId)?.markdown.toLowerCase() || ""
      return name.includes(ql) || tags.includes(ql) || note.includes(ql)
    })
  }, [q, files])
  return (
    <div className="v3-page" data-testid="search-page">
      <h1 className="v3-h1">Search</h1>
      <div className="v3-sub">Full-text search across file names, tags, and notes.</div>
      <div className="v3-card" style={{ marginTop: 18 }}>
        <div className="v3-row">
          <Search size={16}/>
          <input autoFocus className="v3-input" placeholder="Search… (Ctrl+K)" value={q} onChange={e => setQ(e.target.value)} data-testid="search-input"/>
          <span className="v3-chip v3-num">{results.length} hits</span>
        </div>
        <div style={{ marginTop: 14 }}>
          {results.map((f: any) => (
            <div key={f.messageId} className="v3-row" style={{ padding: "8px 0", borderBottom: "1px solid var(--v3-border-soft)" }}>
              <div style={{ flex: 1 }}>{f.fileName}</div>
              <div className="v3-sub v3-num">{fmtBytes(f.fileSize || 0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
