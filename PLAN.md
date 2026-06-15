# PCA 结果可视化工具 — 实施计划

## 背景

基于 `PCAplot软件PRD.docx` 构建一个纯前端的 PCA 结果可视化工具。用户可以导入 PCA 数据文件（.txt/.csv），自动生成散点图，对图形进行 WYSIWYG 实时编辑，最终导出为高质量图片或带样式信息的数据文件。

## 技术选型

| 决策 | 选择 | 理由 |
|---|---|---|
| 框架 | React 18 + TypeScript + Vite | PRD建议，生态丰富 |
| 可视化 | ECharts 5+ | 内置散点图、坐标轴、tooltip、大数据量优化（large mode/WebGL） |
| 状态管理 | Zustand | 轻量，TypeScript友好，中间件支持undo/redo |
| 置信椭圆 | ECharts graphic elements（polygon） | 在坐标系中渲染，64点近似椭圆 |
| 图例 | HTML覆盖层（自定义React组件） | 完整控制交互：拖拽、双击重命名、拾色器、形状选择器 |
| 桌面打包 | Tauri（可选Phase 4） | 原生文件对话框，<50MB安装包 |

## 项目结构

```
PCAplot/
├── index.html
├── package.json / tsconfig.json / vite.config.ts
├── .gitignore / CHANGELOG.md
├── scripts/
│   └── sync-version.js         # 从package.json同步版本号到源码
├── src/
│   ├── main.tsx, App.tsx
│   ├── types/
│   │   ├── data.ts          # RawDataRow, GroupInfo, SkippedRowInfo
│   │   ├── chart.ts         # AxisStyle, GridStyle, LegendStyle, EllipseSettings, ChartDimensions
│   │   ├── export.ts        # PcaStyleJSON, ImageExportOptions
│   │   └── command.ts       # Command interface (undo/redo)
│   ├── stores/
│   │   ├── useDataStore.ts  # 数据（不可变，导入后不变）、分组推导
│   │   ├── useStyleStore.ts # 所有可视化样式（这是undo/redo的目标）
│   │   ├── useUIStore.ts    # 临时UI状态（选中点、面板切换、弹窗）
│   │   └── undoRedoMiddleware.ts
│   ├── services/
│   │   ├── parser.ts           # 文件解析（编码检测、分隔符检测、表头检测）
│   │   ├── colorSchemes.ts    # 7套配色方案（Tableau 10, Nature, ColorBrewer Set1, Wong 2011, Viridis, High Contrast, Custom Warm）
│   │   ├── shapeDefinitions.ts # 10种形状的SVG路径定义
│   │   ├── ellipse.ts         # 置信椭圆计算（协方差→特征值→椭圆边界）
│   │   ├── outlierDetection.ts # 跨组离群检测
│   │   ├── exportImage.ts     # PNG/SVG/TIFF/JPEG导出
│   │   ├── exportStyle.ts     # 样式导出（.pcastyle JSON + 带注释的.csv）
│   │   └── importStyle.ts     # 样式文件重新导入
│   ├── components/
│   │   ├── Toolbar/           # 导入|导出图片▼|导出样式|撤销重做|适应窗口|重置
│   │   ├── Sidebar/           # 图层/分组 | 坐标轴 | 全局样式 | 信息（标签页）
│   │   ├── Chart/             # ECharts画布 + 8个缩放手柄
│   │   ├── Legend/            # HTML覆盖层图例（可拖拽、可编辑）
│   │   └── common/            # ColorPicker, ShapeSelector, FontSelector, SliderInput
│   ├── hooks/                 # useChartInstance, useChartEvents, useKeyboardShortcuts, useResizeHandles
│   ├── utils/
│   │   ├── logger.ts          # 分级日志系统（DEBUG/INFO/WARN/ERROR/FATAL），内存环形缓冲
│   │   ├── encoding.ts        # 字符集检测工具
│   │   ├── math.ts            # 协方差矩阵、特征值等数学工具
│   │   └── debounce.ts        # 防抖/节流工具
│   └── constants/
│       ├── defaults.ts        # 所有默认值
│       └── version.ts         # APP_VERSION + APP_NAME + BUILD_TIME（构建时自动生成）
```

## 数据流

```
导入文件 → parser（编码检测→分隔符检测→表头检测→校验）
  → useDataStore（分组推导、颜色/形状分配）
  → ChartCanvas（构建ECharts option → setOption渲染）
  → 用户编辑 → useStyleStore（通过undoRedoMiddleware）
  → chartOptions重新计算 → ECharts增量更新
  → 导出（图片：getDataURL + 下载链接；样式：JSON序列化 + 下载）
```

## 实施阶段

### Phase 1: 基础MVP（当前）

1. **项目脚手架** — Vite + React + TS + ECharts + Zustand，配置ESLint + Prettier
2. **版本管理基础设施** — `.gitignore`、`CHANGELOG.md`、`scripts/sync-version.js`、`src/constants/version.ts`，初始化 `package.json` version 为 `0.1.0`
3. **日志系统** — `src/utils/logger.ts`：分级日志（DEBUG/INFO/WARN/ERROR/FATAL）、内存环形缓冲（1000条）、开发/生产模式切换、关键模块埋点
4. **数据解析** — parser.ts：UTF-8/GBK编码检测、制表符/逗号/空格分隔检测、表头检测、缺失值处理（带日志埋点）
5. **数据Store** — useDataStore：导入文件、分组推导、轴标题提取
6. **配色与形状** — 3套配色方案 + 10种形状定义
7. **散点图渲染** — ChartCanvas：ECharts初始化、每个分组一个scatter series、坐标轴、基础tooltip
8. **基础工具栏** — 导入按钮、导出PNG（72DPI）、重置按钮（带操作日志）
9. **信息面板** — 点击数据点显示详情（样本名、组名、PC1、PC2）
10. **通知组件** — toolbar右侧toast系统，对INFO/WARN/ERROR显示简短提示，错误时提供"导出日志"按钮

**退出标准**: 用户拖入.csv → 看到散点图（分组不同颜色/形状）→ 点击点查看详情 → 导出PNG

### Phase 2: 样式编辑 + WYSIWYG

1. **完整StyleStore** — 所有可视化属性（颜色覆盖、形状覆盖、大小、透明度、坐标轴、网格、图例、置信椭圆、画布尺寸）
2. **撤销/重做** — undoRedoMiddleware（命令模式，≥50步），Ctrl+Z/Y快捷键
3. **图层面板** — 分组列表，每组可编辑颜色/形状/大小
4. **坐标轴面板** — 完整坐标轴样式设置
5. **全局样式面板** — 点大小、透明度、背景、网格线、置信椭圆开关
6. **自定义图例** — HTML覆盖层，可拖拽、双击重命名、点击改颜色、点击改形状
7. **拾色器 + 形状选择器** — 弹出式组件
8. **剩余4套配色** — Nature, ColorBrewer Set1, High Contrast, Custom Warm
9. **字体选择** — 系统字体检测 + 字体选择下拉
10. **Tooltip样式** — 独立字体/字号、300ms延迟

### Phase 3: 高级功能

1. **置信椭圆** — 协方差矩阵→特征值→椭圆边界计算 → ECharts graphic polygon渲染
2. **离群检测** — 跨组椭圆包含检测 + 右下角警告提示 + 明细列表
3. **8个缩放手柄** — 拖拽缩放画布，坐标自动等比映射，宽高比锁定
4. **完整导出** — SVG/TIFF/JPEG、DPI选项(72/150/300/600)、透明背景
5. **样式导出/导入** — .pcastyle JSON + 带注释的.csv，完整状态恢复
6. **编码选择弹窗** — 自动检测失败时手动选择
7. **适应窗口** — 响应式缩放
8. **性能优化** — >10k点时启用ECharts large mode

### Phase 4: 打磨（可选）

1. 全面错误处理和边界情况
2. 单元测试（parser, ellipse, color schemes, outlier detection）
3. Tauri桌面打包（原生文件对话框）
4. CSP配置、依赖审计

## 核心类型

```typescript
// 数据
interface RawDataRow { sampleName: string; groupName: string; pc1: number; pc2: number; }
interface GroupInfo { name: string; originalName: string; count: number; color: string; shape: number; pointSize: number; }

// 样式
interface AxisStyle { showAxisLine, axisLineWidth, axisLineColor, showTick, tickDirection, tickLabelRotation, axisTitleFont*, tickLabelFont* }
interface GridStyle { show: boolean; type: 'solid'|'dashed'|'none'; color: string; width: number; }
interface LegendStyle { visible: boolean; position: {x,y}; }
interface EllipseSettings { enabled: boolean; confidenceLevel: 0.90|0.95|0.99; mode: 'all'|'perGroup'; enabledGroups: string[]; }
interface ChartDimensions { width: number; height: number; lockAspectRatio: boolean; }

// 命令
interface Command { id: string; undo: () => void; execute: () => void; description: string; }

// 导出
interface PcaStyleJSON { version: string; data: { rows, xAxisTitle, yAxisTitle }; style: { /* 完整StyleStore快照 */ }; }
```

## 关键实现细节

- **图表option构建**: `chartOptions.ts` 从store读取所有状态，构建完整ECharts option（series、axis、grid、graphic、tooltip）
- **置信椭圆**: graphic polygon元素，64点近似，color+20透明度填充
- **离群检测**: 将点变换到椭圆特征向量坐标系，检查 `(dx/a)²+(dy/b)² ≤ 1`
- **缩放手柄**: 8个absolute定位的div，pointerdown/move/up事件，最小300px
- **图例拖拽**: pointer事件，位置存储为相对于图表容器的像素坐标
- **撤销/重做**: Zustand中间件，状态快照（最多50个命令），估算内存<100MB

## 日志系统

### 架构

```
src/utils/logger.ts    — 日志核心模块
```

### 日志级别（RFC 5424标准）

| 级别 | 值 | 用途 |
|---|---|---|
| `DEBUG` | 0 | 开发调试：状态变更细节、渲染触发原因、椭圆计算中间值 |
| `INFO` | 1 | 关键操作：文件导入成功、分组推导完成、导出完成、样式恢复 |
| `WARN` | 2 | 警告：跳过的数据行、编码回退、离群检测结果、性能预警 |
| `ERROR` | 3 | 错误：解析失败、导出异常、渲染错误、数据校验失败 |
| `FATAL` | 4 | 致命：不可恢复的状态损坏（极端情况） |

### Logger API

```typescript
class Logger {
  // 分级记录
  debug(module: string, message: string, data?: any): void;
  info(module: string, message: string, data?: any): void;
  warn(module: string, message: string, data?: any): void;
  error(module: string, message: string, error?: Error | string, data?: any): void;
  fatal(module: string, message: string, error?: Error | string, data?: any): void;

  // 获取最近N条日志（用于bug报告导出）
  getRecentLogs(count?: number): LogEntry[];
  
  // 导出完整日志为文本文件
  exportLogs(): string;  // 返回格式化的日志文本，触发浏览器下载

  // 设置当前日志级别（低于此级别的日志不输出）
  setLevel(level: LogLevel): void;

  // 清空内存中的日志缓冲
  clearBuffer(): void;
}

interface LogEntry {
  timestamp: number;          // Date.now()
  isoTime: string;            // ISO 8601 格式化时间
  level: LogLevel;
  module: string;             // 'parser' | 'store' | 'chart' | 'export' | 'legend' 等
  message: string;
  data?: any;                 // 可选附加数据（会被JSON序列化）
  stack?: string;             // 错误堆栈（仅ERROR/FATAL）
}
```

### 日志输出策略

| 环境 | 输出方式 |
|---|---|
| **开发模式** (`vite dev`) | console输出 + 内存环形缓冲（最近1000条） |
| **生产模式** (`vite build`) | 默认仅ERROR/WARN/FATAL输出到console + 内存环形缓冲（最近500条） |

- 生产模式可通过URL参数 `?debug=true` 或开发者控制台 `window.__PCAplotDebug__ = true` 开启完整日志
- 内存缓冲使用环形队列，超出上限时淘汰最旧记录，确保内存占用可控（<5MB）

### 关键日志埋点位置

| 模块 | 事件 | 级别 |
|---|---|---|
| parser | 开始解析文件（文件名、大小） | INFO |
| parser | 编码检测结果 | DEBUG |
| parser | 分隔符检测结果 | DEBUG |
| parser | 表头检测结果 | DEBUG |
| parser | 解析完成（行数、分组数、跳过行数） | INFO |
| parser | 跳过行详情 | WARN |
| parser | 编码检测失败，回退 | WARN |
| parser | 解析异常 | ERROR |
| useDataStore | 数据导入完成 | INFO |
| useDataStore | 分组推导结果 | DEBUG |
| useStyleStore | 每个样式变更（旧值→新值） | DEBUG |
| undoRedoMiddleware | 命令入栈/出栈 | DEBUG |
| undoRedoMiddleware | 撤销栈满，淘汰最旧命令 | WARN |
| chartOptions | ECharts option构建耗时 | DEBUG |
| ChartCanvas | 渲染完成 | DEBUG |
| ChartCanvas | 10k+点性能提示 | WARN |
| ChartCanvas | 渲染异常 | ERROR |
| ellipse | 椭圆计算详情（组名、点数、置信度） | DEBUG |
| outlierDetection | 离群检测结果 | WARN |
| exportImage | 导出开始（格式、DPI、尺寸） | INFO |
| exportImage | 导出完成 | INFO |
| exportImage | 导出失败 | ERROR |
| exportStyle | 样式导出/导入 | INFO |
| 全局 | 未捕获的异常 | FATAL |

### 用户反馈的日志

- Toolbar右侧显示通知区域（toast），对INFO/WARN/ERROR级别的重要事件给用户简短提示
- 例如：「成功导入 1500 个数据点，5 个分组」「检测到 3 个样本点可能混入相邻分组」
- Error级别：toast + 可选"导出日志"按钮

---

## 版本管理

### 版本号规范（SemVer）

- 格式：`MAJOR.MINOR.PATCH`（如 `1.0.0`）
- `MAJOR`: 不兼容的导出格式变更、重大架构变更
- `MINOR`: 新增功能（新配色方案、新导出格式、新面板）
- `PATCH`: Bug修复、性能优化、小改进

### 版本号存储位置

| 位置 | 用途 |
|---|---|
| `package.json` → `version` 字段 | Node.js生态标准，`npm version` 命令自动管理 |
| `src/constants/version.ts` | 运行时嵌入，导出到样式文件中 |
| 导出文件 `PcaStyleJSON.version` | 样式文件兼容性校验 |
| UI底部状态栏 | 用户可见的版本号显示 |

### version.ts

```typescript
// 此文件由构建脚本自动从 package.json 同步
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'PCAplot';
export const BUILD_TIME = '2026-06-15T12:00:00Z';  // vite构建时注入
```

### Git版本控制策略

| 规则 | 说明 |
|---|---|
| `.gitignore` | `node_modules/`, `dist/`, `.vite/`, `*.local`, IDE配置 |
| 分支策略 | `main`（稳定） + `dev`（开发）+ `feature/*`（功能分支） |
| Commit规范 | `type(scope): description`，例：`feat(parser): add GBK encoding support` |
| 标签 | 每个发布版本打tag：`v1.0.0`, `v1.1.0` |
| CHANGELOG.md | 按版本记录新增、修改、修复、废弃 |

### 导出文件兼容性

```typescript
// exportStyle.ts 写入版本号
const style: PcaStyleJSON = {
  version: APP_VERSION,   // 当前工具版本
  // ...
};

// importStyle.ts 读取版本号并检查兼容性
function checkVersionCompatibility(fileVersion: string): CompatibilityResult {
  // MAJOR 不同 → 不兼容，警告用户
  // MINOR 不同 → 尽力兼容，提示可能有差异
  // PATCH 不同 → 完全兼容
}
```

### 构建脚本（package.json scripts）

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run sync-version && vite build",
    "sync-version": "node scripts/sync-version.js",
    "preview": "vite preview",
    "version": "npm run sync-version && git add -A",
    "release": "npm version patch && npm run build"
  }
}
```

`scripts/sync-version.js`：读取 `package.json` 的 `version` 字段，写入 `src/constants/version.ts` 和 `BUILD_TIME`。

---

## 验证方法

1. `npm run dev` 启动开发服务器
2. 导入测试数据（创建示例PCA .csv文件）
3. 验证散点图渲染：分组颜色/形状不同
4. 验证交互：悬停tooltip、点击选点、图例拖拽/重命名/改色
5. 验证样式编辑：侧边栏各面板修改→图表实时更新
6. 验证撤销/重做：Ctrl+Z/Y
7. 验证导出：PNG/SVG + .pcastyle重新导入恢复状态
8. 验证性能：10000点渲染<500ms
