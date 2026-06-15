// 图层/分组面板 — 编辑分组样式
import { useState } from 'react';
import { useDataStore } from '../../stores/useDataStore';
import { useStyleStore } from '../../stores/useStyleStore';
import { useUIStore } from '../../stores/useUIStore';
import { getShapeById, getAllShapes } from '../../services/shapeDefinitions';
import { COLOR_SCHEMES } from '../../services/colorSchemes';
import type { ColorSchemeId } from '../../services/colorSchemes';

export default function LayersPanel() {
  const groups = useDataStore(s => s.groups);
  const parsedRows = useDataStore(s => s.parsedRows);
  const updateGroupName = useDataStore(s => s.updateGroupName);

  const activeColorSchemeId = useStyleStore(s => s.activeColorSchemeId);
  const setColorScheme = useStyleStore(s => s.setColorScheme);
  const setGroupColorOverride = useStyleStore(s => s.setGroupColorOverride);
  const setGroupShapeOverride = useStyleStore(s => s.setGroupShapeOverride);
  const setGroupSizeOverride = useStyleStore(s => s.setGroupSizeOverride);
  const setGroupOpacityOverride = useStyleStore(s => s.setGroupOpacityOverride);
  const groupColorOverrides = useStyleStore(s => s.groupColorOverrides);
  const groupShapeOverrides = useStyleStore(s => s.groupShapeOverrides);
  const groupSizeOverrides = useStyleStore(s => s.groupSizeOverrides);
  const groupOpacityOverrides = useStyleStore(s => s.groupOpacityOverrides);
  const globalPointSize = useStyleStore(s => s.globalPointSize);
  const globalPointOpacity = useStyleStore(s => s.globalPointOpacity);

  const showToast = useUIStore(s => s.showToast);

  // 双击重命名状态
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  if (parsedRows.length === 0) {
    return <div className="no-data-hint">请先导入数据</div>;
  }

  const handleStartRename = (groupName: string) => {
    setRenamingGroup(groupName);
    setRenameValue(groupName);
  };

  const handleSubmitRename = (oldName: string) => {
    const val = renameValue.trim();
    if (val && val !== oldName) {
      updateGroupName(oldName, val);
      showToast(`组名已更改: ${oldName} → ${val}`, 'info');
    }
    setRenamingGroup(null);
  };

  return (
    <div>
      {/* 配色方案选择 */}
      <div className="sidebar-section">
        <h4>配色方案</h4>
        <select
          value={activeColorSchemeId}
          onChange={e => {
            setColorScheme(e.target.value as ColorSchemeId);
            showToast(`配色方案: ${COLOR_SCHEMES.find(s => s.id === e.target.value)?.name}`, 'info');
          }}
          style={{ width: '100%' }}
        >
          {COLOR_SCHEMES.map(scheme => (
            <option key={scheme.id} value={scheme.id}>{scheme.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
          {COLOR_SCHEMES.find(s => s.id === activeColorSchemeId)?.colors.slice(0, 10).map((c, i) => (
            <div key={i} style={{
              width: 16, height: 16, backgroundColor: c, borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.15)',
            }} title={c} />
          ))}
        </div>
      </div>

      {/* 分组列表 */}
      <div className="sidebar-section">
        <h4>分组 ({groups.length})</h4>
        {groups.map(group => {
          const effectiveColor = groupColorOverrides[group.name] ?? group.color;
          const effectiveShape = groupShapeOverrides[group.name] ?? group.shape;
          const sizeOverride = groupSizeOverrides[group.name];
          const effectiveSize = sizeOverride !== undefined && sizeOverride !== -1 ? sizeOverride : globalPointSize;
          const opacityOverride = groupOpacityOverrides[group.name];
          const effectiveOpacity = opacityOverride !== undefined && opacityOverride !== -1 ? opacityOverride : globalPointOpacity;
          const shapeDef = getShapeById(effectiveShape);
          const isRenaming = renamingGroup === group.name;

          return (
            <div key={group.name} className="group-item">
              <div className="group-item-header">
                <span className="shape-icon" style={{ color: effectiveColor }} dangerouslySetInnerHTML={{
                  __html: `<svg width="14" height="14" viewBox="0 0 16 16"><g fill="${effectiveColor}">${shapeDef?.iconSVG ?? ''}</g></svg>`
                }} />
                {isRenaming ? (
                  <input
                    className="group-name-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleSubmitRename(group.name)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSubmitRename(group.name);
                      if (e.key === 'Escape') setRenamingGroup(null);
                    }}
                    autoFocus
                    style={{ flex: 1, fontSize: 12, padding: '2px 4px', border: '1px solid #1976d2', borderRadius: 2 }}
                  />
                ) : (
                  <span
                    className="group-name"
                    style={{ flex: 1, cursor: 'pointer' }}
                    onDoubleClick={() => handleStartRename(group.name)}
                    title="双击重命名"
                  >
                    {group.name}
                  </span>
                )}
                <span className="group-count">{group.count}</span>
              </div>
              <div className="group-item-controls">
                <label>颜色:</label>
                <input type="color" value={effectiveColor}
                  onChange={e => setGroupColorOverride(group.name, e.target.value)} title="修改颜色" />
                <label>形状:</label>
                <select value={effectiveShape}
                  onChange={e => setGroupShapeOverride(group.name, Number(e.target.value))}
                  style={{ width: 56, fontSize: 11 }} title="修改形状">
                  {getAllShapes().map(s => (
                    <option key={s.id} value={s.id}>{s.nameCN}</option>
                  ))}
                </select>
              </div>
              <div className="group-item-controls" style={{ marginTop: 3 }}>
                <label>大小:</label>
                <input type="number" value={effectiveSize}
                  onChange={e => setGroupSizeOverride(group.name, Number(e.target.value))}
                  min={6} max={20} style={{ width: 44, fontSize: 11 }} title="修改点大小" />
                <label>透明度:</label>
                <input type="range" min={0.1} max={1.0} step={0.05} value={effectiveOpacity}
                  onChange={e => setGroupOpacityOverride(group.name, Number(e.target.value))}
                  style={{ width: 55 }} title="修改透明度" />
                <span style={{ fontSize: 10, minWidth: 26 }}>{effectiveOpacity.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
