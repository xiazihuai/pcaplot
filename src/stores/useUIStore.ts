// UI层 Store — 临时UI状态
import { create } from 'zustand';
import type { PanelTab, SelectedPointInfo, Notification, NotificationType } from '../types/ui';
import { logger } from '../utils/logger';

const MODULE = 'uiStore';

interface UIStoreState {
  // 选中点（支持多选）
  selectedPoints: SelectedPointInfo[];

  // 侧边栏
  activeSidebarTab: PanelTab;

  // 通知
  notifications: Notification[];
  notificationIdCounter: number;

  // 编码选择弹窗
  isEncodingDialogOpen: boolean;
  encodingDialogFile: File | null;

  // 颜色选择器
  activeColorPicker: { groupName: string } | null;

  // 形状选择器
  activeShapeSelector: { groupName: string } | null;

  // 图例重命名
  renamingGroup: string | null;

  // 离群详情
  outlierDetailsExpanded: boolean;

  // 操作
  selectPoint: (point: SelectedPointInfo | null, multi?: boolean) => void;
  clearSelection: () => void;
  setActiveTab: (tab: PanelTab) => void;
  addNotification: (message: string, type: NotificationType) => string;
  removeNotification: (id: string) => void;
  showToast: (message: string, type?: NotificationType) => void;
  openEncodingDialog: (file: File) => void;
  closeEncodingDialog: () => void;
  openColorPicker: (groupName: string) => void;
  closeColorPicker: () => void;
  openShapeSelector: (groupName: string) => void;
  closeShapeSelector: () => void;
  setRenamingGroup: (name: string | null) => void;
  setOutlierDetailsExpanded: (expanded: boolean) => void;
}

export const useUIStore = create<UIStoreState>((set, get) => ({
  selectedPoints: [],
  activeSidebarTab: 'layers',
  notifications: [],
  notificationIdCounter: 0,

  isEncodingDialogOpen: false,
  encodingDialogFile: null,

  activeColorPicker: null,
  activeShapeSelector: null,
  renamingGroup: null,
  outlierDetailsExpanded: false,

  selectPoint: (point: SelectedPointInfo | null, multi = false) => {
    set(state => {
      if (point === null) {
        // 取消所有选择
        return { selectedPoints: [] };
      }

      if (multi) {
        // Ctrl+点击: 切换该点的选中状态
        const exists = state.selectedPoints.find(
          p => p.sampleName === point.sampleName && p.groupName === point.groupName
        );
        if (exists) {
          return {
            selectedPoints: state.selectedPoints.filter(
              p => !(p.sampleName === point.sampleName && p.groupName === point.groupName)
            ),
          };
        } else {
          return { selectedPoints: [...state.selectedPoints, point] };
        }
      } else {
        // 普通点击: 单选
        return { selectedPoints: [point] };
      }
    });
    // 自动切到信息面板
    set({ activeSidebarTab: 'info' });
    if (point) {
      logger.debug(MODULE, '选中点', { sampleName: point.sampleName, group: point.groupName, multi });
    }
  },

  clearSelection: () => set({ selectedPoints: [] }),

  setActiveTab: (tab: PanelTab) => set({ activeSidebarTab: tab }),

  addNotification: (message: string, type: NotificationType): string => {
    const id = `notif_${get().notificationIdCounter}`;
    set(state => ({
      notifications: [...state.notifications, { id, message, type, timestamp: Date.now() }],
      notificationIdCounter: state.notificationIdCounter + 1,
    }));
    return id;
  },

  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  showToast: (message: string, type: NotificationType = 'info') => {
    const id = get().addNotification(message, type);
    const duration = type === 'error' ? 8000 : 4000;
    setTimeout(() => {
      try { get().removeNotification(id); } catch { /* ignore */ }
    }, duration);
  },

  openEncodingDialog: (file: File) => set({ isEncodingDialogOpen: true, encodingDialogFile: file }),
  closeEncodingDialog: () => set({ isEncodingDialogOpen: false, encodingDialogFile: null }),
  openColorPicker: (groupName: string) => set({ activeColorPicker: { groupName } }),
  closeColorPicker: () => set({ activeColorPicker: null }),
  openShapeSelector: (groupName: string) => set({ activeShapeSelector: { groupName } }),
  closeShapeSelector: () => set({ activeShapeSelector: null }),
  setRenamingGroup: (name: string | null) => set({ renamingGroup: name }),
  setOutlierDetailsExpanded: (expanded: boolean) => set({ outlierDetailsExpanded: expanded }),
}));
