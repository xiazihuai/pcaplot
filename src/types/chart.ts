// 图表样式相关类型

export interface AxisSideVisibility {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export interface AxisStyle {
  showAxisLine: AxisSideVisibility;
  axisLineWidth: number;
  axisLineColor: string;
  showTick: boolean;
  tickDirection: 'in' | 'out' | 'none';
  tickLabelRotation: 0 | 45 | 90;
  axisTitleFontFamily: string;
  axisTitleFontSize: number;
  axisTitleBold: boolean;
  axisTitleItalic: boolean;
  tickLabelFontFamily: string;
  tickLabelFontSize: number;
  tickLabelBold: boolean;
  tickLabelItalic: boolean;
}

export interface GridStyle {
  show: boolean;
  type: 'solid' | 'dashed' | 'none';
  color: string;
  width: number;
}

export interface LegendStyle {
  visible: boolean;
  position: { x: number; y: number };
  /** 每行列数，1=单列竖向，2+=多列网格 */
  columns: number;
}

export interface EllipseSettings {
  enabled: boolean;
  confidenceLevel: 0.90 | 0.95 | 0.99;
}

export interface ChartDimensions {
  width: number;
  height: number;
  lockAspectRatio: boolean;
  /** PCA 图在画布中的 X 偏移 */
  offsetX: number;
  /** PCA 图在画布中的 Y 偏移 */
  offsetY: number;
}

/** 画布尺寸（比图表大的背景区域） */
export interface CanvasSize {
  width: number;
  height: number;
}

export interface ChartTitleStyle {
  show: boolean;
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  color: string;
}
