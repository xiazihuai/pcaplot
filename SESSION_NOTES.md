# PCAplot 开发状态 — 2026-06-15

## 当前版本：v0.3.0-dev

## 今日进展（2026-06-15）

### 部署
- ✅ GitHub Pages 自动部署：`.github/workflows/deploy.yml`，每次 push master 自动构建部署
- ✅ `vite.config.ts` 配置 `base: '/pcaplot/'`
- ✅ 仓库：`https://github.com/xiazihuai/pcaplot`，线上地址：`https://xiazihuai.github.io/pcaplot/`

### 导出图例修复（重要）
- ✅ **形状修复**：导出图例不再全是圆形，`drawShapeOnCanvas` / `buildShapeSVG` 支持全部 8 种形状
- ✅ **多列布局修复**：导出图例不再永远是单列，改为**从 DOM 读取 `.legend-item` 精确位置**（getBoundingClientRect + getComputedStyle），保证导出与显示像素级一致
- ✅ **样式匹配**：背景颜色/边框/圆角、文字字体/字号/颜色均从 DOM CSS 读取，不再硬编码

### 文档
- ✅ PRD.md 更新至 v2.1，同步当前代码状态
- ✅ 新增：关键类型、部署说明、已删除功能、尚未实现、默认值速查 等章节

## 已完成（Phase 1 + 2 + 3 + 打磨）

### 数据与渲染
- ✅ 数据导入 (.txt/.csv，UTF-8/GBK/GB2312/UTF-16/ISO-8859-1 编码检测，制表符/逗号/空格分隔)
- ✅ 编码选择弹窗：自动检测置信度低时弹出，8种编码手动选择
- ✅ 散点图渲染 (ECharts 5+ Canvas)
- ✅ 大数据量优化：>10k点自动启用 ECharts large mode，简化数据格式
- ✅ 7套配色方案 (Tableau 10, Nature, ColorBrewer Set1, Wong 2011, Viridis, High Contrast, 暖色调)
- ✅ 8种形状 (圆形/正方形/三角上/三角下/菱形/五角星/六边形/十字)
- ✅ 散点无白色描边，纯色填充
- ✅ 离群检测：跨组椭圆包含检测，信息面板警告 + 候选列表，>50k点自动跳过

### 样式编辑
- ✅ 图标题（默认"PCA Plot"，可编辑/显示/隐藏/字号/加粗/颜色）
- ✅ 分组编辑：颜色、形状、大小、透明度（侧边栏 LayersPanel）
- ✅ 分组形状图标与主图 ECharts symbol 路径精确一致
- ✅ 坐标轴编辑：轴标题文字可编辑、轴线样式（线宽/颜色）、刻度（显示/方向/旋转）、轴标题字体、刻度标签字体
- ✅ 全局样式：点大小/透明度、网格线、背景（白/透明）、Tooltip 字体、画板尺寸、PCA主图尺寸与偏移
- ✅ 侧边栏四个标签页：分组 / 坐标轴 / 全局样式 / 信息

### 画布架构（重要）
- ✅ 三层分离：画板（pca-canvas，网格点背景，可设大小）→ PCA主图（可在画板内拖拽移动+X/Y偏移）→ 图例（独立定位，可自由拖拽）
- ✅ 画板默认 1200×900，PCA 主图默认 800×600
- ✅ 8个缩放手柄：四角+四边中点拖拽缩放 PCA 主图，宽高比锁定
- ✅ 适应窗口按钮

### 交互
- ✅ 多点高亮：Ctrl+点击切换，信息面板显示所有选中点
- ✅ 样本搜索：信息面板搜索框，按样本名/分组名实时过滤，点击选中
- ✅ 图例：自由拖拽移动、双击重命名、每行列数可选(1-10)、无标题、无颜色选择器
- ✅ 撤销/重做：Ctrl+Z/Y，≥50步，中文操作描述 toast 通知

### 导出
- ✅ 导出图片：PNG/JPEG 多DPI (72/150/300/600)，SVG 真矢量
- ✅ 导出范围：整个画板（含 PCA 主图 + 图例），背景透明（PNG/SVG）
- ✅ **图例导出从 DOM 读取位置**：Canvas 遍历 `.legend-item` 用 getBoundingClientRect 获取精确坐标，SVG 同理，100% 与显示一致
- ✅ 图例形状正确：`drawShapeOnCanvas` / `buildShapeSVG` 支持全部 8 种形状
- ✅ 图例多列布局正确：CSS Grid auto 列宽 → DOM 位置 → 导出精确还原
- ✅ 导出样式：.pcastyle JSON，含画板尺寸和图表偏移
- ✅ 导入样式：.pcastyle 完整恢复（配色方案同步、columns向后兼容）
- ✅ 样式表菜单仅保留 JSON 格式，移除 CSV 导出

### 已删除功能
- ❌ 置信椭圆（全局启用开关 + 分组级椭圆控制 + 置信度选择，已全部移除 UI）
- ❌ 图例"图例"标题
- ❌ 图例颜色选择器（颜色修改统一在分组面板中完成）
- ❌ 加号形状、倒三角形状（从 10 种精简为 8 种）
- ❌ 散点白色描边

### 基础设施
- ✅ 分级日志系统（DEBUG/INFO/WARN/ERROR/FATAL，环形缓冲）
- ✅ 版本管理（SemVer + CHANGELOG.md + sync-version.js）
- ✅ 通知 Toast 组件
- ✅ PRD.md 产品需求文档（v2.1）
- ✅ Git 版本控制 + GitHub 仓库
- ✅ GitHub Pages 自动部署（GitHub Actions）

## 项目结构
```
PCAplot/
├── package.json / tsconfig.json / vite.config.ts
├── index.html
├── PRD.md / PLAN.md / CHANGELOG.md / SESSION_NOTES.md
├── sample_data.csv
├── .gitignore
├── .github/workflows/deploy.yml    # GitHub Pages 自动部署
├── scripts/sync-version.js
├── public/favicon.svg
└── src/
    ├── App.tsx, App.css, main.tsx, vite-env.d.ts
    ├── types/            # data.ts, chart.ts, export.ts, command.ts, ui.ts
    ├── stores/           # useDataStore, useStyleStore（含命令模式 undo/redo）, useUIStore
    ├── services/         # parser, colorSchemes, shapeDefinitions, ellipse,
    │                       outlierDetection, exportImage, exportStyle, importStyle
    ├── components/
    │   ├── Toolbar/      # Toolbar.tsx + .css
    │   ├── Sidebar/      # Sidebar, LayersPanel, AxesPanel, GlobalStylePanel, InfoPanel + .css
    │   ├── Chart/        # ChartCanvas, chartOptions, ResizeHandles + .css
    │   ├── Legend/       # CustomLegend + .css
    │   └── common/       # NotificationToast, EncodingDialog + .css
    ├── utils/logger.ts
    └── constants/        # defaults.ts, version.ts
```

## 关键类型
```typescript
// LegendStyle 新增 columns 字段
interface LegendStyle {
  visible: boolean;
  position: { x: number; y: number };
  columns: number;  // 每行列数，1=单列，2+=多列网格
}
// ChartDimensions 含 offsetX, offsetY
interface ChartDimensions {
  width: number; height: number;
  lockAspectRatio: boolean;
  offsetX: number; offsetY: number;
}
// CanvasSize
interface CanvasSize { width: number; height: number; }
```

## 默认值速查
| 设置 | 默认值 |
|------|--------|
| 画板尺寸 | 1200 × 900 |
| PCA 主图 | 800 × 600 |
| 图表偏移 | X:60, Y:40 |
| 配色方案 | tableau10 |
| 点大小 | 8px |
| 点透明度 | 0.85 |
| 图例位置 | (24, 8) |
| 图例列数 | 1 |
| 背景 | white |
| 图表标题 | "PCA Plot" |
| 撤销栈 | 50 步 |

## 尚未实现
- [ ] Tauri 桌面打包（src-tauri/）
- [ ] 原生文件对话框
- [ ] CSP 安全策略
- [ ] 单元测试（parser, ellipse, colorSchemes, outlierDetection）
- [ ] 安装包 <50MB

## 技术栈
- React 18 + TypeScript + Vite 5
- ECharts 5.5（canvas 渲染器）
- Zustand 4.5（命令模式 undo/redo）

## 部署
- **线上地址**：https://xiazihuai.github.io/pcaplot/
- **GitHub 仓库**：https://github.com/xiazihuai/pcaplot
- **部署方式**：GitHub Actions（`.github/workflows/deploy.yml`），push master 自动部署
- **Base path**：`/pcaplot/`（vite.config.ts）

## 启动
```bash
cd d:/vibecoding/PCAplot
npm run dev          # http://localhost:5173/pcaplot/
npm run build        # dist/
npm run preview      # 预览生产构建
```

## 今日进展（2026-06-16）

### 3D PCA 功能 ✅
- ✅ **自动检测**：输入文件有5列及以上（含PC3）时自动切换3D散点图
- ✅ **echarts-gl**：npm install echarts-gl，使用 scatter3D 系列
- ✅ **数据模型**：RawDataRow/ParsedDataRow 新增 pc3 字段，ParseResult 新增 is3D 标志
- ✅ **3D渲染**：grid3D + xAxis3D/yAxis3D/zAxis3D + viewControl（旋转/缩放/平移）
- ✅ **2D/3D 切换**：导入4列数据→2D模式，导入5列数据→3D模式，互相切换正确
- ✅ **3D交互**：鼠标旋转/缩放场景；3D模式禁用DOM拖拽（避免冲突）
- ✅ **侧边栏**：AxesPanel 3D模式自动显示Z轴标题输入框
- ✅ **信息面板**：选中点详情显示PC3值（当不为0时）；搜索支持pc3
- ✅ **图例**：保持不变（HTML overlay，独立于渲染器）
- ✅ **导出**：3D WebGL模式直接从canvas抓取toDataURL（preserveDrawingBuffer方案），2D模式不变
- ✅ **样式导出/导入**：.pcastyle JSON 和 CSV 均支持 pc3/is3D/zAxisTitle
- ✅ **离群检测**：3D模式下自动跳过（信息面板会提示"3D模式下暂不支持离群检测"待添加）
- ✅ **向后兼容**：4列2D数据所有功能不变

### 修改文件清单
| 文件 | 变更 |
|------|------|
| package.json | 新增 `echarts-gl` 依赖 |
| src/types/data.ts | RawDataRow/ParsedDataRow 加 pc3，ParseResult 加 is3D |
| src/types/ui.ts | SelectedPointInfo 加 pc3 |
| src/types/export.ts | ExportDataRow/PcaStyleJSON.data 加 pc3/is3D/zAxisTitle |
| src/services/parser.ts | 5列检测，解析pc3，is3D 标志 |
| src/stores/useDataStore.ts | is3D/zAxisTitle 状态，3D模式跳过离群检测 |
| src/components/Chart/chartOptions.ts | 新增 build3DEChartsOption() 函数 (scatter3D) |
| src/components/Chart/ChartCanvas.tsx | import echarts-gl，2D/3D分支渲染，禁用3D拖拽 |
| src/components/Sidebar/AxesPanel.tsx | 3D模式显示Z轴标题输入 |
| src/components/Sidebar/InfoPanel.tsx | 选中点详情显示PC3，搜索传递pc3 |
| src/services/exportImage.ts | 3D WebGL模式从canvas直接抓取 |
| src/services/exportStyle.ts | .pcastyle/CSV 包含 pc3/is3D/zAxisTitle |
| src/services/importStyle.ts | 导入支持 pc3/is3D/zAxisTitle |

### 测试数据
- `sample_data.csv` — 4列2D数据（90行，3组）
- `sample_data_3d.csv` — 5列3D数据（90行，3组，用于测试3D模式）

### 3D 第二轮修复（2026-06-16 下午）
- ✅ **3D 盒子溢出**：boxWidth/Height/Depth 从100→80，viewControl.distance 从200→250，轴标题不再被剪切
- ✅ **3D 形状系统**：新增 `Shape3DDefinition` 类型和7种3D形状（圆形/方形/三角/菱形/圆角方/图钉/箭头），代码见 `src/services/shapeDefinitions.ts`
  - echarts-gl 仅支持内置 symbol：`circle`, `square`, `roundRect`, `triangle`, `diamond`, `pin`, `arrow`
  - `map2DShapeTo3DId()` / `map3DShapeTo2DId()` 双向映射
  - `get3DShapeFor2DId()` 供面板/图例使用
  - `get3DSymbol()` 供图表渲染使用
- ✅ **LayersPanel 3D 适配**：形状下拉框在3D模式显示7种3D形状名；选择后通过反查存回2D ID，保证与图表一致
- ✅ **CustomLegend 3D 适配**：图例图标在3D模式使用映射后的3D形状SVG
- ✅ **图表不更新修复**：3D渲染路径新增 `instance.clear()` 在 `setOption` 前，强制 echarts-gl 重建WebGL场景

### 第二轮修改文件
| 文件 | 变更 |
|------|------|
| src/services/shapeDefinitions.ts | 新增 SHAPES_3D 数组、Shape3DDefinition 接口、6个工具函数 |
| src/components/Chart/chartOptions.ts | 用共享映射替换本地 switch；box 缩小+distance 增大 |
| src/components/Chart/ChartCanvas.tsx | 3D渲染前加 instance.clear() |
| src/components/Sidebar/LayersPanel.tsx | 3D模式下使用3D形状下拉框+图标 |
| src/components/Legend/CustomLegend.tsx | 3D模式下图例图标使用映射后的形状 |

### 3D 第三轮修复（2026-06-16 下午）
- ✅ **Box 尺寸折中**：boxWidth/Height/Depth 从 80 调整为 90（介于初版 100 和上版 80 之间），平衡可见性与溢出
- ✅ **3D 导出图片缩放修复**：根因是 WebGL canvas 的 `toDataURL()` 抓取分辨率和输出画布 pixelRatio 不一致，`drawImage` 用两参数版按原始尺寸绘制导致内容缩在左上角。修复：在 `exportRaster()` 中统一计算目标宽高 `cw`/`ch`，改用五参数 `drawImage(img, x, y, w, h)` 强制缩放到正确尺寸。SVG 导出原本就有 `width`/`height` 属性，无需修改。

### 第三轮修改文件
| 文件 | 变更 |
|------|------|
| src/components/Chart/chartOptions.ts | grid3D boxWidth/Height/Depth: 80→90 |
| src/services/exportImage.ts | exportRaster 中 cw/ch 提早计算，drawImage 改用五参数版 |

### 3D 第四轮修复（2026-06-16 下午）
- ✅ **AxesPanel 3D 适配**：3D 模式下仅显示轴标题编辑（X/Y/Z），隐藏轴线样式/刻度/字体等 2D 专用控件，并提示"3D 模式下坐标轴样式由场景视图控制"
- ✅ **背景透明修复**：
  - 根因：`.chart-canvas-wrapper` CSS 硬编码白色背景+阴影，覆盖了 ECharts 的 `backgroundColor: 'transparent'`
  - 修复：`ChartCanvas.tsx` 通过 inline style 动态设置 background/border/boxShadow，响应 store 的 `background` 状态
  - CSS 移除硬编码值
  - 导出图片同步：透明背景时跳过阴影/白色背景/边框绘制（raster+SVG）
- ✅ **3D 导出标题缺失修复**：
  - 根因：echarts-gl WebGL canvas 的 `toDataURL()` 可能不包含 ECharts title 组件
  - 修复：3D 模式下在导出画布上手动绘制标题文字（Canvas fillText / SVG text 元素），读取 `chartTitle` store 的字体/颜色/加粗等样式

### 第四轮修改文件
| 文件 | 变更 |
|------|------|
| src/components/Sidebar/AxesPanel.tsx | 3D 模式仅显示轴标题，隐藏2D专用样式控件 |
| src/components/Chart/ChartCanvas.tsx | wrapper inline style 动态响应 background 设置 |
| src/components/Chart/ChartCanvas.css | 移除硬编码 background/border/boxShadow |
| src/services/exportImage.ts | 导出传递 background/chartTitle；透明背景跳过阴影；3D 手动绘制标题 |

### 3D 第五轮修复（2026-06-16 下午）
- ✅ **全局样式网格线隐藏**：3D 模式下 `GlobalStylePanel` 隐藏网格线设置（grid3D 的 splitLine 选项结构与 2D grid 不同，暂不适配）
- ✅ **导出图例文字对齐修复**：
  - 根因：icon Y 使用 `(top+bottom)/2`（垂直中心），text Y 使用 `bottom - 2*PR`（底部偏移），两者计算方式不一致
  - 修复：Canvas 导出 text Y 改用垂直中心 + `textBaseline: 'middle'`；SVG 导出 text Y 改用垂直中心 + `dominant-baseline="central"`，与 icon 垂直中心对齐方式一致

### 第五轮修改文件
| 文件 | 变更 |
|------|------|
| src/components/Sidebar/GlobalStylePanel.tsx | 导入 is3D；3D 模式隐藏网格线设置区块 |
| src/services/exportImage.ts | 图例文字 Y 改用垂直中心对齐（Canvas + SVG） |

### 启动
```bash
cd d:/vibecoding/PCAplot
npm run dev          # http://localhost:5173/pcaplot/
```

## 新对话开始方式
"请阅读 d:/vibecoding/PCAplot/SESSION_NOTES.md 和 d:/vibecoding/PCAplot/PRD.md，继续开发"
