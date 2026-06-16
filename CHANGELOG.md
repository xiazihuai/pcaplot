# Changelog

## [0.3.0] - 2026-06-16

### Added
- **3D PCA 可视化**：导入5列及以上数据时自动切换3D散点图（基于 echarts-gl）
  - 自动检测：文件含PC3列 → 自动启用3D模式，4列数据 → 保持2D
  - WebGL渲染：scatter3D + grid3D + xAxis3D/yAxis3D/zAxis3D
  - 3D交互：鼠标旋转/缩放/平移场景
  - 3D形状系统：7种内置形状（圆形/方形/三角/菱形/圆角方/图钉/箭头），双向映射兼容2D形状ID
  - Z轴标题编辑支持
- 自动编码检测对话框：检测置信度低时弹出编码选择（8种编码）
- 多点选中：Ctrl+点击高亮多个点，信息面板同时显示所有选中点
- 样本搜索：信息面板搜索框，按样本名/分组名实时过滤
- 适应窗口按钮：一键适配PCA主图到窗口大小

### Changed
- **3D场景尺寸优化**：boxWidth/Height/Depth=90，viewControl.distance=250，防止轴标题溢出
- **3D导出图片**：WebGL canvas 直接抓取 toDataURL
- **3D导出标题**：手动补充标题文字（echarts-gl WebGL可能不含ECharts title组件）
- **图例导出优化**：形状和文字均使用垂直中心对齐，与DOM显示一致
- **背景透明支持**：图表背景透明/白色切换，导出时同步
- **坐标轴面板3D适配**：3D模式仅显示轴标题编辑，隐藏2D专用控件
- **全局样式3D适配**：3D模式隐藏网格线设置
- echarts-gl依赖添加

### Fixed
- 3D图表形状切换不更新：`instance.clear()` + `setOption({notMerge: true})` 强制重建WebGL场景
- 3D导出图片缩放错误：drawImage改用五参数版指定目标宽高
- 2D导出图例形状错误：drawShapeOnCanvas/buildShapeSVG支持全部8种形状
- 2D导出图例多列布局：从DOM读取 `.legend-item` 精确位置
- 导出图例文字与图标错位：统一使用垂直中心对齐

## [0.1.0] - 2026-06-15

### Added
- 初始MVP版本
- 数据导入（.txt/.csv，支持制表符/逗号/空格分隔）
- PCA散点图渲染（ECharts 5+ Canvas）
- 7套配色方案 + 8种形状
- 基础工具栏（导入、导出PNG/JPEG/SVG、重置、撤销/重做按钮）
- 侧边栏四标签页：分组 / 坐标轴 / 全局样式 / 信息
- 分组编辑：颜色、形状、大小、透明度
- 坐标轴编辑：轴标题、轴线样式、刻度、字体
- 全局样式：点大小/透明度、网格线、背景、Tooltip字体、图表标题
- 画布三层架构：画板（网格点背景）→ PCA主图（可拖拽+8点缩放）→ 图例（独立定位）
- 图例：自由拖拽、双击重命名、多列布局
- 点击数据点查看详情
- 悬停Tooltip
- 撤销/重做（Ctrl+Z/Y，≥50步，中文操作描述toast）
- 导出图片：PNG/JPEG多DPI(72/150/300/600)，SVG真矢量
- 样式导出/导入：.pcastyle JSON
- 离群检测：跨组椭圆包含检测
- 大数据量优化：>10k点自动启用ECharts large mode
- 分级日志系统（DEBUG/INFO/WARN/ERROR/FATAL）
- GitHub Pages自动部署（GitHub Actions）
