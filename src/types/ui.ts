// UI状态类型

export type PanelTab = 'layers' | 'axes' | 'global' | 'info';

export interface SelectedPointInfo {
  sampleName: string;
  groupName: string;
  pc1: number;
  pc2: number;
  pc3: number;
  color: string;
  shape: number;
}

export type NotificationType = 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}
