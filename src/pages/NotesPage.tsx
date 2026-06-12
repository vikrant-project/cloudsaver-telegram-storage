import React, { useEffect, useState } from "react"
import { StickyNote, Save, Trash2 } from "lucide-react"
import { v3store } from "../lib/v3store"

export default function NotesPage() {
  const [notes, setNotes] = useState(v3store.getNotes())
  const [activeId, setActiveId] = useState<number | null>(notes[0]?.messageId ?? null)
  const [draft, setDraft] = useState("")
  const [newId, setNewId] = useState("")
  useEffect(() => { const n = notes.find(x => x.messageId === activeId); setDraft(n?.markdown || "") }, [activeId, notes])
  const save = () => { if (activeId == null) return; v3store.setNote(activeId, draft); setNotes(v3store.getNotes()) }
  const remove = (id: number) => { v3store.removeNote(id); setNotes(v3store.getNotes()); if (activeId === id) setActiveId(null) }
  const create = () => { const id = parseInt(newId, 10); if (!id) return; v3store.setNote(id, ""); setNotes(v3store.getNotes()); setActiveId(id); setNewId("") }
  return (
    <div className="v3-page" data-testid="notes-page">
      <h1 className="v3-h1">Notes</h1>
      <div className="v3-sub">Attach markdown notes to any file by message ID.</div>
      <div className="v3-grid" style={{ gridTemplateColumns: "260px 1fr", marginTop: 18 }}>
        <div className="v3-card">
          <div className="v3-row">
            <input className="v3-input" placeholder="Msg ID" value={newId} onChange={e => setNewId(e.target.value)} data-testid="note-new-id"/>
            <button className="v3-btn primary" onClick={create} data-testid="note-create">New</button>
          </div>
          <div style={{ marginTop: 12 }}>
            {notes.map(n => (
              <div key={n.messageId} className={"v3-row"} onClick={() => setActiveId(n.messageId)}
                style={{ padding: 8, cursor: "pointer", borderRadius: 8, background: activeId === n.messageId ? "rgba(124,200,255,0.08)" : "transparent" }}>
                <StickyNote size={14}/>
                <div style={{ flex: 1, fontSize: 13 }}>#{n.messageId}</div>
                <button className="v3-btn ghost" onClick={(e) => { e.stopPropagation(); remove(n.messageId) }}><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        </div>
        <div className="v3-card" style={{ display: "flex", flexDirection: "column" }}>
          <textarea className="v3-input" rows={18} placeholder="# Write markdown here..." value={draft} onChange={e => setDraft(e.target.value)} data-testid="note-editor" style={{ fontFamily: "var(--v3-mono)", resize: "vertical" }}/>
          <div className="v3-row" style={{ marginTop: 12 }}>
            <button className="v3-btn primary" onClick={save} data-testid="note-save"><Save size={14}/> Save</button>
            <div className="v3-sub">{draft.length} chars</div>
          </div>
        </div>
      </div>
    </div>
  )
}
