import React from "react"
import { Keyboard } from "lucide-react"

const SC = [
  ["Ctrl+K", "Open Search"],
  ["Ctrl+Shift+P", "Command Palette"],
  ["Ctrl+A", "Select all (in lists)"],
  ["Esc", "Clear selection / close modal"],
  ["Shift+Click", "Range select"],
  ["Ctrl+V", "Paste & upload"],
  ["Ctrl+Click", "Toggle individual select"],
  ["Ctrl+,", "Open Settings"],
  ["Ctrl+1..9", "Switch sidebar tab"],
]

export default function HelpPage() {
  return (
    <div className="v3-page" data-testid="help-page">
      <h1 className="v3-h1">Keyboard Shortcuts</h1>
      <div className="v3-sub">Master CloudSaver with the keyboard.</div>
      <div className="v3-card" style={{ marginTop: 18 }}>
        {SC.map(([k, d]) => (
          <div key={k} className="v3-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--v3-border-soft)" }}>
            <Keyboard size={14}/>
            <kbd className="v3-chip v3-num" style={{ minWidth: 120 }}>{k}</kbd>
            <div>{d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
