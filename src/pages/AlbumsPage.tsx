import React, { useState } from "react"
import { Image as ImgIcon, Plus, Trash2 } from "lucide-react"
import { v3store } from "../lib/v3store"

export default function AlbumsPage() {
  const [albums, setAlbums] = useState(v3store.getAlbums())
  const [name, setName] = useState("")
  const create = () => {
    if (!name.trim()) return
    v3store.addAlbum({ id: Math.random().toString(36).slice(2), name: name.trim(), messageIds: [], createdAt: Date.now() })
    setAlbums(v3store.getAlbums()); setName("")
  }
  const remove = (id: string) => { v3store.removeAlbum(id); setAlbums(v3store.getAlbums()) }
  return (
    <div className="v3-page" data-testid="albums-page">
      <h1 className="v3-h1">Albums</h1>
      <div className="v3-sub">Group images into albums and play as slideshow.</div>
      <div className="v3-card" style={{ marginTop: 18 }}>
        <div className="v3-row">
          <input className="v3-input" placeholder="Album name" value={name} onChange={e => setName(e.target.value)} data-testid="album-name"/>
          <button className="v3-btn primary" onClick={create} data-testid="album-create"><Plus size={14}/> Create</button>
        </div>
        <div className="v3-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginTop: 16 }}>
          {albums.map(a => (
            <div key={a.id} className="v3-card" style={{ padding: 14 }}>
              <div className="v3-row"><ImgIcon size={16}/><div style={{ flex: 1, fontWeight: 600 }}>{a.name}</div>
                <button className="v3-btn ghost" onClick={() => remove(a.id)}><Trash2 size={14}/></button>
              </div>
              <div className="v3-sub v3-num">{a.messageIds.length} items · {new Date(a.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
