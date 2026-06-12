import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Command, Search } from "lucide-react"

const COMMANDS = [
  { id: "go-dashboard", label: "Go to Dashboard", path: "/" },
  { id: "go-files", label: "Go to My Files", path: "/files" },
  { id: "go-upload", label: "Go to Upload", path: "/upload" },
  { id: "go-autosync", label: "Go to Auto-Sync", path: "/autosync" },
  { id: "go-statistics", label: "Go to Statistics", path: "/statistics" },
  { id: "go-trash", label: "Go to Trash", path: "/trash" },
  { id: "go-favorites", label: "Go to Favorites", path: "/favorites" },
  { id: "go-shared", label: "Go to Shared Links", path: "/shared" },
  { id: "go-activity", label: "Go to Activity Log", path: "/activity" },
  { id: "go-tags", label: "Go to Tags", path: "/tags" },
  { id: "go-search", label: "Open Search", path: "/search" },
  { id: "go-calendar", label: "Go to Calendar", path: "/calendar" },
  { id: "go-albums", label: "Go to Albums", path: "/albums" },
  { id: "go-notes", label: "Go to Notes", path: "/notes" },
  { id: "go-network", label: "Go to Network", path: "/network" },
  { id: "go-diagnostics", label: "Run Diagnostics", path: "/diagnostics" },
  { id: "go-settings", label: "Open Settings", path: "/settings" },
  { id: "go-help", label: "Keyboard Shortcuts", path: "/help" },
  { id: "go-about", label: "About CloudSaver", path: "/about" },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const nav = useNavigate()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "p" || e.key === "P")) { e.preventDefault(); setOpen(true) }
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); nav("/search") }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [nav])
  const filtered = useMemo(() => {
    if (!q.trim()) return COMMANDS
    const ql = q.toLowerCase()
    return COMMANDS.filter(c => c.label.toLowerCase().includes(ql))
  }, [q])
  if (!open) return null
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 100, zIndex: 1000 }} onClick={() => setOpen(false)} data-testid="cmd-palette">
      <div className="v3-card" style={{ width: 540, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="v3-row" style={{ padding: "12px 14px", borderBottom: "1px solid var(--v3-border-soft)" }}>
          <Command size={16}/>
          <input autoFocus className="v3-input" placeholder="Type a command…" value={q} onChange={(e) => setQ(e.target.value)} style={{ border: 0, background: "transparent" }} data-testid="cmd-input"/>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 8 }}>
          {filtered.map(c => (
            <button key={c.id} className="v3-btn ghost" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 4 }}
              onClick={() => { nav(c.path); setOpen(false); setQ("") }}>
              <Search size={14}/> {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
