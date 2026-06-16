// ECharts 图表画布组件 — PCA 主图，可在画布中拖拽移动
import { useEffect, useRef, useCallback } from 'react';
import * as echarts from 'echarts';
import 'echarts-gl';  // 注册 3D 组件 (scatter3D, grid3D, xAxis3D, etc.)
import { useDataStore } from '../../stores/useDataStore';
import { useStyleStore } from '../../stores/useStyleStore';
import { useUIStore } from '../../stores/useUIStore';
import { buildEChartsOption, build3DEChartsOption } from './chartOptions';
import ResizeHandles from './ResizeHandles';
import { logger } from '../../utils/logger';
import './ChartCanvas.css';

const MODULE = 'ChartCanvas';

export default function ChartCanvas() {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);
  const dragState = useRef<{ startX: number; startY: number; startOffX: number; startOffY: number; moved: boolean } | null>(null);

  // 数据
  const parsedRows = useDataStore(s => s.parsedRows);
  const groups = useDataStore(s => s.groups);
  const xAxisTitle = useDataStore(s => s.xAxisTitle);
  const yAxisTitle = useDataStore(s => s.yAxisTitle);
  const zAxisTitle = useDataStore(s => s.zAxisTitle);
  const is3D = useDataStore(s => s.is3D);

  // 样式
  const globalPointSize = useStyleStore(s => s.globalPointSize);
  const globalPointOpacity = useStyleStore(s => s.globalPointOpacity);
  const axisStyle = useStyleStore(s => s.axisStyle);
  const gridStyle = useStyleStore(s => s.gridStyle);
  const legendStyle = useStyleStore(s => s.legendStyle);
  const legendVisible = legendStyle.visible;
  const chartDimensions = useStyleStore(s => s.chartDimensions);
  const chartWidth = chartDimensions.width;
  const chartHeight = chartDimensions.height;
  const tooltipFontFamily = useStyleStore(s => s.tooltipFontFamily);
  const tooltipFontSize = useStyleStore(s => s.tooltipFontSize);
  const activeColorSchemeId = useStyleStore(s => s.activeColorSchemeId);
  const groupColorOverrides = useStyleStore(s => s.groupColorOverrides);
  const groupShapeOverrides = useStyleStore(s => s.groupShapeOverrides);
  const groupSizeOverrides = useStyleStore(s => s.groupSizeOverrides);
  const groupOpacityOverrides = useStyleStore(s => s.groupOpacityOverrides);
  const background = useStyleStore(s => s.background);
  const globalFontFamily = useStyleStore(s => s.globalFontFamily);
  const globalFontSize = useStyleStore(s => s.globalFontSize);
  const globalFontBold = useStyleStore(s => s.globalFontBold);
  const globalFontItalic = useStyleStore(s => s.globalFontItalic);
  const chartTitle = useStyleStore(s => s.chartTitle);

  // UI
  const selectedPoints = useUIStore(s => s.selectedPoints);
  const selectPoint = useUIStore(s => s.selectPoint);

  // 初始化 ECharts
  useEffect(() => {
    if (!chartRef.current) return;
    // 如果 is3D 状态变化，需要重新初始化实例
    if (instanceRef.current) {
      instanceRef.current.dispose();
      instanceRef.current = null;
      isReadyRef.current = false;
    }
    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, undefined, {
        width: chartWidth,
        height: chartHeight,
        // 3D 模式让 echarts-gl 选择 WebGL，2D 模式使用 canvas
        renderer: is3D ? undefined : 'canvas',
      });
      isReadyRef.current = true;
      logger.debug(MODULE, 'ECharts 实例已初始化', { is3D });
    }
    return () => {
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
        isReadyRef.current = false;
      }
    };
  }, [is3D]);

  // 绑定事件
  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance || !isReadyRef.current) return;

    const handleClick = (params: unknown) => {
      const p = params as {
        componentType?: string;
        seriesName?: string;
        event?: { event?: PointerEvent };
        color?: string;
        data?: [number, number] | [number, number, number]
          | { sampleName?: string; groupName?: string; value?: [number, number] | [number, number, number]; color?: string; shape?: number };
      };
      if (p.componentType === 'series' && p.data) {
        const nativeEvent = p.event?.event as PointerEvent | undefined;
        const isMulti = nativeEvent?.ctrlKey || nativeEvent?.metaKey || false;
        if (Array.isArray(p.data)) {
          // 数组数据模式（2D 大数据 或 3D）
          const vals = p.data as number[];
          selectPoint({
            sampleName: `${p.seriesName ?? '?'}_${vals[0].toFixed(2)}`,
            groupName: p.seriesName ?? '?',
            pc1: vals[0],
            pc2: vals[1],
            pc3: vals.length > 2 ? vals[2] : 0,
            color: p.color ?? '#999',
            shape: 1,
          }, isMulti);
        } else {
          const d = p.data;
          const vals = d.value ?? [0, 0];
          selectPoint({
            sampleName: d.sampleName ?? '?',
            groupName: d.groupName ?? '?',
            pc1: vals[0] ?? 0,
            pc2: vals[1] ?? 0,
            pc3: vals.length > 2 ? (vals[2] ?? 0) : 0,
            color: d.color ?? '#999',
            shape: d.shape ?? 1,
          }, isMulti);
        }
      }
    };

    instance.on('click', handleClick);

    return () => {
      instance.off('click', handleClick);
    };
  }, [selectPoint]);

  // 渲染
  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance || !isReadyRef.current) return;
    if (parsedRows.length === 0) {
      instance.clear();
      return;
    }

    const t0 = performance.now();
    const selectedSamples = selectedPoints.map(p => p.sampleName);

    if (is3D) {
      const option = build3DEChartsOption({
        data: parsedRows,
        groups,
        xAxisTitle,
        yAxisTitle,
        zAxisTitle,
        chartWidth,
        chartHeight,
        globalPointSize,
        globalPointOpacity,
        tooltipFontFamily,
        tooltipFontSize,
        groupColorOverrides,
        groupShapeOverrides,
        groupSizeOverrides,
        groupOpacityOverrides,
        background,
        chartTitle,
        selectedSamples,
      });
      // 3D 模式下先清空再设置，确保 echarts-gl 完全刷新
      instance.clear();
      instance.setOption(option, { notMerge: true });
    } else {
      const option = buildEChartsOption({
        data: parsedRows,
        groups,
        xAxisTitle,
        yAxisTitle,
        axisStyle,
        gridStyle,
        chartWidth,
        chartHeight,
        legendVisible,
        globalPointSize,
        globalPointOpacity,
        tooltipFontFamily,
        tooltipFontSize,
        activeColorSchemeId,
        groupColorOverrides,
        groupShapeOverrides,
        groupSizeOverrides,
        groupOpacityOverrides,
        background,
        globalFontFamily,
        globalFontSize,
        globalFontBold,
        globalFontItalic,
        chartTitle,
        selectedSamples,
      });
      instance.setOption(option, { notMerge: true });
    }

    const elapsed = performance.now() - t0;

    if (parsedRows.length > 10000) {
      logger.warn(MODULE, `大数据量渲染: ${parsedRows.length} 点, 耗时 ${elapsed.toFixed(0)}ms`);
    } else {
      logger.debug(MODULE, `渲染完成, 耗时 ${elapsed.toFixed(0)}ms`, { points: parsedRows.length, is3D });
    }
  }, [
    parsedRows, groups, xAxisTitle, yAxisTitle, zAxisTitle, is3D,
    axisStyle, gridStyle, legendVisible,
    globalPointSize, globalPointOpacity,
    tooltipFontFamily, tooltipFontSize,
    activeColorSchemeId,
    groupColorOverrides, groupShapeOverrides, groupSizeOverrides,
    groupOpacityOverrides,
    background, chartWidth, chartHeight,
    globalFontFamily, globalFontSize, globalFontBold, globalFontItalic,
    chartTitle, selectedPoints,
  ]);

  // 尺寸变更
  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.resize({ width: chartWidth, height: chartHeight });
    }
  }, [chartWidth, chartHeight]);

  // 图表在画布中的拖拽移动
  const setChartDimensions = useStyleStore(s => s.setChartDimensions);
  const offsetX = chartDimensions.offsetX;
  const offsetY = chartDimensions.offsetY;

  const handleChartPointerDown = useCallback((e: React.PointerEvent) => {
    // 3D 模式下不拖拽图表（echarts-gl 处理旋转/缩放）
    if (is3D) return;
    // 不拦截 resize 手柄的事件
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    if ((e.target as HTMLElement).closest('.custom-legend')) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffX: offsetX,
      startOffY: offsetY,
      moved: false,
    };
  }, [offsetX, offsetY, is3D]);

  useEffect(() => {
    if (is3D) return; // 3D 模式不绑定拖拽事件
    const handleMove = (e: PointerEvent) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragState.current.moved = true;
      }
      if (dragState.current.moved) {
        setChartDimensions({
          offsetX: Math.max(0, dragState.current.startOffX + dx),
          offsetY: Math.max(0, dragState.current.startOffY + dy),
        });
      }
    };
    const handleUp = () => {
      dragState.current = null;
    };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, [setChartDimensions, is3D]);

  const hasData = parsedRows.length > 0;

  return (
    <div
      className="chart-canvas-wrapper"
      style={{
        width: chartWidth,
        height: chartHeight,
        cursor: is3D ? 'default' : 'move',
        background: background === 'transparent' ? 'transparent' : '#ffffff',
        border: background === 'transparent' ? 'none' : '1px solid #ddd',
        boxShadow: background === 'transparent' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
      onPointerDown={handleChartPointerDown}
    >
      {!hasData && (
        <div className="chart-placeholder">
          <div className="placeholder-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
              <path d="M3 3v18h18"/>
              <circle cx="8" cy="14" r="1.5" fill="#bbb"/>
              <circle cx="12" cy="10" r="1.5" fill="#bbb"/>
              <circle cx="16" cy="12" r="1.5" fill="#bbb"/>
              <circle cx="10" cy="6" r="1.5" fill="#bbb"/>
            </svg>
            <p>导入 PCA 数据文件开始可视化</p>
            <p className="placeholder-hint">支持 .txt（制表符/逗号/空格分隔）和 .csv 格式</p>
          </div>
        </div>
      )}
      <div
        ref={chartRef}
        className="chart-container"
        style={{
          width: chartWidth,
          height: chartHeight,
          visibility: hasData ? 'visible' : 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      {hasData && <ResizeHandles />}
    </div>
  );
}
