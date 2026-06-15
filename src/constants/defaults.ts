// 默认配置常量
import type { AxisStyle, GridStyle, LegendStyle, EllipseSettings, ChartDimensions, ChartTitleStyle } from '../types/chart';

export const DEFAULT_AXIS_STYLE: AxisStyle = {
  showAxisLine: { top: true, bottom: true, left: true, right: true },
  axisLineWidth: 1,
  axisLineColor: '#333333',
  showTick: true,
  tickDirection: 'out',
  tickLabelRotation: 0,
  axisTitleFontFamily: 'sans-serif',
  axisTitleFontSize: 14,
  axisTitleBold: true,
  axisTitleItalic: false,
  tickLabelFontFamily: 'sans-serif',
  tickLabelFontSize: 12,
  tickLabelBold: false,
  tickLabelItalic: false,
};

export const DEFAULT_GRID_STYLE: GridStyle = {
  show: false,
  type: 'dashed',
  color: '#e0e0e0',
  width: 0.5,
};

export const DEFAULT_LEGEND_STYLE: LegendStyle = {
  visible: true,
  position: { x: 24, y: 8 },
  columns: 1,
};

export const DEFAULT_ELLIPSE_SETTINGS: EllipseSettings = {
  enabled: false,
  confidenceLevel: 0.95,
};

export const DEFAULT_CHART_DIMENSIONS: ChartDimensions = {
  width: 800,
  height: 600,
  lockAspectRatio: false,
  offsetX: 60,
  offsetY: 40,
};

export const DEFAULT_CANVAS_SIZE = {
  width: 1200,
  height: 900,
};

export const DEFAULT_CHART_TITLE: ChartTitleStyle = {
  show: true,
  text: 'PCA Plot',
  fontFamily: 'sans-serif',
  fontSize: 16,
  bold: true,
  color: '#333333',
};

export const DEFAULT_GLOBAL_POINT_SIZE = 8;
export const DEFAULT_GLOBAL_POINT_OPACITY = 0.85;
export const DEFAULT_GLOBAL_FONT_FAMILY = 'sans-serif';
export const DEFAULT_GLOBAL_FONT_SIZE = 13;
export const DEFAULT_TOOLTIP_FONT_FAMILY = 'sans-serif';
export const DEFAULT_TOOLTIP_FONT_SIZE = 12;
export const DEFAULT_BACKGROUND = 'white' as const;
export const DEFAULT_COLOR_SCHEME_ID = 'tableau10';

export const MIN_CHART_SIZE = 300;
export const MAX_UNDO_STACK = 50;
export const TOOLTIP_HOVER_DELAY = 300;
export const DEFAULT_CHART_TITLE_TEXT = 'PCA Plot';
