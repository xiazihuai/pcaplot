// 导出相关类型

export type ImageFormat = 'png' | 'svg' | 'jpeg';
export type DpiLevel = 72 | 150 | 300 | 600;

export interface ImageExportOptions {
  format: ImageFormat;
  dpi: DpiLevel;
  transparent: boolean;
  includeLegend: boolean;
  filename?: string;
}

export interface ExportDataRow {
  sampleName: string;
  groupName: string;
  pc1: number;
  pc2: number;
  pc3: number;
  color: string;
  shape: number;
  size: number;
  opacity: number;
}

/** .pcastyle JSON 结构 — 可复现的完整状态导出 */
export interface PcaStyleJSON {
  version: string;
  exportedAt: string;
  data: {
    rows: {
      sampleName: string;
      groupName: string;
      pc1: number;
      pc2: number;
      pc3: number;
    }[];
    xAxisTitle: string;
    yAxisTitle: string;
    zAxisTitle: string;
    is3D: boolean;
  };
  style: Record<string, unknown>; // 完整 StyleStore 快照
}
