// 数据相关类型

/** 从文件解析的原始数据行 */
export interface RawDataRow {
  sampleName: string;
  groupName: string;
  pc1: number;
  pc2: number;
  pc3: number;
  originalRowIndex: number;
}

/** 校验后的数据行（groupName已规范化，值有效） */
export interface ParsedDataRow {
  sampleName: string;
  groupName: string;
  pc1: number;
  pc2: number;
  pc3: number;
}

/** 分组信息（含自动分配的样式） */
export interface GroupInfo {
  name: string;
  originalName: string;
  count: number;
  color: string;
  shape: number;
  pointSize: number;   // -1 表示使用全局默认
  opacity: number;      // -1 表示使用全局默认
  ellipseEnabled: boolean; // 该组是否显示置信椭圆
}

/** 跳过的数据行信息 */
export interface SkippedRowInfo {
  rowIndex: number;
  reason: 'missing_value' | 'insufficient_columns' | 'not_numeric';
  linePreview: string;
}

/** 解析结果 */
export interface ParseResult {
  rows: RawDataRow[];
  headers: string[];
  skippedRows: SkippedRowInfo[];
  delimiter: 'tab' | 'comma' | 'space';
  hasHeader: boolean;
  encoding: string;
  /** 编码置信度 'high' 表示确定，'low' 表示可能需要手动选择 */
  encodingConfidence: 'high' | 'low';
  /** 是否3D PCA（5列及以上数据自动开启） */
  is3D: boolean;
}
