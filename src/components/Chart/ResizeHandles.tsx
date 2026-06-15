// 缩放手柄 — 8个拖拽手柄用于缩放画布
import { useCallback, useRef, useEffect } from 'react';
import { useStyleStore } from '../../stores/useStyleStore';
import { MIN_CHART_SIZE } from '../../constants/defaults';
import './ResizeHandles.css';

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const CURSOR_MAP: Record<HandleDir, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
  e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize',
  sw: 'nesw-resize', w: 'ew-resize',
};

export default function ResizeHandles() {
  const chartDimensions = useStyleStore(s => s.chartDimensions);
  const setChartDimensions = useStyleStore(s => s.setChartDimensions);
  const lockAspectRatio = chartDimensions.lockAspectRatio;
  const width = chartDimensions.width;
  const height = chartDimensions.height;
  const aspectRatio = width / height;

  const dragRef = useRef<{
    dir: HandleDir;
    startW: number;
    startH: number;
    startX: number;
    startY: number;
  } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, dir: HandleDir) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      dir,
      startW: width,
      startH: height,
      startX: e.clientX,
      startY: e.clientY,
    };
  }, [width, height]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      let newW = drag.startW;
      let newH = drag.startH;

      switch (drag.dir) {
        case 'e':  newW = Math.max(MIN_CHART_SIZE, drag.startW + dx); break;
        case 'w':  newW = Math.max(MIN_CHART_SIZE, drag.startW - dx); break;
        case 's':  newH = Math.max(MIN_CHART_SIZE, drag.startH + dy); break;
        case 'n':  newH = Math.max(MIN_CHART_SIZE, drag.startH - dy); break;
        case 'se': newW = Math.max(MIN_CHART_SIZE, drag.startW + dx); newH = Math.max(MIN_CHART_SIZE, drag.startH + dy); break;
        case 'ne': newW = Math.max(MIN_CHART_SIZE, drag.startW + dx); newH = Math.max(MIN_CHART_SIZE, drag.startH - dy); break;
        case 'sw': newW = Math.max(MIN_CHART_SIZE, drag.startW - dx); newH = Math.max(MIN_CHART_SIZE, drag.startH + dy); break;
        case 'nw': newW = Math.max(MIN_CHART_SIZE, drag.startW - dx); newH = Math.max(MIN_CHART_SIZE, drag.startH - dy); break;
      }

      // 宽高比锁定
      if (lockAspectRatio && aspectRatio > 0) {
        if (drag.dir === 'e' || drag.dir === 'w') {
          newH = newW / aspectRatio;
        } else if (drag.dir === 'n' || drag.dir === 's') {
          newW = newH * aspectRatio;
        } else {
          // 角手柄：以变化量大的维度为准
          if (Math.abs(dx) >= Math.abs(dy)) {
            newH = newW / aspectRatio;
          } else {
            newW = newH * aspectRatio;
          }
        }
        // 确保两个维度都不小于最小值
        if (newW < MIN_CHART_SIZE) newW = MIN_CHART_SIZE;
        if (newH < MIN_CHART_SIZE) newH = MIN_CHART_SIZE;
      }

      setChartDimensions({ width: Math.round(newW), height: Math.round(newH) });
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [setChartDimensions, lockAspectRatio, aspectRatio]);

  const handles: HandleDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <div className="resize-handles-overlay" style={{ width, height }}>
      {handles.map(dir => (
        <div
          key={dir}
          className={`resize-handle handle-${dir}`}
          style={{ cursor: CURSOR_MAP[dir] }}
          onPointerDown={e => handlePointerDown(e, dir)}
        />
      ))}
    </div>
  );
}
