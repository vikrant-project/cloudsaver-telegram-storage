import React, { useState } from "react"
import { NavLink } from "react-router-dom"
import { Home, FolderOpen, Upload, RefreshCw, BarChart3, Settings, Info,
  LogOut, Trash2, Star, Link2, Activity, Tag, Search, CalendarDays, Image as ImgIcon,
  StickyNote, Wifi, ChevronsLeft, ChevronsRight, Command, HelpCircle, Stethoscope } from "lucide-react"

interface Props { channelInfo: any; onLogout: () => void }

const items = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/files", label: "My Files", icon: FolderOpen },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/autosync", label: "Auto-Sync", icon: RefreshCw },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/trash", label: "Trash", icon: Trash2 },
  { to: "/favorites", label: "Favorites", icon: Star },
  { to: "/shared", label: "Shared", icon: Link2 },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/tags", label: "Tags", icon: Tag },
  { to: "/search", label: "Search", icon: Search },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/albums", label: "Albums", icon: ImgIcon },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/network", label: "Network", icon: Wifi },
  { to: "/diagnostics", label: "Diagnostics", icon: Stethoscope },
  { to: "/help", label: "Shortcuts", icon: HelpCircle },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About", icon: Info }
]

export default function Sidebar({ channelInfo, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <aside className={"v2-sidebar" + (collapsed ? " collapsed" : "")} style={collapsed ? { width: 72 } : undefined} data-testid="v3-sidebar">
      <div className="v2-sidebar-head">
        <div className="v2-sidebar-logo">CS</div>
        {!collapsed && (
          <div className="v2-sidebar-title">
            <div className="v2-sidebar-brand">CloudSaver</div>
            <span className="v2-sidebar-badge">v2</span>
          </div>
        )}
        <button className="v3-btn ghost" style={{ marginLeft: "auto", padding: 6, borderColor: "transparent" }} onClick={() => setCollapsed(c => !c)} title="Toggle sidebar" data-testid="sidebar-collapse">
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
      <nav className="v2-sidebar-nav" style={{ overflowY: "auto" }}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => "v2-sidebar-link" + (isActive ? " active" : "")}
            title={collapsed ? label : undefined}>
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="v2-sidebar-foot">
        {!collapsed && (
          <div className="v2-sidebar-channel" title={channelInfo?.title}>
            <div className="v2-sidebar-channel-name">{channelInfo?.title || "Channel"}</div>
            <div className="v2-sidebar-channel-sub">Connected</div>
          </div>
        )}
        <button className="v2-sidebar-logout" onClick={onLogout} data-testid="logout-btn">
          <LogOut size={16} />{!collapsed && <span>Logout</span>}
        </button>
        {!collapsed && (
          <div className="v3-row" style={{ marginTop: 8, fontSize: 11, color: "var(--v3-text-mute)" }}>
            <Command size={12} /> + K to search
          </div>
        )}
      </div>
    </aside>
  )
}
