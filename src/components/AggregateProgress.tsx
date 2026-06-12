import React from "react"
import { useUploadProgress } from "../lib/useUploadProgress"
import { fmtBytes, fmtTime } from "../lib/v3store"
import { Activity } from "lucide-react"

export default function AggregateProgress() {
  const { items } = useUploadProgress()
  const list = Object.values(items)
  const active = list.filter(i => !i.finished)
  if (active.length === 0 && list.length === 0) return null
  const totalBytes = list.reduce((s, i) => s + (i.total || 0), 0)
  const sentBytes = list.reduce((s, i) => s + (i.sent || 0), 0)
  const overall = totalBytes > 0 ? Math.min(100, Math.floor((sentBytes / totalBytes) * 100)) : 0
  const speed = list.reduce((s, i) => s + (i.speed || 0), 0)
  const remaining = Math.max(0, totalBytes - sentBytes)
  const eta = speed > 0 ? (remaining / speed) * 1000 : 0
  const done = list.length - active.length
  return (
    <>
      <div className="v3-aggregate" data-testid="aggregate-progress">
        <div className="v3-row">
          <Activity size={14}/>
          <div className="label">Uploading <span className="v3-num">{done}</span> of <span className="v3-num">{list.length}</span> · overall <span className="v3-num">{overall}%</span></div>
          <div style={{ marginLeft: "auto" }} className="v3-row v3-sub v3-num">
            <span>{fmtBytes(speed)}/s</span>
            <span>·</span>
            <span>ETA {fmtTime(eta)}</span>
          </div>
        </div>
        <div className="v3-progress"><div className="v3-progress-bar" style={{ width: overall + "%" }}/></div>
      </div>
      {active.length > 0 && (
        <div className="v3-tray" data-testid="upload-tray">
          <span className="pulse"/>
          <span className="v3-num">{active.length} active</span>
          <span className="v3-sub v3-num">· {fmtBytes(speed)}/s</span>
        </div>
      )}
    </>
  )
}
