// 右侧边栏 — 标签页切换
import { useUIStore } from '../../stores/useUIStore';
import type { PanelTab } from '../../types/ui';
import LayersPanel from './LayersPanel';
import AxesPanel from './AxesPanel';
import GlobalStylePanel from './GlobalStylePanel';
import InfoPanel from './InfoPanel';
import './Sidebar.css';

const TABS: { key: PanelTab; label: string }[] = [
  { key: 'layers', label: '分组' },
  { key: 'axes', label: '坐标轴' },
  { key: 'global', label: '全局样式' },
  { key: 'info', label: '信息' },
];

export default function Sidebar() {
  const activeTab = useUIStore(s => s.activeSidebarTab);
  const setActiveTab = useUIStore(s => s.setActiveTab);

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`sidebar-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="sidebar-content">
        {activeTab === 'layers' && <LayersPanel />}
        {activeTab === 'axes' && <AxesPanel />}
        {activeTab === 'global' && <GlobalStylePanel />}
        {activeTab === 'info' && <InfoPanel />}
      </div>
    </div>
  );
}
