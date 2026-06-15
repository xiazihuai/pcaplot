// 顶部工具栏
import { useRef, useCallback, useState } from 'react';
import { useDataStore } from '../../stores/useDataStore';
import { useStyleStore } from '../../stores/useStyleStore';
import { useUIStore } from '../../stores/useUIStore';
import { exportImage } from '../../services/exportImage';
import { exportStyleAsJSON } from '../../services/exportStyle';
import { importStyleFile } from '../../services/importStyle';
import { logger } from '../../utils/logger';
import './Toolbar.css';

const MODULE = 'Toolbar';

const DPI_OPTIONS = [
  { value: 72, label: '72 DPI (屏幕)' },
  { value: 150, label: '150 DPI (网页)' },
  { value: 300, label: '300 DPI (印刷)' },
  { value: 600, label: '600 DPI (高清)' },
] as const;

export default function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [pngDpiMenuOpen, setPngDpiMenuOpen] = useState(false);
  const [jpegDpiMenuOpen, setJpegDpiMenuOpen] = useState(false);
  const [selectedDpi, setSelectedDpi] = useState<number>(150);

  const importFile = useDataStore(s => s.importFile);
  const fileName = useDataStore(s => s.fileName);

  const canUndo = useStyleStore(s => s.canUndo);
  const canRedo = useStyleStore(s => s.canRedo);
  const undo = useStyleStore(s => s.undo);
  const redo = useStyleStore(s => s.redo);
  const resetDefaults = useStyleStore(s => s.resetDefaults);
  const legendStyle = useStyleStore(s => s.legendStyle);
  const updateLegendStyle = useStyleStore(s => s.updateLegendStyle);

  const showToast = useUIStore(s => s.showToast);

  const handleImport = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importFile(file);
      const dataState = useDataStore.getState();
      const outlierCount = dataState.outlierResult?.summary.totalOutliers ?? 0;
      let msg = `成功导入: ${file.name} (${dataState.parsedRows.length} 点, ${dataState.groups.length} 组)`;
      if (outlierCount > 0) {
        msg += ` | ⚠ 检测到 ${outlierCount} 个离群候选点`;
        showToast(msg, 'warning');
      } else {
        showToast(msg, 'info');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      logger.error(MODULE, '导入失败', err);
      showToast(`导入失败: ${msg}`, 'error');
    }
    e.target.value = '';
  }, [importFile, showToast]);

  const doExport = useCallback(async (format: 'png' | 'svg' | 'jpeg', dpi: number) => {
    try {
      await exportImage(format, dpi, true);
      const fmtLabel = format === 'jpeg' ? 'JPEG' : format.toUpperCase();
      showToast(`导出 ${fmtLabel} (${dpi} DPI) 成功`, 'info');
    } catch (err) {
      showToast(`导出失败: ${err}`, 'error');
    }
    setImageMenuOpen(false);
    setPngDpiMenuOpen(false);
    setJpegDpiMenuOpen(false);
  }, [showToast]);

  const handleExportStyleJSON = useCallback(async () => {
    try {
      await exportStyleAsJSON();
      showToast('导出 .pcastyle 成功', 'info');
    } catch (err) {
      showToast(`导出失败: ${err}`, 'error');
    }
    setStyleMenuOpen(false);
  }, [showToast]);

  const handleImportStyle = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pcastyle,.csv,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        await importStyleFile(file);
        showToast(`成功导入样式: ${file.name}`, 'info');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        showToast(`样式导入失败: ${msg}`, 'error');
      }
    };
    input.click();
  }, [showToast]);

  const handleFitWindow = useCallback(() => {
    const chartArea = document.querySelector('.chart-area') as HTMLElement | null;
    if (!chartArea) {
      showToast('未找到图表区域', 'warning');
      return;
    }
    const rect = chartArea.getBoundingClientRect();
    const padding = 40;
    const newW = Math.max(300, rect.width - padding);
    const newH = Math.max(200, rect.height - padding);
    useStyleStore.getState().setChartDimensions({ width: Math.round(newW), height: Math.round(newH) });
    showToast(`画布已调整: ${Math.round(newW)} × ${Math.round(newH)}`, 'info');
  }, [showToast]);

  const handleReset = useCallback(() => {
    resetDefaults();
    showToast('已恢复默认样式', 'info');
  }, [resetDefaults, showToast]);

  const handleToggleLegend = useCallback(() => {
    updateLegendStyle({ visible: !legendStyle.visible });
    showToast(legendStyle.visible ? '图例已隐藏' : '图例已显示', 'info');
  }, [legendStyle.visible, updateLegendStyle, showToast]);

  return (
    <div className="toolbar">
      <input ref={fileInputRef} type="file" accept=".txt,.csv" style={{ display: 'none' }} onChange={handleFileChange} />

      <button className="toolbar-btn primary" onClick={handleImport} title="导入数据文件">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
        </svg>
        <span>导入数据</span>
      </button>

      <div className="toolbar-dropdown">
        <button className="toolbar-btn" onClick={() => { setImageMenuOpen(!imageMenuOpen); setStyleMenuOpen(false); }} title="导出图片">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>导出图片 ▾</span>
        </button>
        {imageMenuOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-submenu">
              <button
                className="dropdown-submenu-trigger"
                onClick={() => { setPngDpiMenuOpen(!pngDpiMenuOpen); setJpegDpiMenuOpen(false); }}
              >
                PNG  ▸
              </button>
              {pngDpiMenuOpen && (
                <div className="dropdown-menu dropdown-menu-nested">
                  {DPI_OPTIONS.map(d => (
                    <button key={`png_${d.value}`} onClick={() => doExport('png', d.value)}>
                      {d.label} {d.value === selectedDpi ? '✓' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="dropdown-submenu">
              <button
                className="dropdown-submenu-trigger"
                onClick={() => { setJpegDpiMenuOpen(!jpegDpiMenuOpen); setPngDpiMenuOpen(false); }}
              >
                JPEG  ▸
              </button>
              {jpegDpiMenuOpen && (
                <div className="dropdown-menu dropdown-menu-nested">
                  {DPI_OPTIONS.map(d => (
                    <button key={`jpeg_${d.value}`} onClick={() => doExport('jpeg', d.value)}>
                      {d.label} {d.value === selectedDpi ? '✓' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { doExport('svg', 150); setPngDpiMenuOpen(false); setJpegDpiMenuOpen(false); }}>
              SVG (矢量)
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-dropdown">
        <button className="toolbar-btn" onClick={() => setStyleMenuOpen(!styleMenuOpen)} title="导出样式表">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>导入/导出样式表 ▾</span>
        </button>
        {styleMenuOpen && (
          <div className="dropdown-menu">
            <button onClick={handleImportStyle}>导入样式文件...</button>
            <button onClick={handleExportStyleJSON}>导出 .pcastyle (JSON)</button>
          </div>
        )}
      </div>

      <div className="toolbar-separator" />

      <button className="toolbar-btn" onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
      </button>
      <button className="toolbar-btn" onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Y)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>

      <div className="toolbar-separator" />

      <button className="toolbar-btn" onClick={handleToggleLegend} title="显示/隐藏图例">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/>
          <rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="5" height="9" rx="1"/>
          <line x1="20" y1="13" x2="22" y2="22" strokeWidth="2.5" stroke="#d32f2f"/>
        </svg>
        <span>{legendStyle.visible ? '隐藏图例' : '显示图例'}</span>
      </button>

      <button className="toolbar-btn" onClick={handleFitWindow} title="适应窗口">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
      </button>

      <button className="toolbar-btn" onClick={handleReset} title="恢复默认样式">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
      </button>

      {fileName && (
        <span className="toolbar-filename" title={fileName}>
          {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
        </span>
      )}
    </div>
  );
}
