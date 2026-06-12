// CloudSaver v2 — lightweight localStorage-backed stores for new features
export type TrashItem = { messageId: number; fileName: string; size: number; deletedAt: number }
export type FavItem = { messageId: number; fileName: string; addedAt: number }
export type SharedLink = { id: string; fileName: string; messageId: number; createdAt: number; expiresAt?: number; password?: string; useCount: number }
export type ActivityEntry = { id: string; type: "upload"|"download"|"delete"|"rename"|"share"|"tag"|"login"|"lock"; message: string; ts: number }
export type TagEntry = { name: string; color: string; createdAt: number }
export type FileTag = { messageId: number; tags: string[] }
export type NoteEntry = { messageId: number; markdown: string; updatedAt: number }
export type AlbumEntry = { id: string; name: string; messageIds: number[]; createdAt: number }
export type FileMeta = { messageId: number; pinned?: boolean; color?: string; folder?: string }
export type ColorLabel = "red"|"orange"|"yellow"|"green"|"blue"|"purple"

const K = {
  trash: "v3.trash", favs: "v3.favs", shared: "v3.shared", activity: "v3.activity",
  tags: "v3.tags", fileTags: "v3.fileTags", notes: "v3.notes", albums: "v3.albums",
  meta: "v3.meta", prefs: "v3.prefs", smart: "v3.smartFilters", recent: "v3.recent",
  thumbs: "v3.thumbCache", audit: "v3.audit"
}

function get<T>(k: string, def: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : def } catch { return def }
}
function set<T>(k: string, v: T) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

export const v3store = {
  // trash
  getTrash: (): TrashItem[] => get(K.trash, []),
  addTrash: (it: TrashItem) => { const a = v3store.getTrash(); a.unshift(it); set(K.trash, a) },
  removeTrash: (id: number) => set(K.trash, v3store.getTrash().filter(x => x.messageId !== id)),
  clearOldTrash: () => { const cutoff = Date.now() - 30*864e5; set(K.trash, v3store.getTrash().filter(x => x.deletedAt > cutoff)) },
  // favorites
  getFavs: (): FavItem[] => get(K.favs, []),
  isFav: (id: number) => v3store.getFavs().some(f => f.messageId === id),
  toggleFav: (it: FavItem) => { const a = v3store.getFavs(); const i = a.findIndex(f => f.messageId === it.messageId); if (i >= 0) a.splice(i, 1); else a.unshift(it); set(K.favs, a); return i < 0 },
  // shared links
  getShared: (): SharedLink[] => get(K.shared, []),
  addShared: (s: SharedLink) => { const a = v3store.getShared(); a.unshift(s); set(K.shared, a) },
  removeShared: (id: string) => set(K.shared, v3store.getShared().filter(x => x.id !== id)),
  bumpShared: (id: string) => { const a = v3store.getShared(); const t = a.find(x => x.id === id); if (t) { t.useCount++; set(K.shared, a) } },
  // activity
  getActivity: (): ActivityEntry[] => get(K.activity, []),
  logActivity: (type: ActivityEntry["type"], message: string) => {
    const a = v3store.getActivity(); a.unshift({ id: Math.random().toString(36).slice(2), type, message, ts: Date.now() })
    if (a.length > 2000) a.length = 2000; set(K.activity, a)
  },
  clearActivity: () => set(K.activity, []),
  // tags
  getTags: (): TagEntry[] => get(K.tags, []),
  addTag: (t: TagEntry) => { const a = v3store.getTags(); if (!a.find(x => x.name === t.name)) { a.push(t); set(K.tags, a) } },
  removeTag: (name: string) => set(K.tags, v3store.getTags().filter(t => t.name !== name)),
  getFileTags: (): FileTag[] => get(K.fileTags, []),
  setFileTags: (messageId: number, tags: string[]) => {
    const a = v3store.getFileTags(); const i = a.findIndex(x => x.messageId === messageId)
    if (i >= 0) a[i].tags = tags; else a.push({ messageId, tags }); set(K.fileTags, a)
  },
  tagsForFile: (messageId: number): string[] => v3store.getFileTags().find(x => x.messageId === messageId)?.tags || [],
  // notes
  getNotes: (): NoteEntry[] => get(K.notes, []),
  noteFor: (messageId: number): NoteEntry | undefined => v3store.getNotes().find(n => n.messageId === messageId),
  setNote: (messageId: number, markdown: string) => {
    const a = v3store.getNotes(); const i = a.findIndex(x => x.messageId === messageId)
    if (i >= 0) a[i] = { messageId, markdown, updatedAt: Date.now() }
    else a.push({ messageId, markdown, updatedAt: Date.now() }); set(K.notes, a)
  },
  removeNote: (messageId: number) => set(K.notes, v3store.getNotes().filter(n => n.messageId !== messageId)),
  // albums
  getAlbums: (): AlbumEntry[] => get(K.albums, []),
  addAlbum: (a: AlbumEntry) => { const arr = v3store.getAlbums(); arr.push(a); set(K.albums, arr) },
  removeAlbum: (id: string) => set(K.albums, v3store.getAlbums().filter(a => a.id !== id)),
  updateAlbum: (id: string, patch: Partial<AlbumEntry>) => { const arr = v3store.getAlbums(); const i = arr.findIndex(a => a.id === id); if (i >= 0) { arr[i] = { ...arr[i], ...patch }; set(K.albums, arr) } },
  // file meta (pin, color, folder)
  getMeta: (): FileMeta[] => get(K.meta, []),
  setMeta: (m: FileMeta) => { const a = v3store.getMeta(); const i = a.findIndex(x => x.messageId === m.messageId); if (i >= 0) a[i] = { ...a[i], ...m }; else a.push(m); set(K.meta, a) },
  metaFor: (id: number): FileMeta | undefined => v3store.getMeta().find(m => m.messageId === id),
  // preferences (theme, accent, density, animations, font)
  getPrefs: () => get(K.prefs, { theme: "dark", accent: "cyan-purple", density: "comfortable", animations: "full", font: "inter", sidebarCollapsed: false }),
  setPrefs: (p: any) => set(K.prefs, { ...v3store.getPrefs(), ...p }),
  // smart filters
  getSmart: () => get(K.smart, [] as Array<{ name: string; query: string; type?: string; minSize?: number; maxSize?: number; days?: number }>),
  addSmart: (f: any) => { const a = v3store.getSmart(); a.push(f); set(K.smart, a) },
  removeSmart: (name: string) => set(K.smart, v3store.getSmart().filter(f => f.name !== name)),
  // recent
  getRecent: (): number[] => get(K.recent, []),
  pushRecent: (id: number) => { let a = v3store.getRecent().filter(x => x !== id); a.unshift(id); if (a.length > 20) a = a.slice(0, 20); set(K.recent, a) },
  // audit log
  getAudit: () => get(K.audit, [] as Array<{ event: string; ts: number }>),
  logAudit: (event: string) => { const a = v3store.getAudit(); a.unshift({ event, ts: Date.now() }); if (a.length > 1000) a.length = 1000; set(K.audit, a) },
}

export function fmtBytes(n: number): string {
  if (!n || n < 0) return "0 B"
  const u = ["B","KB","MB","GB","TB"]; let i = 0; let v = n
  while (v >= 1024 && i < u.length-1) { v /= 1024; i++ }
  return v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2) + " " + u[i]
}
export function fmtTime(ms: number): string {
  if (!ms || !isFinite(ms) || ms < 0) return "--"
  const s = Math.round(ms/1000); if (s < 60) return s+"s"
  const m = Math.floor(s/60), r = s%60; if (m < 60) return m+"m "+r+"s"
  const h = Math.floor(m/60), rm = m%60; return h+"h "+rm+"m"
}
