import React, { useEffect, useMemo, useState } from "react"
import { v3store } from "../lib/v3store"

export default function CalendarPage() {
  const [files, setFiles] = useState<any[]>([])
  useEffect(() => { window.electronAPI?.telegram?.listFiles?.().then((r: any) => { if (r?.success) setFiles(r.data || []) }) }, [])
  const grid = useMemo(() => {
    const days: Record<string, number> = {}
    files.forEach((f: any) => {
      const d = new Date((f.date || 0) * 1000); if (!isFinite(d.getTime())) return
      const k = d.toISOString().slice(0, 10); days[k] = (days[k] || 0) + 1
    })
    v3store.getActivity().filter(a => a.type === "upload").forEach(a => {
      const k = new Date(a.ts).toISOString().slice(0,10); days[k] = (days[k] || 0) + 1
    })
    const out: Array<{ d: string; n: number }> = []
    const now = new Date()
    for (let i = 365; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i)
      const k = d.toISOString().slice(0, 10); out.push({ d: k, n: days[k] || 0 })
    }
    return out
  }, [files])
  const max = Math.max(1, ...grid.map(g => g.n))
  const lvl = (n: number) => { if (n === 0) return "rgba(255,255,255,0.05)"; const r = n / max; if (r > 0.66) return "#22d3ee"; if (r > 0.33) return "#22d3ee99"; return "#22d3ee55" }
  return (
    <div className="v3-page" data-testid="calendar-page">
      <h1 className="v3-h1">Upload Calendar</h1>
      <div className="v3-sub">Activity over the past year.</div>
      <div className="v3-card" style={{ marginTop: 18, overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(53, 12px)`, gridAutoFlow: "column", gridTemplateRows: "repeat(7, 12px)", gap: 3 }}>
          {grid.map(g => <div key={g.d} title={`${g.d}: ${g.n}`} style={{ width: 12, height: 12, borderRadius: 3, background: lvl(g.n) }}/>)}
        </div>
        <div className="v3-row v3-sub" style={{ marginTop: 14 }}>
          <span>Less</span>
          <div style={{ width:12,height:12,borderRadius:3,background:"rgba(255,255,255,0.05)" }}/>
          <div style={{ width:12,height:12,borderRadius:3,background:"#22d3ee55" }}/>
          <div style={{ width:12,height:12,borderRadius:3,background:"#22d3ee99" }}/>
          <div style={{ width:12,height:12,borderRadius:3,background:"#22d3ee" }}/>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
