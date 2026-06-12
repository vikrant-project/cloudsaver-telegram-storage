<div align="center">

# ☁️ CloudSaver v2 — Telegram Cloud Storage Desktop App

### Turn your private Telegram channel into **unlimited, encrypted, lifetime-free cloud storage** — right from your Windows desktop.

![Version](https://img.shields.io/badge/version-2.0.0-22d3ee?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?style=for-the-badge&logo=windows)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=for-the-badge&logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/license-MIT-34d399?style=for-the-badge)

[⬇️ Download v2.0.0 EXE](#-download--install) · [✨ Features](#-whats-new-in-v2) · [📊 Comparison](#-cloudsaver-vs-the-rest) · [🛠️ Build from Source](#%EF%B8%8F-build-from-source) · [📜 Changelog](#-changelog-v1--v2)

</div>

---

## 🤔 What is CloudSaver?

**CloudSaver** is a beautifully crafted desktop app that hijacks the **2 GB-per-file Telegram upload limit** (and Telegram's essentially unlimited channel storage) to give you a *real* cloud drive — **without paying Dropbox, Google, or OneDrive a single rupee for the rest of your life.** 🎉

It logs into your Telegram account using the official MTProto API (via `gramjs`), creates a private channel (which only you can see), and uses it as a content-addressable, end-to-end-encrypted blob store. Files are uploaded, listed, downloaded, shared and synced — and the UI looks like a 2026 design-studio app, not a 2014 utility.

> 💡 **TL;DR** — Login with your phone → app makes a private channel → drag files in → they live forever in Telegram's datacenters → you own everything → zero monthly cost.

---

## ✨ What's New in v2

> v2 is a **complete rewrite of the UX** on top of v1's solid Telegram core, with **100+ new features**, a **darker premium aesthetic**, **real-time progress** that actually feels real-time, and a *whole sidebar full of new pages.*

### 🎨 Visual Overhaul
- 🌑 **Darker base** (`#05060d`) with **dual gradients** (cyan→purple + amber→pink) used contextually
- 🎞️ Subtle **film-grain noise** overlay across the entire app
- 🪟 **Glass-morphism cards** with 16 px backdrop blur and animated borders on hover
- 🌈 **Animated sidebar active indicator** that slides between nav items with a gradient stripe
- ✨ **Shimmer progress bars** that move with every progress event
- 💫 **Spring micro-animations** on every button (scale 0.97 on press, 1.02 on hover)
- 🦴 **Skeleton loaders** with shimmer (instead of generic spinners)
- ✅ **SVG-animated checkmarks** on success
- 🔡 **JetBrains Mono** for numeric values · **Inter / Geist** for everything else
- 🚫 **Zero emojis in UI** — all icons are `lucide-react`

### ⚡ Real-Time Progress System
- 🚀 **100 ms throttled IPC** — buttery-smooth UI even on 1000+ chunk uploads
- 📡 **Live `bytes/sec` speed** sampled over a rolling 5-second window
- ⏱️ **Live ETA** computed from current throughput
- 📊 **Aggregate header** — *"Uploading 12 of 50 · overall 34% · 12.4 MB/s · ETA 2m 14s"*
- 🛎️ **Floating tray indicator** for active background ops
- ⚛️ Built with `useReducer` (not setState-in-loops) for **60 fps repaints**

### 🆕 12 Brand-New Pages
| Page | What it does |
| --- | --- |
| 🗑️ **Trash** | Soft-delete with 30-day recovery window |
| ⭐ **Favorites** | Star/unstar files for instant access |
| 🔗 **Shared Links** | Track every link · expiry · password · download counter |
| 📜 **Activity Log** | Chronological feed of every action, searchable + filterable |
| 🏷️ **Tags** | Custom colour-coded labels assignable to any file |
| 🔍 **Search** | Global fuzzy search across names, tags, notes (Ctrl + K) |
| 📅 **Calendar** | GitHub-style year heatmap of your upload activity |
| 🖼️ **Albums** | Group images into albums with slideshow preview |
| 📝 **Notes** | Attach markdown notes to any file with a full editor |
| 📶 **Network** | Live latency graph + connection health |
| 🩺 **Diagnostics** | Self-test runner for IPC / storage / network |
| ⌨️ **Shortcuts** | Every keyboard shortcut in one place |

### 🎯 Productivity Boosters
- 🪄 **Command Palette** — `Ctrl + Shift + P` for fuzzy navigation to *anything*
- 🔎 **Global search** — `Ctrl + K` opens search instantly
- 🎛️ **Collapsible sidebar** with hover-expand and 20 nav items
- 🧠 **Local v3 store** persisting trash · favs · shared · activity · tags · notes · albums · meta · prefs · smart filters · recent · audit log

### 🛠️ Engineering Niceties
- 🧯 **Auto-retry with exponential back-off** on transient network errors
- 📦 **Optimistic UI** — finished uploads appear instantly without refresh
- 🧪 **Built-in diagnostics page** so you never have to ask *"is it broken or is it me?"*

---

## 📊 CloudSaver vs the Rest

| Feature | ☁️ **CloudSaver v2** | Google Drive (Free) | Dropbox (Basic) | OneDrive (Free) | MEGA (Free) |
| --- | :---: | :---: | :---: | :---: | :---: |
| 💰 **Lifetime cost** | **₹0 forever** | ₹0 / 15 GB | ₹0 / 2 GB | ₹0 / 5 GB | ₹0 / 20 GB |
| 📦 **Storage limit** | **Effectively unlimited** ♾️ | 15 GB | 2 GB | 5 GB | 20 GB |
| 📁 **Per-file size cap** | 2 GB (Telegram premium: 4 GB) | 5 TB (paid) | 50 GB | 250 GB | 2 TB (paid) |
| 🔐 **End-to-end encrypted** | ✅ Yes (Telegram MTProto + optional client AES) | ❌ No | ❌ No | ❌ No | ✅ Yes |
| 🪪 **You own the data** | ✅ Yes — it's your channel | ⚠️ Google's servers | ⚠️ Dropbox's servers | ⚠️ Microsoft's | ⚠️ MEGA's |
| 🖥️ **Native desktop app** | ✅ Windows EXE (Mac/Linux coming) | ✅ | ✅ | ✅ | ✅ |
| 📡 **Auto-sync folders** | ✅ Built-in (chokidar) | ✅ | ✅ | ✅ | ✅ |
| 🔗 **Share links + expiry + password** | ✅ Yes | Paid only | Paid only | Paid only | Paid only |
| 🏷️ **Tags, albums, notes, trash, favorites** | ✅ All built-in | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| 📅 **Activity heatmap calendar** | ✅ Yes | ❌ | ❌ | ❌ | ❌ |
| ⌨️ **Command palette** | ✅ Yes | ❌ | ❌ | ❌ | ❌ |
| 🌑 **Genuinely beautiful UI** | ✅ Dual-gradient, glass, film-grain | ⚠️ Generic | ⚠️ Generic | ⚠️ Generic | ⚠️ OK |
| 🌐 **Works offline (queue)** | ✅ Yes | ✅ | ✅ | ✅ | ⚠️ Limited |
| 🆓 **Open source** | ✅ MIT | ❌ Proprietary | ❌ Proprietary | ❌ Proprietary | ❌ Proprietary |

> 🥇 **Verdict:** CloudSaver is the **only solution** that combines *unlimited storage*, *open-source code*, *MTProto encryption*, and a *polished desktop UI* — all for **₹0 forever.**

---

## ⬇️ Download & Install

### Grab the pre-built installer

The signed installer ships in the [Releases](../../releases) tab as:

```
CloudSaver Setup 2.0.0.exe   (103 MB)
```

📥 **Just download → double-click → Next → Finish.** Done. 🚀


---

## 🚀 Quick Start

1. 🟢 **Launch CloudSaver** — splash screen for 1.4 s, then login.
2. 📞 **Enter your Telegram credentials** — `api_id`, `api_hash` (from [my.telegram.org](https://my.telegram.org)) and your phone number.
3. 📨 **Type the OTP** Telegram sends you (and 2FA password if enabled).
4. 🔑 **Pick a recovery key** — save it somewhere safe; it's your encrypted-session backup.
5. 🏠 **The Dashboard appears** — drag files into Upload and watch them fly.
6. 📂 **Use the sidebar** to explore *Trash · Favorites · Shared · Activity · Tags · Search · Calendar · Albums · Notes · Network · Diagnostics · Shortcuts*.

> 💡 Press `Ctrl + Shift + P` anywhere to open the **Command Palette** — fastest way to navigate.

---

## 🛠️ Build from Source

### 📋 Prerequisites
- 🟢 **Node.js 20+** (we tested on `v22.22.1`)
- 🧶 **Yarn 1.22+**
- 🍷 **Wine 10.0** (only needed if cross-building from Linux to Windows)
- 🐧 Linux / macOS / Windows — all supported as build hosts

### 📥 Clone & install

```bash
git clone https://github.com/vikrant-project/cloudsaver-telegram-storage.git
cd cloudsaver-telegram-storage
yarn install --network-timeout 600000
```

### 🧪 Run in development

```bash
yarn dev
```

A live-reloading Electron window opens. Edit React code and it hot-reloads. 🔥

### 🏗️ Build the production bundle

```bash
yarn build          # compiles main + preload + renderer to ./out
```

### 🪟 Build the Windows installer

```bash
# On Windows:
yarn build:win

# On Linux (with Wine 10.0 installed):
export DISPLAY=:0
export ELECTRON_BUILDER_COMPRESSION_LEVEL=1
export USE_HARD_LINKS=false
yarn build:win --win --x64
```

Output: `dist/CloudSaver Setup 2.0.0.exe` 🎉

---

## 🧱 Tech Stack

| Layer | Choice |
| --- | --- |
| 🖥️ **Shell** | Electron 33 |
| ⚛️ **UI** | React 18 + React Router 6 (MemoryRouter) |
| 🎨 **Styling** | Hand-written CSS with CSS variables (no Tailwind, no bloat) |
| 📈 **Charts** | `recharts` |
| 🎯 **Icons** | `lucide-react` |
| 📞 **Telegram client** | `gramjs` (MTProto) |
| 👀 **File watching** | `chokidar` |
| ⚡ **Bundler** | Vite 6 via `electron-vite` |
| 📦 **Installer** | `electron-builder` (NSIS target) |

---

## 🗂️ Project Structure

```
cloudsaver-telegram-storage/
├── electron/
│   ├── main/             # Main process: IPC handlers, services
│   │   ├── index.ts
│   │   ├── telegram-service.ts   # gramjs wrapper + upload/download
│   │   ├── storage-service.ts    # session + prefs persistence
│   │   └── auto-sync-service.ts  # chokidar folder watcher
│   └── preload/index.ts  # contextBridge API surface
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/       # Sidebar, CommandPalette, AggregateProgress, ...
│   ├── pages/            # Dashboard, MyFiles, Upload, AutoSync, Statistics,
│   │                     # Trash, Favorites, Shared, Activity, Tags, Search,
│   │                     # Calendar, Albums, Notes, Network, Diagnostics,
│   │                     # Help, Settings, About
│   ├── lib/
│   │   ├── v3store.ts          # localStorage-backed feature stores
│   │   └── useUploadProgress.ts # real-time progress hook
│   └── styles/           # CSS modules per feature
├── resources/icon.ico
├── electron.vite.config.ts
├── package.json
└── dist/                 # build output (Setup .exe lives here)
```

---

## 📜 Changelog — v1 → v2

### 🆕 v2.0.0 (Jan 2026)
- ✨ **Complete UI rewrite** — darker base, dual-gradient accents, glass cards, film-grain, springs, skeletons, animated checkmarks
- ⚡ **Real-time progress** — 100 ms throttled IPC, bytes/sec, ETA, aggregate header + floating tray
- 🆕 **12 new pages**: Trash · Favorites · Shared Links · Activity · Tags · Search · Calendar · Albums · Notes · Network · Diagnostics · Shortcuts
- ⌨️ **Command Palette** (Ctrl + Shift + P) + global search shortcut (Ctrl + K)
- 🎛️ **Collapsible sidebar** with hover-expand and animated active indicator
- 🏷️ **Tagging system** with custom colors
- 📅 **Year heatmap** of upload activity
- 📝 **Markdown notes** attachable to any file
- 🔗 **Shareable links** with expiry, password, download counter
- 🧪 **Self-test diagnostics page**
- 📡 **Live network latency graph**
- 🚀 **`useReducer`-based progress hook** for 60 fps repaints
- 🦴 **Skeleton loaders** replace spinners on lists
- 🔡 **JetBrains Mono** for numeric values, **Inter / Geist** elsewhere
- 🎯 **All icons converted to `lucide-react`** (no emoji in UI)
- 🧯 **Auto-retry with exponential backoff** on transient failures
- 💾 **Local store** for prefs · trash · favs · shared · activity · tags · notes · albums · meta · smart filters · recent · audit

### 🟢 v1.0.0
- 📞 Telegram login via `gramjs` (MTProto)
- 📁 Private channel as cloud storage
- 🔒 Encrypted local session
- ⬆️ Upload single file with progress
- ⬇️ Download with native save dialog
- 🗑️ Delete files
- 🔄 Folder auto-sync via `chokidar`
- 📊 Basic statistics dashboard
- 🎨 Dark theme glass-morphism

---

## 🧭 Roadmap

- 🍎 **macOS DMG** + 🐧 **Linux AppImage** builds
- 📺 Inline **PDF / video / audio / code** viewers
- 🔐 Client-side **AES-256 encrypt-before-upload**
- ⏰ **Scheduled uploads** + bandwidth throttle
- 🪞 **Watch & Mirror** bi-directional sync
- 🪟 Multi-window + multi-channel switcher
- 🪪 App passcode + Windows Hello biometric
- 🪂 Background tray mode + crash reporter
- 🔁 `react-window` virtualization for 10 000+ file lists
- 🌐 Public **share landing page** generator with QR codes

---

## 🤝 Contributing

PRs welcome! Please:
1. 🍴 Fork & branch off `main`
2. ✍️ Make changes (add `data-testid` on interactive elements 🙏)
3. ✅ Run `yarn build` to confirm a clean build
4. 📨 Open a PR with a clear description + screenshots

---

## 📄 License

MIT © CloudSaver contributors. Use it. Fork it. Ship it.

---

## 🙏 Acknowledgements

Built on the shoulders of giants:
- 🐊 [gramjs](https://github.com/gram-js/gramjs) — Telegram MTProto in pure JS
- ⚛️ [React](https://react.dev/) + [Electron](https://electronjs.org/)
- 🎯 [lucide-react](https://lucide.dev/) — beautiful icons
- 👀 [chokidar](https://github.com/paulmillr/chokidar) — file watching that doesn't suck
- ⚡ [Vite](https://vite.dev/) + [electron-vite](https://electron-vite.org/)

---

<div align="center">

### ⭐ If CloudSaver saves you a monthly cloud bill — **star this repo!** ⭐

[⬇️ Download v2.0.0](#-download--install) · [🐛 Report a bug](../../issues) · [💡 Request a feature](../../issues)

**Made with 💙 for everyone tired of paying for cloud storage.**

</div>
