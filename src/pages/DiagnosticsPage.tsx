import React, { useState } from "react"
import { Stethoscope, Check, X, Loader2 } from "lucide-react"

type R = { name: string; pass?: boolean; detail?: string }

export default function DiagnosticsPage() {
  const [results, setResults] = useState<R[]>([])
  const [running, setRunning] = useState(false)
  const run = async () => {
    setRunning(true)
    const out: R[] = []
    const push = (r: R) => { out.push(r); setResults([...out]) }
    try {
      const v = await window.electronAPI?.app?.getVersion?.()
      push({ name: "IPC: app.getVersion", pass: !!v?.success, detail: v?.data })
    } catch (e: any) { push({ name: "IPC: app.getVersion", pass: false, detail: e?.message }) }
    try {
      const s = await window.electronAPI?.telegram?.checkSession?.()
      push({ name: "Telegram session", pass: !!s?.success, detail: s?.hasSession ? "Active" : "None" })
    } catch (e: any) { push({ name: "Telegram session", pass: false, detail: e?.message }) }
    try {
      const dl = await window.electronAPI?.storage?.getDownloadPath?.()
      push({ name: "Download path", pass: !!dl?.success, detail: dl?.data })
    } catch (e: any) { push({ name: "Download path", pass: false, detail: e?.message }) }
    try {
      localStorage.setItem("__diag", "1"); const v = localStorage.getItem("__diag"); localStorage.removeItem("__diag")
      push({ name: "Local storage write", pass: v === "1" })
    } catch (e: any) { push({ name: "Local storage write", pass: false, detail: e?.message }) }
    push({ name: "Online", pass: navigator.onLine })
    setRunning(false)
  }
  return (
    <div className="v3-page" data-testid="diagnostics-page">
      <h1 className="v3-h1">Diagnostics</h1>
      <div className="v3-sub">Run self-tests for IPC, storage, and network.</div>
      <div className="v3-row" style={{ marginTop: 12 }}>
        <button className="v3-btn primary" disabled={running} onClick={run} data-testid="diag-run">
          {running ? <Loader2 size={14} className="v3-spin"/> : <Stethoscope size={14}/>} Run tests
        </button>
      </div>
      <div className="v3-card" style={{ marginTop: 18 }}>
        {results.map((r, i) => (
          <div key={i} className="v3-row" style={{ padding: "8px 0", borderBottom: "1px solid var(--v3-border-soft)" }}>
            {r.pass ? <Check size={14} color="#34d399"/> : <X size={14} color="#f87171"/>}
            <div style={{ flex: 1 }}>{r.name}</div>
            <div className="v3-sub v3-num">{r.detail}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
