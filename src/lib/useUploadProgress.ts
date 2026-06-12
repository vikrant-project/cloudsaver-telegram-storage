import { useEffect, useReducer, useRef } from "react"

export type ProgItem = { id: string; sent: number; total: number; percent: number; speed: number; eta: number; lastTs: number; lastSent: number; samples: Array<{ts:number; sent:number}>; finished?: boolean }
type State = { items: Record<string, ProgItem> }
type Action = { type: "update"; data: { id: string; sent: number; total: number; percent: number } } | { type: "clear"; id: string } | { type: "finish"; id: string }

function reducer(state: State, action: Action): State {
  if (action.type === "update") {
    const d = action.data; if (!d.id) return state
    const now = Date.now()
    const prev = state.items[d.id] || { id: d.id, sent: 0, total: 0, percent: 0, speed: 0, eta: 0, lastTs: now, lastSent: 0, samples: [] }
    const samples = [...prev.samples, { ts: now, sent: d.sent }].filter(s => now - s.ts < 5000)
    let speed = 0
    if (samples.length > 1) {
      const oldest = samples[0]; const dt = (now - oldest.ts)/1000
      if (dt > 0) speed = Math.max(0, (d.sent - oldest.sent) / dt)
    }
    const remaining = Math.max(0, (d.total||0) - d.sent)
    const eta = speed > 0 ? (remaining / speed) * 1000 : 0
    return { items: { ...state.items, [d.id]: { ...prev, sent: d.sent, total: d.total, percent: d.percent, speed, eta, lastTs: now, lastSent: d.sent, samples } } }
  }
  if (action.type === "finish") {
    const it = state.items[action.id]; if (!it) return state
    return { items: { ...state.items, [action.id]: { ...it, finished: true, percent: 100 } } }
  }
  if (action.type === "clear") { const c = { ...state.items }; delete c[action.id]; return { items: c } }
  return state
}

export function useUploadProgress() {
  const [state, dispatch] = useReducer(reducer, { items: {} })
  const lastEmitRef = useRef<Record<string, number>>({})
  useEffect(() => {
    const off = window.electronAPI?.telegram?.onUploadProgress?.((data: any) => {
      const now = Date.now(); const last = lastEmitRef.current[data.id] || 0
      if (now - last < 100 && data.percent < 100) return
      lastEmitRef.current[data.id] = now
      dispatch({ type: "update", data })
      if (data.percent >= 100) dispatch({ type: "finish", id: data.id })
    })
    return () => { off && off() }
  }, [])
  return { items: state.items, clear: (id: string) => dispatch({ type: "clear", id }) }
}
