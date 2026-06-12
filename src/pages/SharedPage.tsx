import React, { useEffect, useState } from "react"
import { Link2, Copy, X, QrCode } from "lucide-react"
import { v3store, type SharedLink } from "../lib/v3store"

export default function SharedPage() {
  const [items, setItems] = useState<SharedLink[]>(v3store.getShared())
  useEffect(() => { setItems(v3store.getShared()) }, [])
  const copy = (s: SharedLink) => {
    const link = `cloudsaver://share/${s.id}`
    window.electronAPI?.app?.copyToClipboard?.(link)
    v3store.bumpShared(s.id); setItems(v3store.getShared())
  }
  return (
    <div className="v3-page" data-testid="shared-page">
      <h1 className="v3-h1">Shared Links</h1>
      <div className="v3-sub">Manage every link you have generated.</div>
      <div className="v3-card" style={{ marginTop: 18 }}>
        {items.length === 0 ? <div className="v3-sub">No shared links yet.</div> :
          items.map(s => (
            <div key={s.id} className="v3-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--v3-border-soft)" }}>
              <Link2 size={16} />
              <div style={{ flex: 1 }}>
                <div>{s.fileName}</div>
                <div className="v3-sub v3-num">
                  {s.expiresAt ? "Expires " + new Date(s.expiresAt).toLocaleDateString() : "Never expires"} · used {s.useCount}x
                  {s.password ? " · password-protected" : ""}
                </div>
              </div>
              <button className="v3-btn" onClick={() => copy(s)} data-testid="share-copy"><Copy size={14}/> Copy</button>
              <button className="v3-btn" onClick={() => { v3store.removeShared(s.id); setItems(v3store.getShared()) }} data-testid="share-revoke"><X size={14}/> Revoke</button>
              <button className="v3-btn" title="QR"><QrCode size={14}/></button>
            </div>
          ))
        }
      </div>
    </div>
  )
}
