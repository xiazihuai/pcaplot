// ECharts 图表画布组件 — PCA 主图，可在画布中拖拽移动
import { useEffect, useRef, useCallback } from 'react';
import * as echarts from 'echarts';
import { useDataStore } from '../../stores/useDataStore';
import { useStyleStore } from '../../stores/useStyleStore';
import { useUIStore } from '../../stores/useUIStore';
import { buildEChartsOption } from './chartOptions';
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
    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, undefined, {
        width: chartWidth,
        height: chartHeight,
        renderer: 'canvas',
      });
      isReadyRef.current = true;
      logger.debug(MODULE, 'ECharts 实例已初始化');
    }
    return () => {
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
        isReadyRef.current = false;
      }
    };
  }, []);

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
        data?: [number, number] | { sampleName?: string; groupName?: string; value?: [number, number]; color?: string; shape?: number };
      };
      if (p.componentType === 'series' && p.data) {
        const nativeEvent = p.event?.event as PointerEvent | undefined;
        const isMulti = nativeEvent?.ctrlKey || nativeEvent?.metaKey || false;
        if (Array.isArray(p.data)) {
          // 大数据模式：data 是 [x, y] 数组
          selectPoint({
            sampleName: `${p.seriesName ?? '?'}_${p.data[0].toFixed(2)}`,
            groupName: p.seriesName ?? '?',
            pc1: p.data[0],
            pc2: p.data[1],
            color: p.color ?? '#999',
            shape: 1,
          }, isMulti);
        } else {
          selectPoint({
            sampleName: p.data.sampleName ?? '?',
            groupName: p.data.groupName ?? '?',
            pc1: p.data.value?.[0] ?? 0,
            pc2: p.data.value?.[1] ?? 0,
            color: p.data.color ?? '#999',
            shape: p.data.shape ?? 1,
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
    const elapsed = performance.now() - t0;

    if (parsedRows.length > 10000) {
      logger.warn(MODULE, `大数据量渲染: ${parsedRows.length} 点, 耗时 ${elapsed.toFixed(0)}ms`);
    } else {
      logger.debug(MODULE, `渲染完成, 耗时 ${elapsed.toFixed(0)}ms`, { points: parsedRows.length });
    }
  }, [
    parsedRows, groups, xAxisTitle, yAxisTitle,
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
  }, [offsetX, offsetY]);

  useEffect(() => {
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
  }, [setChartDimensions]);

  const hasData = parsedRows.length > 0;

  return (
    <div
      className="chart-canvas-wrapper"
      style={{ width: chartWidth, height: chartHeight, cursor: 'move' }}
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
