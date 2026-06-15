// 主应用组件
import { useEffect } from 'react';
import Toolbar from './components/Toolbar/Toolbar';
import Sidebar from './components/Sidebar/Sidebar';
import ChartCanvas from './components/Chart/ChartCanvas';
import CustomLegend from './components/Legend/CustomLegend';
import NotificationToast from './components/common/NotificationToast';
import EncodingDialog from './components/common/EncodingDialog';
import { useStyleStore } from './stores/useStyleStore';
import { useUIStore } from './stores/useUIStore';
import { logger } from './utils/logger';
import { APP_NAME, APP_VERSION } from './constants/version';
import './App.css';

const MODULE = 'App';

export default function App() {
  const canUndo = useStyleStore(s => s.canUndo);
  const canRedo = useStyleStore(s => s.canRedo);
  const undo = useStyleStore(s => s.undo);
  const redo = useStyleStore(s => s.redo);
  const lastUndoDescription = useStyleStore(s => s.lastUndoDescription);
  const lastRedoDescription = useStyleStore(s => s.lastRedoDescription);
  const canvasSize = useStyleStore(s => s.canvasSize);
  const chartDimensions = useStyleStore(s => s.chartDimensions);
  const selectPoint = useUIStore(s => s.selectPoint);
  const showToast = useUIStore(s => s.showToast);

  // 撤销/重做 toast
  useEffect(() => {
    if (lastUndoDescription) {
      showToast(lastUndoDescription, 'info');
    }
  }, [lastUndoDescription, showToast]);

  useEffect(() => {
    if (lastRedoDescription) {
      showToast(lastRedoDescription, 'info');
    }
  }, [lastRedoDescription, showToast]);

  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
      }
      if (e.key === 'Escape') {
        selectPoint(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, selectPoint]);

  useEffect(() => {
    logger.info(MODULE, `${APP_NAME} v${APP_VERSION} 启动`);
  }, []);

  return (
    <div className="app">
      <Toolbar />
      <div className="main-content">
        <div className="chart-area">
          <div
            className="pca-canvas"
            style={{ width: canvasSize.width, height: canvasSize.height }}
          >
            <div
              className="chart-area-inner"
              style={{ left: chartDimensions.offsetX, top: chartDimensions.offsetY }}
            >
              <ChartCanvas />
            </div>
            <CustomLegend />
          </div>
        </div>
        <Sidebar />
      </div>
      <EncodingDialog />
      <NotificationToast />
      <footer className="status-bar">
        <span className="status-hint">Ctrl+点击可多选 | 双击分组名可重命名 | Ctrl+Z/Y 撤销重做</span>
        <span className="status-version">{APP_NAME} v{APP_VERSION}</span>
      </footer>
    </div>
  );
}
