// 全局样式设置面板
import { useStyleStore } from '../../stores/useStyleStore';

export default function GlobalStylePanel() {
  const globalPointSize = useStyleStore(s => s.globalPointSize);
  const globalPointOpacity = useStyleStore(s => s.globalPointOpacity);
  const setGlobalPointSize = useStyleStore(s => s.setGlobalPointSize);
  const setGlobalPointOpacity = useStyleStore(s => s.setGlobalPointOpacity);
  const gridStyle = useStyleStore(s => s.gridStyle);
  const updateGridStyle = useStyleStore(s => s.updateGridStyle);
  const background = useStyleStore(s => s.background);
  const setBackground = useStyleStore(s => s.setBackground);
  const tooltipFontFamily = useStyleStore(s => s.tooltipFontFamily);
  const tooltipFontSize = useStyleStore(s => s.tooltipFontSize);
  const setTooltipFontFamily = useStyleStore(s => s.setTooltipFontFamily);
  const setTooltipFontSize = useStyleStore(s => s.setTooltipFontSize);
  const legendStyle = useStyleStore(s => s.legendStyle);
  const updateLegendStyle = useStyleStore(s => s.updateLegendStyle);
  const chartTitle = useStyleStore(s => s.chartTitle);
  const setChartTitle = useStyleStore(s => s.setChartTitle);
  const chartDimensions = useStyleStore(s => s.chartDimensions);
  const setChartDimensions = useStyleStore(s => s.setChartDimensions);
  const canvasSize = useStyleStore(s => s.canvasSize);
  const setCanvasSize = useStyleStore(s => s.setCanvasSize);

  return (
    <div>
      {/* 画板尺寸（大背景） */}
      <div className="sidebar-section">
        <h4>画板尺寸</h4>
        <div className="sidebar-row">
          <label>宽度</label>
          <input type="number" min={400} max={6000} step={50}
            value={canvasSize.width}
            onChange={e => setCanvasSize({ width: Number(e.target.value) })} />
        </div>
        <div className="sidebar-row">
          <label>高度</label>
          <input type="number" min={300} max={6000} step={50}
            value={canvasSize.height}
            onChange={e => setCanvasSize({ height: Number(e.target.value) })} />
        </div>
      </div>

      {/* PCA 图尺寸与位置 */}
      <div className="sidebar-section">
        <h4>PCA 主图</h4>
        <div className="sidebar-row">
          <label>宽度</label>
          <input type="number" min={300} max={4000} step={10}
            value={chartDimensions.width}
            onChange={e => setChartDimensions({ width: Number(e.target.value) })} />
        </div>
        <div className="sidebar-row">
          <label>高度</label>
          <input type="number" min={200} max={4000} step={10}
            value={chartDimensions.height}
            onChange={e => setChartDimensions({ height: Number(e.target.value) })} />
        </div>
        <div className="sidebar-row">
          <label>宽高比锁定</label>
          <input
            type="checkbox"
            checked={chartDimensions.lockAspectRatio}
            onChange={e => setChartDimensions({ lockAspectRatio: e.target.checked })}
          />
        </div>
        <div className="sidebar-row">
          <label>X 偏移</label>
          <input type="number" min={0} max={4000} step={10}
            value={chartDimensions.offsetX}
            onChange={e => setChartDimensions({ offsetX: Number(e.target.value) })} />
        </div>
        <div className="sidebar-row">
          <label>Y 偏移</label>
          <input type="number" min={0} max={4000} step={10}
            value={chartDimensions.offsetY}
            onChange={e => setChartDimensions({ offsetY: Number(e.target.value) })} />
        </div>
      </div>

      {/* 图表标题 */}
      <div className="sidebar-section">
        <h4>图表标题</h4>
        <div className="sidebar-row">
          <label>显示</label>
          <input type="checkbox" checked={chartTitle.show}
            onChange={e => setChartTitle({ show: e.target.checked })} />
        </div>
        {chartTitle.show && (
          <>
            <div className="sidebar-row">
              <label>文字</label>
              <input type="text" value={chartTitle.text}
                onChange={e => setChartTitle({ text: e.target.value })}
                style={{ width: 120 }} />
            </div>
            <div className="sidebar-row">
              <label>字号</label>
              <input type="number" min={10} max={36} value={chartTitle.fontSize}
                onChange={e => setChartTitle({ fontSize: Number(e.target.value) })} style={{ width: 55 }} />
            </div>
            <div className="sidebar-row">
              <label>加粗</label>
              <input type="checkbox" checked={chartTitle.bold}
                onChange={e => setChartTitle({ bold: e.target.checked })} />
            </div>
            <div className="sidebar-row">
              <label>颜色</label>
              <input type="color" value={chartTitle.color}
                onChange={e => setChartTitle({ color: e.target.value })} />
            </div>
          </>
        )}
      </div>

      {/* 图例 */}
      <div className="sidebar-section">
        <h4>图例</h4>
        <div className="sidebar-row">
          <label>显示图例</label>
          <input type="checkbox" checked={legendStyle.visible}
            onChange={e => updateLegendStyle({ visible: e.target.checked })} />
        </div>
        {legendStyle.visible && (
          <div className="sidebar-row">
            <label>每行列数</label>
            <input type="number" min={1} max={10} step={1}
              value={legendStyle.columns}
              onChange={e => updateLegendStyle({ columns: Math.max(1, Number(e.target.value) || 1) })}
              style={{ width: 55 }} />
          </div>
        )}
      </div>

      {/* 全局点样式 */}
      <div className="sidebar-section">
        <h4>点样式（全局默认）</h4>
        <div className="sidebar-row">
          <label>大小</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="range" min={6} max={20} step={1} value={globalPointSize}
              onChange={e => setGlobalPointSize(Number(e.target.value))} />
            <span style={{ fontSize: 12, minWidth: 24 }}>{globalPointSize}px</span>
          </div>
        </div>
        <div className="sidebar-row">
          <label>透明度</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="range" min={0.1} max={1.0} step={0.05} value={globalPointOpacity}
              onChange={e => setGlobalPointOpacity(Number(e.target.value))} />
            <span style={{ fontSize: 12, minWidth: 30 }}>{globalPointOpacity.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 网格线 */}
      <div className="sidebar-section">
        <h4>网格线</h4>
        <div className="sidebar-row">
          <label>显示</label>
          <input type="checkbox" checked={gridStyle.show}
            onChange={e => updateGridStyle({ show: e.target.checked })} />
        </div>
        {gridStyle.show && (
          <>
            <div className="sidebar-row">
              <label>类型</label>
              <select value={gridStyle.type}
                onChange={e => updateGridStyle({ type: e.target.value as 'solid' | 'dashed' | 'none' })}>
                <option value="solid">实线</option>
                <option value="dashed">虚线</option>
              </select>
            </div>
            <div className="sidebar-row">
              <label>颜色</label>
              <input type="color" value={gridStyle.color}
                onChange={e => updateGridStyle({ color: e.target.value })} />
            </div>
            <div className="sidebar-row">
              <label>宽度</label>
              <input type="number" min={0.5} max={3} step={0.5} value={gridStyle.width}
                onChange={e => updateGridStyle({ width: Number(e.target.value) })} />
            </div>
          </>
        )}
      </div>

      {/* 背景 */}
      <div className="sidebar-section">
        <h4>背景</h4>
        <div className="sidebar-row">
          <label>类型</label>
          <select value={background} onChange={e => setBackground(e.target.value as 'white' | 'transparent')}>
            <option value="white">白色</option>
            <option value="transparent">透明</option>
          </select>
        </div>
      </div>

      {/* Tooltip 字体 */}
      <div className="sidebar-section">
        <h4>Tooltip 字体</h4>
        <div className="sidebar-row">
          <label>字体</label>
          <input type="text" value={tooltipFontFamily}
            onChange={e => setTooltipFontFamily(e.target.value)} style={{ width: 120 }} />
        </div>
        <div className="sidebar-row">
          <label>字号</label>
          <input type="number" min={8} max={24} value={tooltipFontSize}
            onChange={e => setTooltipFontSize(Number(e.target.value))} />
        </div>
      </div>
    </div>
  );
}
