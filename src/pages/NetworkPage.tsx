import React, { useEffect, useRef, useState } from "react"
import { Wifi, Activity } from "lucide-react"

export default function NetworkPage() {
  const [pings, setPings] = useState<number[]>([])
  const [latency, setLatency] = useState(0)
  const [online, setOnline] = useState(true)
  const tRef = useRef<any>()
  useEffect(() => {
    const tick = async () => {
      const t = performance.now()
      try { await window.electronAPI?.app?.getVersion?.(); setLatency(Math.round(performance.now() - t)); setOnline(navigator.onLine) }
      catch { setOnline(false) }
      setPings(p => [...p.slice(-39), Math.round(performance.now() - t)])
    }
    tick(); tRef.current = setInterval(tick, 1500)
    return () => clearInterval(tRef.current)
  }, [])
  const max = Math.max(50, ...pings)
  return (
    <div className="v3-page" data-testid="network-page">
      <h1 className="v3-h1">Network</h1>
      <div className="v3-sub">Live Telegram connection health.</div>
      <div className="v3-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 18 }}>
        <div className="v3-card"><div className="v3-sub">Online</div><div className="v3-h2 v3-num" style={{ color: online ? "var(--v3-success)" : "var(--v3-danger)" }}>{online ? "YES" : "NO"}</div></div>
        <div className="v3-card"><div className="v3-sub">Latency</div><div className="v3-h2 v3-num">{latency} ms</div></div>
        <div className="v3-card"><div className="v3-sub">Samples</div><div className="v3-h2 v3-num">{pings.length}</div></div>
      </div>
      <div className="v3-card" style={{ marginTop: 18 }}>
        <div className="v3-row"><Activity size={16}/> <span>Latency (ms) — last 40 samples</span></div>
        <svg viewBox={`0 0 400 100`} style={{ width: "100%", height: 140, marginTop: 12 }}>
          <defs><linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22d3ee"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs>
          <polyline fill="none" stroke="url(#g1)" strokeWidth={2}
            points={pings.map((v, i) => `${(i/Math.max(1,pings.length-1))*400},${100 - (v/max)*90}`).join(" ")}/>
        </svg>
      </div>
    </div>
  )
}
