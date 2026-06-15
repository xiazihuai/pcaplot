// 坐标轴设置面板
import { useStyleStore } from '../../stores/useStyleStore';
import { useDataStore } from '../../stores/useDataStore';

export default function AxesPanel() {
  const xAxisTitle = useDataStore(s => s.xAxisTitle);
  const yAxisTitle = useDataStore(s => s.yAxisTitle);
  const setAxisTitles = useDataStore(s => s.setAxisTitles);
  const axisStyle = useStyleStore(s => s.axisStyle);
  const updateAxisStyle = useStyleStore(s => s.updateAxisStyle);

  return (
    <div>
      <div className="sidebar-section">
        <h4>轴标题</h4>
        <div className="sidebar-row">
          <label>X轴:</label>
          <input
            type="text"
            value={xAxisTitle}
            onChange={e => setAxisTitles({ x: e.target.value })}
            style={{ width: 120, fontSize: 13 }}
          />
        </div>
        <div className="sidebar-row">
          <label>Y轴:</label>
          <input
            type="text"
            value={yAxisTitle}
            onChange={e => setAxisTitles({ y: e.target.value })}
            style={{ width: 120, fontSize: 13 }}
          />
        </div>
      </div>

      <div className="sidebar-section">
        <h4>轴线样式</h4>
        <div className="sidebar-row">
          <label>线宽</label>
          <input
            type="number" min={0.5} max={5} step={0.5}
            value={axisStyle.axisLineWidth}
            onChange={e => updateAxisStyle({ axisLineWidth: Number(e.target.value) })}
          />
        </div>
        <div className="sidebar-row">
          <label>颜色</label>
          <input
            type="color"
            value={axisStyle.axisLineColor}
            onChange={e => updateAxisStyle({ axisLineColor: e.target.value })}
          />
        </div>
      </div>

      <div className="sidebar-section">
        <h4>刻度</h4>
        <div className="sidebar-row">
          <label>显示刻度</label>
          <input
            type="checkbox"
            checked={axisStyle.showTick}
            onChange={e => updateAxisStyle({ showTick: e.target.checked })}
          />
        </div>
        <div className="sidebar-row">
          <label>方向</label>
          <select
            value={axisStyle.tickDirection}
            onChange={e => updateAxisStyle({ tickDirection: e.target.value as 'in' | 'out' | 'none' })}
          >
            <option value="out">外侧</option>
            <option value="in">内侧</option>
            <option value="none">无</option>
          </select>
        </div>
        <div className="sidebar-row">
          <label>标签旋转</label>
          <select
            value={axisStyle.tickLabelRotation}
            onChange={e => updateAxisStyle({ tickLabelRotation: Number(e.target.value) as 0 | 45 | 90 })}
          >
            <option value={0}>0°</option>
            <option value={45}>45°</option>
            <option value={90}>90°</option>
          </select>
        </div>
      </div>

      <div className="sidebar-section">
        <h4>轴标题字体</h4>
        <div className="sidebar-row">
          <label>字号</label>
          <input
            type="number" min={8} max={48}
            value={axisStyle.axisTitleFontSize}
            onChange={e => updateAxisStyle({ axisTitleFontSize: Number(e.target.value) })}
          />
        </div>
        <div className="sidebar-row">
          <label>加粗</label>
          <input
            type="checkbox"
            checked={axisStyle.axisTitleBold}
            onChange={e => updateAxisStyle({ axisTitleBold: e.target.checked })}
          />
        </div>
        <div className="sidebar-row">
          <label>斜体</label>
          <input
            type="checkbox"
            checked={axisStyle.axisTitleItalic}
            onChange={e => updateAxisStyle({ axisTitleItalic: e.target.checked })}
          />
        </div>
      </div>

      <div className="sidebar-section">
        <h4>刻度标签字体</h4>
        <div className="sidebar-row">
          <label>字号</label>
          <input
            type="number" min={8} max={48}
            value={axisStyle.tickLabelFontSize}
            onChange={e => updateAxisStyle({ tickLabelFontSize: Number(e.target.value) })}
          />
        </div>
        <div className="sidebar-row">
          <label>加粗</label>
          <input
            type="checkbox"
            checked={axisStyle.tickLabelBold}
            onChange={e => updateAxisStyle({ tickLabelBold: e.target.checked })}
          />
        </div>
        <div className="sidebar-row">
          <label>斜体</label>
          <input
            type="checkbox"
            checked={axisStyle.tickLabelItalic}
            onChange={e => updateAxisStyle({ tickLabelItalic: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
}
