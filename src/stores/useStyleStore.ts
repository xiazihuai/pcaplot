// 样式层 Store — 所有可视化状态，支持撤销/重做
import { create } from 'zustand';
import type { AxisStyle, GridStyle, LegendStyle, EllipseSettings, ChartDimensions, ChartTitleStyle, CanvasSize } from '../types/chart';
import type { Command } from '../types/command';
import type { ColorSchemeId } from '../services/colorSchemes';
import type { PcaStyleJSON } from '../types/export';
import { logger } from '../utils/logger';
import {
  DEFAULT_AXIS_STYLE,
  DEFAULT_GRID_STYLE,
  DEFAULT_LEGEND_STYLE,
  DEFAULT_ELLIPSE_SETTINGS,
  DEFAULT_CHART_DIMENSIONS,
  DEFAULT_CHART_TITLE,
  DEFAULT_GLOBAL_POINT_SIZE,
  DEFAULT_GLOBAL_POINT_OPACITY,
  DEFAULT_GLOBAL_FONT_FAMILY,
  DEFAULT_GLOBAL_FONT_SIZE,
  DEFAULT_TOOLTIP_FONT_FAMILY,
  DEFAULT_TOOLTIP_FONT_SIZE,
  DEFAULT_BACKGROUND,
  DEFAULT_COLOR_SCHEME_ID,
  DEFAULT_CANVAS_SIZE,
  MAX_UNDO_STACK,
} from '../constants/defaults';
import { useDataStore } from './useDataStore';

const MODULE = 'styleStore';

interface StyleStoreState {
  // 配色与形状
  activeColorSchemeId: ColorSchemeId;
  groupColorOverrides: Record<string, string>;
  groupShapeOverrides: Record<string, number>;
  groupSizeOverrides: Record<string, number>;
  groupOpacityOverrides: Record<string, number>;
  groupEllipseEnabled: Record<string, boolean>;  // 分组级椭圆开关

  // 全局点样式
  globalPointSize: number;
  globalPointOpacity: number;

  // 图表标题
  chartTitle: ChartTitleStyle;

  // 坐标轴
  axisStyle: AxisStyle;

  // 网格
  gridStyle: GridStyle;

  // 图例
  legendStyle: LegendStyle;

  // 字体（全局，除 tooltip）
  globalFontFamily: string;
  globalFontSize: number;
  globalFontBold: boolean;
  globalFontItalic: boolean;

  // Tooltip 字体（独立）
  tooltipFontFamily: string;
  tooltipFontSize: number;

  // 置信椭圆
  ellipseSettings: EllipseSettings;

  // 画布
  chartDimensions: ChartDimensions;
  canvasSize: CanvasSize;
  background: 'white' | 'transparent';

  // 撤销/重做
  undoStack: Command[];
  redoStack: Command[];
  canUndo: boolean;
  canRedo: boolean;
  lastUndoDescription: string | null;
  lastRedoDescription: string | null;

  // 操作
  setColorScheme: (schemeId: ColorSchemeId) => void;
  setGroupColorOverride: (groupName: string, color: string | null) => void;
  setGroupShapeOverride: (groupName: string, shapeId: number | null) => void;
  setGroupSizeOverride: (groupName: string, size: number | null) => void;
  setGroupOpacityOverride: (groupName: string, opacity: number | null) => void;
  setGroupEllipseEnabled: (groupName: string, enabled: boolean) => void;
  setGlobalPointSize: (size: number) => void;
  setGlobalPointOpacity: (opacity: number) => void;
  setChartTitle: (title: Partial<ChartTitleStyle>) => void;
  updateAxisStyle: (partial: Partial<AxisStyle>) => void;
  updateGridStyle: (partial: Partial<GridStyle>) => void;
  updateLegendStyle: (partial: Partial<LegendStyle>) => void;
  updateEllipseSettings: (partial: Partial<EllipseSettings>) => void;
  setChartDimensions: (dims: Partial<ChartDimensions>) => void;
  setCanvasSize: (size: Partial<CanvasSize>) => void;
  setBackground: (bg: 'white' | 'transparent') => void;
  setTooltipFontFamily: (family: string) => void;
  setTooltipFontSize: (size: number) => void;
  setGlobalFontFamily: (family: string) => void;
  setGlobalFontSize: (size: number) => void;
  setGlobalFontBold: (bold: boolean) => void;
  setGlobalFontItalic: (italic: boolean) => void;

  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  resetDefaults: () => void;
  importStyle: (json: PcaStyleJSON) => void;
  exportStyleSnapshot: () => Record<string, unknown>;
}

let cmdCounter = 0;

function pushCommand(
  state: { undoStack: Command[] },
  description: string,
  execute: () => void,
  undo: () => void,
): Command[] {
  const cmd: Command = {
    id: `cmd_${++cmdCounter}_${Date.now()}`,
    timestamp: Date.now(),
    description,
    execute,
    undo,
    estimatedSize: 1024,
  };
  const stack = [...state.undoStack, cmd];
  if (stack.length > MAX_UNDO_STACK) stack.shift();
  logger.debug(MODULE, '命令入栈', { id: cmd.id, description, depth: stack.length });
  return stack;
}

export const useStyleStore = create<StyleStoreState>((set, get) => ({
  // 初始状态
  activeColorSchemeId: DEFAULT_COLOR_SCHEME_ID,
  groupColorOverrides: {},
  groupShapeOverrides: {},
  groupSizeOverrides: {},
  groupOpacityOverrides: {},
  groupEllipseEnabled: {},

  globalPointSize: DEFAULT_GLOBAL_POINT_SIZE,
  globalPointOpacity: DEFAULT_GLOBAL_POINT_OPACITY,

  chartTitle: { ...DEFAULT_CHART_TITLE },

  axisStyle: { ...DEFAULT_AXIS_STYLE },
  gridStyle: { ...DEFAULT_GRID_STYLE },
  legendStyle: { ...DEFAULT_LEGEND_STYLE },
  ellipseSettings: { ...DEFAULT_ELLIPSE_SETTINGS },

  globalFontFamily: DEFAULT_GLOBAL_FONT_FAMILY,
  globalFontSize: DEFAULT_GLOBAL_FONT_SIZE,
  globalFontBold: false,
  globalFontItalic: false,

  tooltipFontFamily: DEFAULT_TOOLTIP_FONT_FAMILY,
  tooltipFontSize: DEFAULT_TOOLTIP_FONT_SIZE,

  chartDimensions: { ...DEFAULT_CHART_DIMENSIONS },
  canvasSize: { ...DEFAULT_CANVAS_SIZE },
  background: DEFAULT_BACKGROUND,

  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  lastUndoDescription: null,
  lastRedoDescription: null,

  // === 配色方案（同步到 dataStore） ===
  setColorScheme: (schemeId) => {
    const prev = get().activeColorSchemeId;
    const prevGroupColors = { ...get().groupColorOverrides };
    // 切换方案时清除颜色覆盖（用户手动覆盖的保留）
    set(state => ({
      activeColorSchemeId: schemeId,
      groupColorOverrides: {}, // 切换方案时重置覆盖
      undoStack: pushCommand(state, `切换配色方案 → ${schemeId}`,
        () => { set({ activeColorSchemeId: schemeId, groupColorOverrides: {} }); useDataStore.getState().syncGroupColors(schemeId); },
        () => { set({ activeColorSchemeId: prev, groupColorOverrides: prevGroupColors }); useDataStore.getState().syncGroupColors(prev); },
      ),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      lastUndoDescription: null,
      lastRedoDescription: null,
    }));
    // 立即同步颜色到数据
    useDataStore.getState().syncGroupColors(schemeId);
    logger.debug(MODULE, '切换配色方案', { from: prev, to: schemeId });
  },

  setGroupColorOverride: (groupName, color) => {
    const prevColor = get().groupColorOverrides[groupName] ?? null;
    set(state => {
      const newOverrides = { ...state.groupColorOverrides };
      if (color === null) delete newOverrides[groupName];
      else newOverrides[groupName] = color;
      return {
        groupColorOverrides: newOverrides,
        undoStack: pushCommand(state, `修改 "${groupName}" 颜色`,
          () => set({ groupColorOverrides: newOverrides }),
          () => {
            const prevOverrides = { ...get().groupColorOverrides };
            if (prevColor === null) delete prevOverrides[groupName];
            else prevOverrides[groupName] = prevColor;
            set({ groupColorOverrides: prevOverrides });
          },
        ),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  setGroupShapeOverride: (groupName, shapeId) => {
    const prev = get().groupShapeOverrides[groupName] ?? null;
    set(state => {
      const newOverrides = { ...state.groupShapeOverrides };
      if (shapeId === null) delete newOverrides[groupName];
      else newOverrides[groupName] = shapeId;
      return {
        groupShapeOverrides: newOverrides,
        undoStack: pushCommand(state, `修改 "${groupName}" 形状`,
          () => set({ groupShapeOverrides: newOverrides }),
          () => {
            const prevOverrides = { ...get().groupShapeOverrides };
            if (prev === null) delete prevOverrides[groupName];
            else prevOverrides[groupName] = prev;
            set({ groupShapeOverrides: prevOverrides });
          },
        ),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  setGroupSizeOverride: (groupName, size) => {
    const prev = get().groupSizeOverrides[groupName] ?? null;
    set(state => {
      const newOverrides = { ...state.groupSizeOverrides };
      if (size === null) delete newOverrides[groupName];
      else newOverrides[groupName] = size;
      return {
        groupSizeOverrides: newOverrides,
        undoStack: pushCommand(state, `修改 "${groupName}" 点大小`,
          () => set({ groupSizeOverrides: newOverrides }),
          () => {
            const prevOverrides = { ...get().groupSizeOverrides };
            if (prev === null) delete prevOverrides[groupName];
            else prevOverrides[groupName] = prev;
            set({ groupSizeOverrides: prevOverrides });
          },
        ),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  setGroupOpacityOverride: (groupName, opacity) => {
    const prev = get().groupOpacityOverrides[groupName] ?? null;
    set(state => {
      const newOverrides = { ...state.groupOpacityOverrides };
      if (opacity === null) delete newOverrides[groupName];
      else newOverrides[groupName] = opacity;
      return {
        groupOpacityOverrides: newOverrides,
        undoStack: pushCommand(state, `修改 "${groupName}" 透明度`,
          () => set({ groupOpacityOverrides: newOverrides }),
          () => {
            const prevOverrides = { ...get().groupOpacityOverrides };
            if (prev === null) delete prevOverrides[groupName];
            else prevOverrides[groupName] = prev;
            set({ groupOpacityOverrides: prevOverrides });
          },
        ),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  setGroupEllipseEnabled: (groupName, enabled) => {
    const prev = get().groupEllipseEnabled[groupName] ?? true;
    set(state => ({
      groupEllipseEnabled: { ...state.groupEllipseEnabled, [groupName]: enabled },
      undoStack: pushCommand(state, `${enabled ? '启用' : '禁用'} "${groupName}" 置信椭圆`,
        () => set({ groupEllipseEnabled: { ...get().groupEllipseEnabled, [groupName]: enabled } }),
        () => set({ groupEllipseEnabled: { ...get().groupEllipseEnabled, [groupName]: prev } }),
      ),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },

  setGlobalPointSize: (size) => {
    const prev = get().globalPointSize;
    set(state => ({
      globalPointSize: size,
      undoStack: pushCommand(state, `修改全局点大小: ${prev}px → ${size}px`,
        () => set({ globalPointSize: size }), () => set({ globalPointSize: prev })),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },

  setGlobalPointOpacity: (opacity) => {
    const prev = get().globalPointOpacity;
    set(state => ({
      globalPointOpacity: opacity,
      undoStack: pushCommand(state, `修改全局透明度: ${prev.toFixed(2)} → ${opacity.toFixed(2)}`,
        () => set({ globalPointOpacity: opacity }), () => set({ globalPointOpacity: prev })),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },

  setChartTitle: (partial) => {
    const prev = { ...get().chartTitle };
    const next = { ...prev, ...partial };
    set(state => ({
      chartTitle: next,
      undoStack: pushCommand(state, '修改图表标题',
        () => set({ chartTitle: next }), () => set({ chartTitle: prev })),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },

  updateAxisStyle: (partial) => {
    const prev = { ...get().axisStyle };
    set(state => {
      const next = { ...state.axisStyle, ...partial };
      return {
        axisStyle: next,
        undoStack: pushCommand(state, '修改坐标轴样式',
          () => set({ axisStyle: next }), () => set({ axisStyle: prev })),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  updateGridStyle: (partial) => {
    const prev = { ...get().gridStyle };
    set(state => {
      const next = { ...state.gridStyle, ...partial };
      return {
        gridStyle: next,
        undoStack: pushCommand(state, '修改网格样式',
          () => set({ gridStyle: next }), () => set({ gridStyle: prev })),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  updateLegendStyle: (partial) => {
    const prev = { ...get().legendStyle };
    set(state => {
      const next = { ...state.legendStyle, ...partial };
      return {
        legendStyle: next,
        undoStack: pushCommand(state, '修改图例设置',
          () => set({ legendStyle: next }), () => set({ legendStyle: prev })),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  updateEllipseSettings: (partial) => {
    const prev = { ...get().ellipseSettings };
    set(state => {
      const next = { ...state.ellipseSettings, ...partial };
      return {
        ellipseSettings: next,
        undoStack: pushCommand(state, '修改置信椭圆设置',
          () => set({ ellipseSettings: next }), () => set({ ellipseSettings: prev })),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
    // 若置信度变更，重新运行离群检测
    if (partial.confidenceLevel && partial.confidenceLevel !== prev.confidenceLevel) {
      useDataStore.getState().runOutlierDetection(partial.confidenceLevel);
    }
  },

  setChartDimensions: (dims) => {
    const prev = { ...get().chartDimensions };
    set(state => {
      const next = { ...state.chartDimensions, ...dims };
      return {
        chartDimensions: next,
        undoStack: pushCommand(state, '修改画布尺寸',
          () => set({ chartDimensions: next }), () => set({ chartDimensions: prev })),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  setCanvasSize: (size) => {
    const prev = { ...get().canvasSize };
    set(state => {
      const next = { ...state.canvasSize, ...size };
      return {
        canvasSize: next,
        undoStack: pushCommand(state, '修改画板大小',
          () => set({ canvasSize: next }), () => set({ canvasSize: prev })),
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  setBackground: (bg) => {
    const prev = get().background;
    set(state => ({
      background: bg,
      undoStack: pushCommand(state, `修改背景: ${bg}`,
        () => set({ background: bg }), () => set({ background: prev })),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },

  setTooltipFontFamily: (f) => set({ tooltipFontFamily: f }),
  setTooltipFontSize: (s) => set({ tooltipFontSize: s }),

  setGlobalFontFamily: (family) => {
    const prev = get().globalFontFamily;
    set(state => ({
      globalFontFamily: family,
      undoStack: pushCommand(state, '修改全局字体',
        () => set({ globalFontFamily: family }), () => set({ globalFontFamily: prev })),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },
  setGlobalFontSize: (size) => {
    const prev = get().globalFontSize;
    set(state => ({
      globalFontSize: size,
      undoStack: pushCommand(state, `修改全局字号: ${prev} → ${size}`,
        () => set({ globalFontSize: size }), () => set({ globalFontSize: prev })),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },
  setGlobalFontBold: (bold) => {
    const prev = get().globalFontBold;
    set(state => ({
      globalFontBold: bold,
      undoStack: pushCommand(state, bold ? '加粗' : '取消加粗',
        () => set({ globalFontBold: bold }), () => set({ globalFontBold: prev })),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },
  setGlobalFontItalic: (italic) => {
    const prev = get().globalFontItalic;
    set(state => ({
      globalFontItalic: italic,
      undoStack: pushCommand(state, italic ? '斜体' : '取消斜体',
        () => set({ globalFontItalic: italic }), () => set({ globalFontItalic: prev })),
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },

  // === 撤销/重做 ===
  undo: () => {
    const state = get();
    const stack = [...state.undoStack];
    const cmd = stack.pop();
    if (!cmd) return;
    cmd.undo();
    set({
      undoStack: stack,
      redoStack: [...state.redoStack, cmd],
      canUndo: stack.length > 0,
      canRedo: true,
      lastUndoDescription: `撤销: ${cmd.description}`,
      lastRedoDescription: null,
    });
    logger.debug(MODULE, '撤销', { id: cmd.id, description: cmd.description });
  },

  redo: () => {
    const state = get();
    const redoStack = [...state.redoStack];
    const cmd = redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    set({
      redoStack,
      undoStack: [...state.undoStack, cmd],
      canUndo: true,
      canRedo: redoStack.length > 0,
      lastRedoDescription: `重做: ${cmd.description}`,
      lastUndoDescription: null,
    });
    logger.debug(MODULE, '重做', { id: cmd.id, description: cmd.description });
  },

  clearHistory: () => set({
    undoStack: [], redoStack: [], canUndo: false, canRedo: false,
    lastUndoDescription: null, lastRedoDescription: null,
  }),

  resetDefaults: () => {
    logger.info(MODULE, '恢复默认样式');
    set({
      activeColorSchemeId: DEFAULT_COLOR_SCHEME_ID,
      groupColorOverrides: {},
      groupShapeOverrides: {},
      groupSizeOverrides: {},
      groupOpacityOverrides: {},
      groupEllipseEnabled: {},
      globalPointSize: DEFAULT_GLOBAL_POINT_SIZE,
      globalPointOpacity: DEFAULT_GLOBAL_POINT_OPACITY,
      chartTitle: { ...DEFAULT_CHART_TITLE },
      axisStyle: { ...DEFAULT_AXIS_STYLE },
      gridStyle: { ...DEFAULT_GRID_STYLE },
      legendStyle: { ...DEFAULT_LEGEND_STYLE },
      ellipseSettings: { ...DEFAULT_ELLIPSE_SETTINGS },
      globalFontFamily: DEFAULT_GLOBAL_FONT_FAMILY,
      globalFontSize: DEFAULT_GLOBAL_FONT_SIZE,
      globalFontBold: false,
      globalFontItalic: false,
      tooltipFontFamily: DEFAULT_TOOLTIP_FONT_FAMILY,
      tooltipFontSize: DEFAULT_TOOLTIP_FONT_SIZE,
      chartDimensions: { ...DEFAULT_CHART_DIMENSIONS },
      canvasSize: { ...DEFAULT_CANVAS_SIZE },
      background: DEFAULT_BACKGROUND,
      undoStack: [], redoStack: [], canUndo: false, canRedo: false,
      lastUndoDescription: null, lastRedoDescription: null,
    });
    useDataStore.getState().syncGroupColors(DEFAULT_COLOR_SCHEME_ID);
  },

  importStyle: (json) => {
    logger.info(MODULE, '导入样式文件', { version: json.version });
    const style = json.style as Partial<StyleStoreState>;
    set({
      activeColorSchemeId: (style.activeColorSchemeId as ColorSchemeId) ?? DEFAULT_COLOR_SCHEME_ID,
      groupColorOverrides: (style.groupColorOverrides as Record<string, string>) ?? {},
      groupShapeOverrides: (style.groupShapeOverrides as Record<string, number>) ?? {},
      groupSizeOverrides: (style.groupSizeOverrides as Record<string, number>) ?? {},
      groupOpacityOverrides: (style.groupOpacityOverrides as Record<string, number>) ?? {},
      groupEllipseEnabled: (style.groupEllipseEnabled as Record<string, boolean>) ?? {},
      globalPointSize: (style.globalPointSize as number) ?? DEFAULT_GLOBAL_POINT_SIZE,
      globalPointOpacity: (style.globalPointOpacity as number) ?? DEFAULT_GLOBAL_POINT_OPACITY,
      chartTitle: (style.chartTitle as ChartTitleStyle) ?? { ...DEFAULT_CHART_TITLE },
      axisStyle: (style.axisStyle as AxisStyle) ?? { ...DEFAULT_AXIS_STYLE },
      gridStyle: (style.gridStyle as GridStyle) ?? { ...DEFAULT_GRID_STYLE },
      legendStyle: {
        ...DEFAULT_LEGEND_STYLE,
        ...(style.legendStyle as Partial<LegendStyle>),
      },
      ellipseSettings: (style.ellipseSettings as EllipseSettings) ?? { ...DEFAULT_ELLIPSE_SETTINGS },
      globalFontFamily: (style.globalFontFamily as string) ?? DEFAULT_GLOBAL_FONT_FAMILY,
      globalFontSize: (style.globalFontSize as number) ?? DEFAULT_GLOBAL_FONT_SIZE,
      globalFontBold: (style.globalFontBold as boolean) ?? false,
      globalFontItalic: (style.globalFontItalic as boolean) ?? false,
      tooltipFontFamily: (style.tooltipFontFamily as string) ?? DEFAULT_TOOLTIP_FONT_FAMILY,
      tooltipFontSize: (style.tooltipFontSize as number) ?? DEFAULT_TOOLTIP_FONT_SIZE,
      chartDimensions: (style.chartDimensions as ChartDimensions) ?? { ...DEFAULT_CHART_DIMENSIONS },
      canvasSize: (style.canvasSize as CanvasSize) ?? { ...DEFAULT_CANVAS_SIZE },
      background: (style.background as 'white' | 'transparent') ?? DEFAULT_BACKGROUND,
      undoStack: [], redoStack: [], canUndo: false, canRedo: false,
      lastUndoDescription: null, lastRedoDescription: null,
    });
  },

  exportStyleSnapshot: () => {
    const state = get();
    return {
      activeColorSchemeId: state.activeColorSchemeId,
      groupColorOverrides: state.groupColorOverrides,
      groupShapeOverrides: state.groupShapeOverrides,
      groupSizeOverrides: state.groupSizeOverrides,
      groupOpacityOverrides: state.groupOpacityOverrides,
      groupEllipseEnabled: state.groupEllipseEnabled,
      globalPointSize: state.globalPointSize,
      globalPointOpacity: state.globalPointOpacity,
      chartTitle: state.chartTitle,
      axisStyle: state.axisStyle,
      gridStyle: state.gridStyle,
      legendStyle: state.legendStyle,
      globalFontFamily: state.globalFontFamily,
      globalFontSize: state.globalFontSize,
      globalFontBold: state.globalFontBold,
      globalFontItalic: state.globalFontItalic,
      tooltipFontFamily: state.tooltipFontFamily,
      tooltipFontSize: state.tooltipFontSize,
      ellipseSettings: state.ellipseSettings,
      chartDimensions: state.chartDimensions,
      canvasSize: state.canvasSize,
      background: state.background,
    };
  },
}));
