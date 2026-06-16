<p align="center">
  <img src="public/favicon.svg" width="80" alt="PCAplot logo" />
</p>

<h1 align="center">PCAplot</h1>

<p align="center">
  <strong>WYSIWYG PCA Visualization Tool</strong>
  <br>
  Import · Edit · Export — No code required
</p>

<p align="center">
  <a href="https://xiazihuai.github.io/pcaplot/"><strong>🚀 Live Demo</strong></a>
  &nbsp;|&nbsp;
  <a href="#features">Features</a>
  &nbsp;|&nbsp;
  <a href="#quick-start">Quick Start</a>
  &nbsp;|&nbsp;
  <a href="#usage">Usage</a>
</p>

---

## ✨ Features

- **📥 Drag & Drop Import** — Supports `.csv` and `.txt` with auto encoding detection (UTF-8 / GBK / GB2312 / UTF-16 / ISO-8859-1)
- **🎨 7 Color Schemes** — Tableau 10, Nature, ColorBrewer Set1, Wong 2011 (colorblind-friendly), Viridis, High Contrast, Custom Warm
- **🔷 8 Point Shapes** — Circle, square, triangle (up/down), diamond, pentagram, hexagon, cross
- **🖱️ WYSIWYG Editing** — Real-time interactive editing; every change renders instantly
- **📐 Three-layer Canvas** — Canvas → Chart → Legend, each independently movable and resizable
- **🏷️ Movable Legend** — Freely drag the legend anywhere on the canvas; configurable columns (1–10) for multi-column grid layout
- **🔍 Multi-Select & Search** — Ctrl+click for multi-point selection; search by sample/group name
- **⏮️ Undo/Redo** — Ctrl+Z / Ctrl+Y with up to 50 history steps
- **📤 Publication-grade Export** — PNG (transparent bg) / JPEG / SVG at 72/150/300/600 DPI
- **💾 Style Export/Import** — `.pcastyle` JSON preserves all visual state for reproducibility
- **⚡ Large Dataset Optimized** — Auto-switches to ECharts large mode for 10K+ points

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/xiazihuai/pcaplot.git
cd pcaplot

# Install
npm install

# Develop
npm run dev          # → http://localhost:5173

# Build
npm run build        # → dist/

# Preview build
npm run preview
```

Or just use the **[Live Demo](https://xiazihuai.github.io/pcaplot/)** — no installation needed.

---

## 📖 Usage

### 1. Prepare Your Data

PCAplot expects a table with sample name, group name, PC1, and PC2:

```csv
SampleName,Group,PC1,PC2
Sample1,Control,2.5,-1.3
Sample2,Control,3.1,-0.8
Sample3,Treatment,-1.2,2.7
Sample4,Treatment,-0.9,3.1
```

> 💡 Works with any delimiter (comma, tab, space). Headers are auto-detected.

### 2. Import & Visualize

Click **Import Data** or drag your file onto the page. The scatter plot renders instantly.

### 3. Edit (WYSIWYG)

| Panel | What you can edit |
|-------|-------------------|
| **Groups** | Color, shape, size, opacity per group; double-click to rename |
| **Axes** | Axis title text, line width/color, tick direction, label rotation, font styles |
| **Global Style** | Canvas size, chart size & position, title, legend columns, grid lines, background, tooltip font |

### 4. Export

- **Image**: PNG / JPEG / SVG at 72–600 DPI
- **Style**: `.pcastyle` JSON — import later to restore your exact visual settings

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Charts | ECharts 5.5 (Canvas renderer) |
| State | Zustand 4.5 (command-pattern undo/redo) |
| Legend | Custom React overlay (draggable, grid layout) |

---

## 📁 Project Structure

```
src/
├── types/            # TypeScript type definitions
├── stores/           # Zustand stores (data, style, UI)
├── services/         # Core logic (parser, export, import, color schemes, shapes)
├── components/
│   ├── Toolbar/      # Top toolbar
│   ├── Sidebar/      # Right panel (Groups / Axes / Global / Info)
│   ├── Chart/        # ECharts canvas + resize handles
│   ├── Legend/       # Draggable legend overlay
│   └── common/       # Toast notifications, encoding dialog
├── utils/            # Logger
└── constants/        # Defaults, version
```

---

## 🔧 Configuration

| Setting | Default |
|---------|---------|
| Canvas size | 1200 × 900 |
| Chart size | 800 × 600 |
| Color scheme | Tableau 10 |
| Point size | 8px |
| Point opacity | 0.85 |
| Legend columns | 1 (vertical) |
| Undo stack | 50 steps |

---

## 📄 License

MIT

---

<p align="center">
  <sub>Built with ❤️ for researchers who just want to plot their PCA results.</sub>
</p>
