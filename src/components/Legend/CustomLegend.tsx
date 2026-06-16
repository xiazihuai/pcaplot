// 自定义图例 — HTML覆盖层，支持拖拽移动、双击重命名
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDataStore } from '../../stores/useDataStore';
import { useStyleStore } from '../../stores/useStyleStore';
import { useUIStore } from '../../stores/useUIStore';
import { getShapeById, get3DShapeFor2DId } from '../../services/shapeDefinitions';
import './CustomLegend.css';

export default function CustomLegend() {
  const groups = useDataStore(s => s.groups);
  const is3D = useDataStore(s => s.is3D);
  const legendStyle = useStyleStore(s => s.legendStyle);
  const visible = legendStyle.visible;
  const legendPosition = legendStyle.position;
  const legendColumns = legendStyle.columns;
  const groupColorOverrides = useStyleStore(s => s.groupColorOverrides);
  const groupShapeOverrides = useStyleStore(s => s.groupShapeOverrides);
  const updateGroupName = useDataStore(s => s.updateGroupName);
  const updateLegendStyle = useStyleStore(s => s.updateLegendStyle);

  const renamingGroup = useUIStore(s => s.renamingGroup);
  const setRenamingGroup = useUIStore(s => s.setRenamingGroup);
  const showToast = useUIStore(s => s.showToast);

  const [editValue, setEditValue] = useState('');
  const legendRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; moved: boolean } | null>(null);

  // 图例拖拽移动
  const handleLegendPointerDown = useCallback((e: React.PointerEvent) => {
    // 不拦截输入框的点击
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: legendPosition.x,
      startPosY: legendPosition.y,
      moved: false,
    };
  }, [legendPosition.x, legendPosition.y]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragState.current.moved = true;
      }
      if (dragState.current.moved) {
        updateLegendStyle({
          position: {
            x: Math.max(0, dragState.current.startPosX + dx),
            y: Math.max(0, dragState.current.startPosY + dy),
          },
        });
      }
    };
    const handleUp = () => {
      dragState.current = null;
    };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, [updateLegendStyle]);

  const handleDoubleClick = useCallback((groupName: string) => {
    setRenamingGroup(groupName);
    setEditValue(groupName);
  }, [setRenamingGroup]);

  const handleRenameSubmit = useCallback((oldName: string) => {
    if (editValue.trim() && editValue !== oldName) {
      updateGroupName(oldName, editValue.trim());
      showToast(`组名已更改: ${oldName} → ${editValue.trim()}`, 'info');
    }
    setRenamingGroup(null);
  }, [editValue, updateGroupName, setRenamingGroup, showToast]);

  const handleRenameCancel = useCallback(() => {
    setRenamingGroup(null);
  }, [setRenamingGroup]);

  if (!visible || groups.length === 0) return null;

  return (
    <div
      ref={legendRef}
      className="custom-legend"
      onPointerDown={handleLegendPointerDown}
      style={{
        position: 'absolute',
        left: legendPosition.x,
        top: legendPosition.y,
        zIndex: 50,
        display: 'grid',
        gridTemplateColumns: `repeat(${legendColumns}, auto)`,
        gap: legendColumns > 1 ? '2px 10px' : '0',
      }}
    >
      {groups.map(group => {
        const effectiveColor = groupColorOverrides[group.name] ?? group.color;
        const effectiveShape = groupShapeOverrides[group.name] ?? group.shape;
        const shapeIconSVG = is3D
          ? get3DShapeFor2DId(effectiveShape).iconSVG
          : (getShapeById(effectiveShape)?.iconSVG ?? '');
        const isRenaming = renamingGroup === group.name;

        return (
          <div key={group.name} className="legend-item">
            <svg width="14" height="14" viewBox="0 0 16 16" style={{ flexShrink: 0, color: effectiveColor }}>
              <g fill={effectiveColor} dangerouslySetInnerHTML={{ __html: shapeIconSVG }} />
            </svg>

            {isRenaming ? (
              <input
                className="legend-rename-input"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => handleRenameSubmit(group.name)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameSubmit(group.name);
                  if (e.key === 'Escape') handleRenameCancel();
                }}
                autoFocus
                style={{ width: Math.max(60, editValue.length * 10 + 10) }}
              />
            ) : (
              <span
                className="legend-item-name"
                onDoubleClick={() => handleDoubleClick(group.name)}
                title="双击重命名"
              >
                {group.name}
              </span>
            )}

          </div>
        );
      })}
    </div>
  );
}
