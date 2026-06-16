// ECharts option 构建器 — 从 Store 状态构建完整 ECharts 配置
import type { EChartsOption } from 'echarts';
import type { ParsedDataRow, GroupInfo } from '../../types/data';
import type { AxisStyle, GridStyle, ChartTitleStyle } from '../../types/chart';
import { getShapeById, map2DShapeTo3DId, get3DSymbol } from '../../services/shapeDefinitions';
import type { ColorSchemeId } from '../../services/colorSchemes';

export interface ChartOptionParams {
  data: ParsedDataRow[];
  groups: GroupInfo[];
  xAxisTitle: string;
  yAxisTitle: string;
  axisStyle: AxisStyle;
  gridStyle: GridStyle;
  chartWidth: number;
  chartHeight: number;
  legendVisible: boolean;
  globalPointSize: number;
  globalPointOpacity: number;
  tooltipFontFamily: string;
  tooltipFontSize: number;
  activeColorSchemeId: ColorSchemeId;
  groupColorOverrides: Record<string, string>;
  groupShapeOverrides: Record<string, number>;
  groupSizeOverrides: Record<string, number>;
  groupOpacityOverrides: Record<string, number>;
  background: 'white' | 'transparent';
  globalFontFamily: string;
  globalFontSize: number;
  globalFontBold: boolean;
  globalFontItalic: boolean;
  chartTitle: ChartTitleStyle;
  selectedSamples: string[];  // 多点选中的样本名列表
}

/** 3D PCA 图表选项参数 */
export interface Chart3DOptionParams {
  data: ParsedDataRow[];
  groups: GroupInfo[];
  xAxisTitle: string;
  yAxisTitle: string;
  zAxisTitle: string;
  chartWidth: number;
  chartHeight: number;
  globalPointSize: number;
  globalPointOpacity: number;
  tooltipFontFamily: string;
  tooltipFontSize: number;
  groupColorOverrides: Record<string, string>;
  groupShapeOverrides: Record<string, number>;
  groupSizeOverrides: Record<string, number>;
  groupOpacityOverrides: Record<string, number>;
  background: 'white' | 'transparent';
  chartTitle: ChartTitleStyle;
  selectedSamples: string[];
}

export function buildEChartsOption(params: ChartOptionParams): EChartsOption {
  const {
    data, groups, xAxisTitle, yAxisTitle,
    axisStyle, gridStyle,
    globalPointSize, globalPointOpacity,
    tooltipFontFamily, tooltipFontSize,
    globalFontFamily, globalFontBold, globalFontItalic,
    groupColorOverrides, groupShapeOverrides, groupSizeOverrides,
    groupOpacityOverrides,
    background,
    chartTitle, selectedSamples,
  } = params;

  const fontWeight = globalFontBold ? 'bold' : 'normal';
  const fontStyle = globalFontItalic ? 'italic' : 'normal';

  // 每个分组一个 series
  const totalPoints = data.length;
  const isLargeDataset = totalPoints > 10000;
  const LARGE_THRESHOLD = 2000;

  const series = groups.map((group) => {
    const groupData = data.filter(d => d.groupName === group.name);
    const color = groupColorOverrides[group.name] ?? group.color;
    const shapeId = groupShapeOverrides[group.name] ?? group.shape;
    const shapeDef = getShapeById(shapeId);
    const sizeOverride = groupSizeOverrides[group.name];
    const effectiveSize = sizeOverride !== undefined && sizeOverride !== -1 ? sizeOverride
      : group.pointSize !== -1 ? group.pointSize : globalPointSize;
    const opacityOverride = groupOpacityOverrides[group.name];
    const effectiveOpacity = opacityOverride !== undefined && opacityOverride !== -1 ? opacityOverride : globalPointOpacity;

    // 大数据模式：简化为纯数值数组，跳过逐点样式
    if (isLargeDataset) {
      return {
        name: group.name,
        type: 'scatter' as const,
        data: groupData.map(d => [d.pc1, d.pc2]),
        symbol: shapeDef?.symbol ?? 'circle',
        symbolSize: effectiveSize,
        large: true,
        largeThreshold: LARGE_THRESHOLD,
        itemStyle: {
          color,
          opacity: effectiveOpacity,
        },
        selectMode: false as const,
      };
    }

    // 处理选中状态：标记被选中的点
    const processedData = groupData.map(d => {
      const isSelected = selectedSamples.includes(d.sampleName);
      return {
        value: [d.pc1, d.pc2],
        sampleName: d.sampleName,
        groupName: d.groupName,
        color,
        shape: shapeId,
        selected: isSelected,
        // 选中点的样式
        symbolSize: isSelected ? effectiveSize * 1.6 : effectiveSize,
        itemStyle: isSelected ? {
          color,
          opacity: Math.min(1, effectiveOpacity + 0.15),
          borderColor: '#000',
          borderWidth: 3,
          shadowBlur: 12,
          shadowColor: 'rgba(0,0,0,0.5)',
        } : undefined,
      };
    });

    return {
      name: group.name,
      type: 'scatter' as const,
      data: processedData,
      symbol: shapeDef?.symbol ?? 'circle',
      symbolSize: effectiveSize,
      itemStyle: {
        color,
        opacity: effectiveOpacity,
      },
      emphasis: {
        scale: 1.4,
        itemStyle: {
          borderColor: '#333',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.3)',
        },
      },
      // 不使用 ECharts 内置选中模式，而是手动通过数据控制
      selectMode: false as const,
    };
  });

  // 轴标签字体
  const tickFontWeight = axisStyle.tickLabelBold ? 'bold' : 'normal';
  const tickFontStyle = axisStyle.tickLabelItalic ? 'italic' : 'normal';

  const option: EChartsOption = {
    backgroundColor: background === 'transparent' ? 'transparent' : '#ffffff',
    animation: true,
    animationDuration: 300,

    // 图表标题
    title: chartTitle.show ? {
      text: chartTitle.text,
      left: 'center',
      top: 5,
      textStyle: {
        fontFamily: chartTitle.fontFamily,
        fontSize: chartTitle.fontSize,
        fontWeight: chartTitle.bold ? 'bold' : 'normal',
        color: chartTitle.color,
      },
    } : undefined,

    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      transitionDuration: 0.3,
      backgroundColor: 'rgba(40, 40, 40, 0.85)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontFamily: tooltipFontFamily,
        fontSize: tooltipFontSize,
      },
      formatter: (params: unknown) => {
        const p = params as {
          name?: string;
          seriesName?: string;
          data?: [number, number] | { sampleName?: string; groupName?: string; value?: [number, number] };
        };
        if (!p.data) return '';
        const seriesName = p.seriesName ?? p.name ?? '?';
        if (Array.isArray(p.data)) {
          // 大数据模式：data 是 [x, y] 数组
          const pc1 = p.data[0]?.toFixed(4) ?? '?';
          const pc2 = p.data[1]?.toFixed(4) ?? '?';
          return `<div style="padding:4px 8px;line-height:1.6">
            分组: ${seriesName}<br/>
            PC1: ${pc1}<br/>
            PC2: ${pc2}
          </div>`;
        }
        const d = p.data;
        const name = d.sampleName ?? '?';
        const group = d.groupName ?? seriesName;
        const pc1 = d.value?.[0]?.toFixed(4) ?? '?';
        const pc2 = d.value?.[1]?.toFixed(4) ?? '?';
        return `<div style="padding:4px 8px;line-height:1.6">
          <strong>${name}</strong><br/>
          分组: ${group}<br/>
          PC1: ${pc1}<br/>
          PC2: ${pc2}
        </div>`;
      },
    },

    legend: { show: false },

    // 网格：四边留白=0让轴线贴边形成矩形框
    grid: {
      left: 55,
      right: 20,
      top: chartTitle.show ? 40 : 20,
      bottom: 45,
      containLabel: true,
    },

    // X轴
    xAxis: {
      type: 'value',
      name: xAxisTitle,
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        fontFamily: axisStyle.axisTitleFontFamily,
        fontSize: axisStyle.axisTitleFontSize,
        fontWeight: axisStyle.axisTitleBold ? 'bold' : 'normal',
        fontStyle: axisStyle.axisTitleItalic ? 'italic' : 'normal',
        color: axisStyle.axisLineColor,
      },
      axisLine: {
        show: true,
        onZero: false,     // 不在0点交叉，始终在底部
        lineStyle: { color: axisStyle.axisLineColor, width: axisStyle.axisLineWidth },
      },
      axisTick: {
        show: axisStyle.showTick,
        inside: axisStyle.tickDirection === 'in',
      },
      axisLabel: {
        fontFamily: axisStyle.tickLabelFontFamily,
        fontSize: axisStyle.tickLabelFontSize,
        fontWeight: tickFontWeight,
        fontStyle: tickFontStyle,
        rotate: axisStyle.tickLabelRotation,
      },
      splitLine: {
        show: gridStyle.show,
        lineStyle: {
          type: gridStyle.type === 'none' ? 'solid' : gridStyle.type,
          color: gridStyle.color,
          width: gridStyle.width,
        },
      },
    },

    // Y轴
    yAxis: {
      type: 'value',
      name: yAxisTitle,
      nameLocation: 'middle',
      nameGap: 38,
      nameTextStyle: {
        fontFamily: axisStyle.axisTitleFontFamily,
        fontSize: axisStyle.axisTitleFontSize,
        fontWeight: axisStyle.axisTitleBold ? 'bold' : 'normal',
        fontStyle: axisStyle.axisTitleItalic ? 'italic' : 'normal',
        color: axisStyle.axisLineColor,
      },
      axisLine: {
        show: true,
        onZero: false,     // 不在0点交叉，始终在左侧
        lineStyle: { color: axisStyle.axisLineColor, width: axisStyle.axisLineWidth },
      },
      axisTick: {
        show: axisStyle.showTick,
        inside: axisStyle.tickDirection === 'in',
      },
      axisLabel: {
        fontFamily: axisStyle.tickLabelFontFamily,
        fontSize: axisStyle.tickLabelFontSize,
        fontWeight: tickFontWeight,
        fontStyle: tickFontStyle,
      },
      splitLine: {
        show: gridStyle.show,
        lineStyle: {
          type: gridStyle.type === 'none' ? 'solid' : gridStyle.type,
          color: gridStyle.color,
          width: gridStyle.width,
        },
      },
    },

    series,
  };

  return option;
}

/**
 * 构建 ECharts 3D 散点图配置（使用 echarts-gl scatter3D）
 *
 * 注意：echarts-gl scatter3D 仅支持以下内置 symbol 类型：
 *   'circle', 'square', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow'
 * 不支持自定义 SVG path。shapeDefinitions.ts 中定义了完整的 2D→3D 映射。
 */
export function build3DEChartsOption(params: Chart3DOptionParams): EChartsOption {
  const {
    data, groups, xAxisTitle, yAxisTitle, zAxisTitle,
    globalPointSize, globalPointOpacity,
    tooltipFontFamily, tooltipFontSize,
    groupColorOverrides, groupShapeOverrides, groupSizeOverrides,
    groupOpacityOverrides,
    background, chartTitle, selectedSamples,
  } = params;

  // 每个分组一个 scatter3D series
  const series = groups.map((group) => {
    const groupData = data.filter(d => d.groupName === group.name);
    const color = groupColorOverrides[group.name] ?? group.color;
    const shapeId2D = groupShapeOverrides[group.name] ?? group.shape;
    const shapeId3D = map2DShapeTo3DId(shapeId2D);
    const symbol3D = get3DSymbol(shapeId3D);
    const sizeOverride = groupSizeOverrides[group.name];
    const effectiveSize = sizeOverride !== undefined && sizeOverride !== -1 ? sizeOverride
      : group.pointSize !== -1 ? group.pointSize : globalPointSize;
    const opacityOverride = groupOpacityOverrides[group.name];
    const effectiveOpacity = opacityOverride !== undefined && opacityOverride !== -1 ? opacityOverride : globalPointOpacity;

    // 3D scatter 数据：[pc1, pc2, pc3] + 元信息
    const processedData = groupData.map(d => {
      const isSelected = selectedSamples.includes(d.sampleName);
      return {
        value: [d.pc1, d.pc2, d.pc3] as [number, number, number],
        sampleName: d.sampleName,
        groupName: d.groupName,
        color,
        selected: isSelected,
        // 选中点加大尺寸
        symbolSize: isSelected ? effectiveSize * 2 : effectiveSize,
        itemStyle: {
          color,
          opacity: effectiveOpacity,
          // 选中点加边框效果
          borderColor: isSelected ? '#000' : undefined,
          borderWidth: isSelected ? 2 : 0,
        },
      };
    });

    return {
      name: group.name,
      type: 'scatter3D' as const,
      data: processedData,
      symbol: symbol3D,
      symbolSize: effectiveSize,
      itemStyle: {
        color,
        opacity: effectiveOpacity,
      },
      // 3D emphasis
      emphasis: {
        itemStyle: {
          opacity: 1,
          borderColor: '#333',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: (p: unknown) => {
            const param = p as { sampleName?: string };
            return param.sampleName ?? '';
          },
          fontSize: 12,
        },
      },
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const option: Record<string, any> = {
    backgroundColor: background === 'transparent' ? 'transparent' : '#ffffff',
    animation: true,
    animationDuration: 300,

    // 图表标题
    title: chartTitle.show ? {
      text: chartTitle.text,
      left: 'center',
      top: 5,
      textStyle: {
        fontFamily: chartTitle.fontFamily,
        fontSize: chartTitle.fontSize,
        fontWeight: chartTitle.bold ? 'bold' : 'normal',
        color: chartTitle.color,
      },
    } : undefined,

    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(40, 40, 40, 0.85)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontFamily: tooltipFontFamily,
        fontSize: tooltipFontSize,
      },
      formatter: (params: unknown) => {
        const p = params as {
          seriesName?: string;
          data?: {
            sampleName?: string;
            groupName?: string;
            value?: [number, number, number];
          };
        };
        if (!p.data?.value) return '';
        const d = p.data;
        const name = d.sampleName ?? '?';
        const group = d.groupName ?? p.seriesName ?? '?';
        const vals = d.value!;
        const pc1 = vals[0]?.toFixed(4) ?? '?';
        const pc2 = vals[1]?.toFixed(4) ?? '?';
        const pc3 = vals[2]?.toFixed(4) ?? '?';
        return `<div style="padding:4px 8px;line-height:1.6">
          <strong>${name}</strong><br/>
          分组: ${group}<br/>
          PC1: ${pc1}<br/>
          PC2: ${pc2}<br/>
          PC3: ${pc3}
        </div>`;
      },
    },

    legend: { show: false },

    // 3D 网格 — 缩小盒子 + 增大摄像机距离，防止轴标题被剪切
    grid3D: {
      boxWidth: 90,
      boxHeight: 90,
      boxDepth: 90,
      viewControl: {
        autoRotate: false,
        zoomSensitivity: 30,
        rotateSensitivity: 25,
        panSensitivity: 25,
        distance: 250,
        alpha: 30,   // 垂直视角角度
        beta: 40,    // 水平视角角度
      },
      axisLine: {
        lineStyle: { color: '#333' },
      },
      axisPointer: {
        lineStyle: { color: '#999' },
      },
    },

    // X 轴 (PC1)
    xAxis3D: {
      type: 'value',
      name: xAxisTitle,
      nameTextStyle: {
        fontSize: 13,
      },
      axisLabel: {
        fontSize: 11,
      },
    },

    // Y 轴 (PC2)
    yAxis3D: {
      type: 'value',
      name: yAxisTitle,
      nameTextStyle: {
        fontSize: 13,
      },
      axisLabel: {
        fontSize: 11,
      },
    },

    // Z 轴 (PC3)
    zAxis3D: {
      type: 'value',
      name: zAxisTitle,
      nameTextStyle: {
        fontSize: 13,
      },
      axisLabel: {
        fontSize: 11,
      },
    },

    series,
  };

  // echarts-gl 的 scatter3D 类型不在基础 ECharts 类型定义中，需要断言
  return option as unknown as EChartsOption;
}
