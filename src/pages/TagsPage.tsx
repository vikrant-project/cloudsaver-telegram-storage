import React, { useState } from "react"
import { Tag, Plus, X } from "lucide-react"
import { v3store } from "../lib/v3store"

const PALETTE = ["#22d3ee","#a855f7","#34d399","#fbbf24","#ec4899","#f87171","#7cc8ff","#cbd5e1"]

export default function TagsPage() {
  const [tags, setTags] = useState(v3store.getTags())
  const [name, setName] = useState("")
  const [color, setColor] = useState(PALETTE[0])
  const add = () => { if (!name.trim()) return; v3store.addTag({ name: name.trim(), color, createdAt: Date.now() }); setTags(v3store.getTags()); setName(""); v3store.logActivity("tag", "Created tag " + name.trim()) }
  const remove = (n: string) => { v3store.removeTag(n); setTags(v3store.getTags()) }
  return (
    <div className="v3-page" data-testid="tags-page">
      <h1 className="v3-h1">Tags</h1>
      <div className="v3-sub">Organise files with custom labels.</div>
      <div className="v3-card" style={{ marginTop: 18 }}>
        <div className="v3-row">
          <input className="v3-input" placeholder="Tag name" value={name} onChange={e => setName(e.target.value)} data-testid="tag-name"/>
          <div className="v3-row" style={{ flex: "none" }}>
            {PALETTE.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: 8, background: c, border: c === color ? "2px solid white" : "1px solid rgba(255,255,255,0.2)" }}/>)}
          </div>
          <button className="v3-btn primary" onClick={add} data-testid="tag-add"><Plus size={14}/> Add</button>
        </div>
        <div className="v3-row" style={{ marginTop: 16, flexWrap: "wrap", gap: 8 }}>
          {tags.map(t => (
            <span key={t.name} className="v3-chip" style={{ background: t.color + "20", color: t.color, borderColor: t.color + "55" }}>
              <Tag size={12}/> {t.name}
              <button onClick={() => remove(t.name)} style={{ background: "transparent", border: 0, color: "inherit", marginLeft: 4, cursor: "pointer" }}><X size={12}/></button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
