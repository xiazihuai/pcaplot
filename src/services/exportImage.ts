// 图片导出服务 — 将整个画布（pca-canvas）导出为图片
// 包含：网格点背景 + PCA主图 + 图例
import * as echarts from 'echarts';
import { useDataStore } from '../stores/useDataStore';
import { useStyleStore } from '../stores/useStyleStore';
import { getShapeById } from './shapeDefinitions';
import type { ShapeDefinition } from './shapeDefinitions';
import { logger } from '../utils/logger';

const MODULE = 'exportImage';

/**
 * 导出图片（包含整个画布区域）
 * - PNG/JPEG: Canvas 合成（网格背景 + 图表 + 图例）
 * - SVG: 生成真正的 SVG 文件，内嵌 PNG 图表 + SVG 图例 + 网格背景
 */
export async function exportImage(
  format: 'png' | 'svg' | 'jpeg',
  dpi: number = 150,
  includeLegend: boolean = true,
): Promise<void> {
  logger.info(MODULE, '开始导出图片', { format, dpi, includeLegend });

  const chartDiv = document.querySelector('.chart-container') as HTMLElement;
  if (!chartDiv) throw new Error('未找到图表实例');

  const instance = echarts.getInstanceByDom(chartDiv);
  if (!instance) throw new Error('ECharts 实例未初始化');

  const canvasEl = document.querySelector('.pca-canvas') as HTMLElement;
  if (!canvasEl) throw new Error('未找到画布元素');

  const pixelRatio = dpi / 72;

  if (format === 'svg') {
    await exportSVG(instance, canvasEl, pixelRatio, includeLegend);
    return;
  }

  // PNG / JPEG: Canvas 合成
  await exportRaster(instance, canvasEl, format, pixelRatio, includeLegend);
}

/**
 * PNG/JPEG 导出 — 合成整个画布
 */
async function exportRaster(
  instance: echarts.ECharts,
  canvasEl: HTMLElement,
  format: 'png' | 'jpeg',
  pixelRatio: number,
  includeLegend: boolean,
): Promise<void> {
  const canvasRect = canvasEl.getBoundingClientRect();
  const canvasW = Math.round(canvasRect.width * pixelRatio);
  const canvasH = Math.round(canvasRect.height * pixelRatio);

  // 1. 从 ECharts 获取图表图像（透明背景，避免覆盖网格）
  const chartDataUrl = instance.getDataURL({
    type: 'png',
    pixelRatio,
    backgroundColor: 'transparent',
  });
  const chartImg = await loadImage(chartDataUrl);

  // 计算图表在画布中的位置
  const chartWrapper = document.querySelector('.chart-canvas-wrapper') as HTMLElement | null;
  const chartRect = chartWrapper?.getBoundingClientRect();
  const chartX = chartRect ? Math.round((chartRect.left - canvasRect.left) * pixelRatio) : 0;
  const chartY = chartRect ? Math.round((chartRect.top - canvasRect.top) * pixelRatio) : 0;

  // 2. 创建画布
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  // 3. 背景：PNG透明，JPEG白色
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // 4. 绘制图表阴影和边框
  if (chartWrapper) {
    const cw = Math.round(chartRect!.width * pixelRatio);
    const ch = Math.round(chartRect!.height * pixelRatio);
    const br = 4 * pixelRatio;

    // 阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = 8 * pixelRatio;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2 * pixelRatio;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, chartX, chartY, cw, ch, br);
    ctx.fill();
    ctx.restore();

    // 白色背景
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, chartX, chartY, cw, ch, br);
    ctx.fill();

    // 边框
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 1 * pixelRatio;
    roundRect(ctx, chartX, chartY, cw, ch, br);
    ctx.stroke();
  }

  // 5. 绘制图表
  ctx.drawImage(chartImg, chartX, chartY);

  // 6. 绘制图例
  if (includeLegend) {
    drawLegendOnCanvas(ctx, canvasEl, pixelRatio);
  }

  // 7. 下载
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType);
  downloadDataURL(dataUrl, format);

  logger.info(MODULE, `${format.toUpperCase()} 导出成功`, {
    dpi: Math.round(pixelRatio * 72),
    canvasSize: `${canvasW}x${canvasH}`,
  });
}

/**
 * SVG 导出 — 生成包含完整画布的 SVG
 */
async function exportSVG(
  instance: echarts.ECharts,
  canvasEl: HTMLElement,
  pixelRatio: number,
  includeLegend: boolean,
): Promise<void> {
  const canvasRect = canvasEl.getBoundingClientRect();
  const canvasW = Math.round(canvasRect.width * pixelRatio);
  const canvasH = Math.round(canvasRect.height * pixelRatio);

  // 1. 获取图表图像
  const chartDataUrl = instance.getDataURL({
    type: 'png',
    pixelRatio,
    backgroundColor: 'transparent',
  });

  // 计算图表在画布中的位置
  const chartWrapper = document.querySelector('.chart-canvas-wrapper') as HTMLElement | null;
  const chartRect = chartWrapper?.getBoundingClientRect();
  const chartX = chartRect ? Math.round((chartRect.left - canvasRect.left) * pixelRatio) : 0;
  const chartY = chartRect ? Math.round((chartRect.top - canvasRect.top) * pixelRatio) : 0;

  // 2. 构建 SVG
  let svg = '';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">\n`;

  // 3. 图表区域（阴影 + 白色背景 + 边框，画布背景透明）
  if (chartWrapper && chartRect) {
    const cw = Math.round(chartRect.width * pixelRatio);
    const ch = Math.round(chartRect.height * pixelRatio);
    const br = 4 * pixelRatio;

    // 阴影滤镜
    svg += `  <defs>
    <filter id="chartShadow" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="${2 * pixelRatio}" stdDeviation="${4 * pixelRatio}" flood-color="rgba(0,0,0,0.06)" />
    </filter>
  </defs>\n`;
    svg += `  <rect x="${chartX}" y="${chartY}" width="${cw}" height="${ch}" rx="${br}" ry="${br}" fill="#ffffff" stroke="#dddddd" stroke-width="${1 * pixelRatio}" filter="url(#chartShadow)" />\n`;
    // 图表图像
    svg += `  <image href="${chartDataUrl}" x="${chartX}" y="${chartY}" width="${cw}" height="${ch}" />\n`;
  }

  // 6. 图例
  if (includeLegend) {
    const legendSvg = buildLegendAsSVG(canvasEl, pixelRatio);
    svg += legendSvg;
  }

  svg += '</svg>';

  // 7. 下载
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  downloadDataURL(url, 'svg');
  URL.revokeObjectURL(url);

  logger.info(MODULE, 'SVG 导出成功', {
    dpi: Math.round(pixelRatio * 72),
    canvasSize: `${canvasW}x${canvasH}`,
  });
}

/**
 * 在 Canvas 上手动绘制图例（位置相对于画布）
 * - 支持多列布局（legendStyle.columns）
 * - 支持 8 种分组形状
 */
function drawLegendOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasEl: HTMLElement,
  pixelRatio: number,
): void {
  const legendEl = document.querySelector('.custom-legend') as HTMLElement | null;
  if (!legendEl) return;

  const groups = useDataStore.getState().groups;
  const styleState = useStyleStore.getState();
  const groupColorOverrides = styleState.groupColorOverrides;
  const groupShapeOverrides = styleState.groupShapeOverrides;
  const columns = styleState.legendStyle.columns || 1;
  if (groups.length === 0) return;

  const canvasRect = canvasEl.getBoundingClientRect();
  const legendRect = legendEl.getBoundingClientRect();

  const lx = Math.round((legendRect.left - canvasRect.left) * pixelRatio);
  const ly = Math.round((legendRect.top - canvasRect.top) * pixelRatio);
  const lw = Math.round(legendRect.width * pixelRatio);
  const lh = Math.round(legendRect.height * pixelRatio);

  // 裁剪检查
  if (lx + lw <= 0 || ly + lh <= 0 || lx >= ctx.canvas.width || ly >= ctx.canvas.height) return;

  const padX = Math.round(10 * pixelRatio);
  const padY = Math.round(10 * pixelRatio);
  const radius = Math.round(6 * pixelRatio);
  const itemH = Math.round(22 * pixelRatio);
  const dotR = Math.round(5 * pixelRatio);
  const itemFontSize = Math.round(13 * pixelRatio);
  const textGap = Math.round(6 * pixelRatio);

  // 背景圆角矩形
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1 * pixelRatio;
  roundRect(ctx, lx, ly, lw, lh, radius);
  ctx.fill();
  ctx.stroke();

  // 计算列宽
  const contentW = lw - 2 * padX;
  const colWidth = contentW / columns;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const color = groupColorOverrides[group.name] ?? group.color;
    const shapeId = groupShapeOverrides[group.name] ?? group.shape;
    const shapeDef = getShapeById(shapeId);

    const col = i % columns;
    const row = Math.floor(i / columns);
    const itemX = lx + padX + col * colWidth;
    const itemY = ly + padY + row * itemH;
    const dotX = itemX + dotR;
    const dotY = itemY + itemH / 2;

    // 绘制正确形状
    ctx.fillStyle = color;
    if (shapeDef) {
      drawShapeOnCanvas(ctx, dotX, dotY, dotR, shapeDef);
    } else {
      // fallback: 圆形
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5 * pixelRatio;
    ctx.stroke();

    // 组名（在列内截断）
    ctx.fillStyle = '#333333';
    ctx.font = `${itemFontSize}px sans-serif`;
    const textX = dotX + dotR + textGap;
    const textY = dotY + dotR * 0.6;
    const maxTextWidth = colWidth - dotR * 2 - textGap - Math.round(4 * pixelRatio);
    const displayName = truncateText(ctx, group.name, maxTextWidth);
    ctx.fillText(displayName, textX, textY);
  }
}

/**
 * 在 Canvas 上绘制形状符号（中心点定位）
 */
function drawShapeOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  shape: ShapeDefinition,
): void {
  ctx.beginPath();
  switch (shape.id) {
    case 1: // 圆形
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 2: { // 正方形
      const half = r * 0.75;
      ctx.rect(cx - half, cy - half, half * 2, half * 2);
      ctx.fill();
      return;
    }
    case 3: { // 三角(上)
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.875, cy + r * 0.75);
      ctx.lineTo(cx - r * 0.875, cy + r * 0.75);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 4: { // 三角(下)
      ctx.moveTo(cx, cy + r);
      ctx.lineTo(cx - r * 0.875, cy - r * 0.75);
      ctx.lineTo(cx + r * 0.875, cy - r * 0.75);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 5: { // 菱形
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.875, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r * 0.875, cy);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 6: { // 五角星
      const outerR = r;
      const innerR = r * 0.382;
      for (let j = 0; j < 10; j++) {
        const angle = (Math.PI / 2) * -1 + (Math.PI * j) / 5;
        const radius = j % 2 === 0 ? outerR : innerR;
        const px = cx + Math.cos(angle) * radius;
        const py = cy - Math.sin(angle) * radius;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 7: { // 六边形
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI / 2) * -1 + (Math.PI * j) / 3;
        const px = cx + Math.cos(angle) * r;
        const py = cy - Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 8: { // 十字
      const w = r * 0.35;
      const h = r;
      ctx.rect(cx - w, cy - h, w * 2, h * 2);  // 竖条
      ctx.rect(cx - h, cy - w, h * 2, w * 2);  // 横条
      ctx.fill();
      return;
    }
    default:
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
  }
}

/**
 * Canvas 文字截断（添加省略号）
 */
function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (maxWidth <= 0) return '';
  const measured = ctx.measureText(text);
  if (measured.width <= maxWidth) return text;
  // 二分查找合适长度
  let lo = 3, hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (ctx.measureText(text.substring(0, mid) + '…').width <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return text.substring(0, lo) + '…';
}

/**
 * 构建图例的 SVG 元素（位置相对于画布）
 * - 支持多列布局（legendStyle.columns）
 * - 支持 8 种分组形状
 */
function buildLegendAsSVG(
  canvasEl: HTMLElement,
  pixelRatio: number,
): string {
  const legendEl = document.querySelector('.custom-legend') as HTMLElement | null;
  if (!legendEl) return '';

  const groups = useDataStore.getState().groups;
  const styleState = useStyleStore.getState();
  const groupColorOverrides = styleState.groupColorOverrides;
  const groupShapeOverrides = styleState.groupShapeOverrides;
  const columns = styleState.legendStyle.columns || 1;
  if (groups.length === 0) return '';

  const canvasRect = canvasEl.getBoundingClientRect();
  const legendRect = legendEl.getBoundingClientRect();

  const lx = Math.round((legendRect.left - canvasRect.left) * pixelRatio);
  const ly = Math.round((legendRect.top - canvasRect.top) * pixelRatio);
  const lw = Math.round(legendRect.width * pixelRatio);
  const lh = Math.round(legendRect.height * pixelRatio);

  if (lx + lw <= 0 || ly + lh <= 0) return '';

  const padX = Math.round(10 * pixelRatio);
  const padY = Math.round(10 * pixelRatio);
  const radius = Math.round(6 * pixelRatio);
  const itemH = Math.round(22 * pixelRatio);
  const dotR = Math.round(5 * pixelRatio);
  const itemFontSize = Math.round(13 * pixelRatio);
  const textGap = Math.round(6 * pixelRatio);

  const contentW = lw - 2 * padX;
  const colWidth = contentW / columns;

  let svg = '';
  // 背景
  svg += `  <rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${radius}" ry="${radius}" fill="rgba(255,255,255,0.92)" stroke="#dddddd" stroke-width="${1 * pixelRatio}" />\n`;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const color = groupColorOverrides[group.name] ?? group.color;
    const shapeId = groupShapeOverrides[group.name] ?? group.shape;
    const shapeDef = getShapeById(shapeId);

    const col = i % columns;
    const row = Math.floor(i / columns);
    const itemX = lx + padX + col * colWidth;
    const itemY = ly + padY + row * itemH;
    const dotX = itemX + dotR;
    const dotY = itemY + itemH / 2;

    // 形状符号
    svg += buildShapeSVG(dotX, dotY, dotR, color, shapeDef, pixelRatio);

    // 组名（SVG 不支持文字截断，使用 clipPath 或省略号逻辑）
    const textX = dotX + dotR + textGap;
    const textY = dotY + dotR;
    svg += `  <text x="${textX}" y="${textY}" font-family="sans-serif" font-size="${itemFontSize}" fill="#333333">${escapeXml(group.name)}</text>\n`;
  }

  return svg;
}

/**
 * 构建单个形状的 SVG 元素
 */
function buildShapeSVG(
  cx: number,
  cy: number,
  r: number,
  color: string,
  shape: ShapeDefinition | undefined,
  pixelRatio: number,
): string {
  const strokeW = 0.5 * pixelRatio;
  const stroke = `stroke="rgba(0,0,0,0.15)" stroke-width="${strokeW}"`;

  if (!shape) {
    return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" ${stroke} />\n`;
  }

  const s = r / 8; // 从 16×16 坐标系缩放到目标尺寸

  switch (shape.id) {
    case 1: // 圆形
      return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" ${stroke} />\n`;
    case 2: { // 正方形
      const half = r * 0.75;
      return `  <rect x="${cx - half}" y="${cy - half}" width="${half * 2}" height="${half * 2}" fill="${color}" ${stroke} />\n`;
    }
    case 3: // 三角(上)
      return `  <polygon points="${cx},${cy - r} ${cx + r * 0.875},${cy + r * 0.75} ${cx - r * 0.875},${cy + r * 0.75}" fill="${color}" ${stroke} />\n`;
    case 4: // 三角(下)
      return `  <polygon points="${cx},${cy + r} ${cx - r * 0.875},${cy - r * 0.75} ${cx + r * 0.875},${cy - r * 0.75}" fill="${color}" ${stroke} />\n`;
    case 5: // 菱形
      return `  <polygon points="${cx},${cy - r} ${cx + r * 0.875},${cy} ${cx},${cy + r} ${cx - r * 0.875},${cy}" fill="${color}" ${stroke} />\n`;
    case 6: { // 五角星 — 10 个顶点
      const outerR = r;
      const innerR = r * 0.382;
      const pts: string[] = [];
      for (let j = 0; j < 10; j++) {
        const angle = -Math.PI / 2 + (Math.PI * j) / 5;
        const radius = j % 2 === 0 ? outerR : innerR;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        pts.push(`${px},${py}`);
      }
      return `  <polygon points="${pts.join(' ')}" fill="${color}" ${stroke} />\n`;
    }
    case 7: { // 六边形
      const pts: string[] = [];
      for (let j = 0; j < 6; j++) {
        const angle = -Math.PI / 2 + (Math.PI * j) / 3;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        pts.push(`${px},${py}`);
      }
      return `  <polygon points="${pts.join(' ')}" fill="${color}" ${stroke} />\n`;
    }
    case 8: { // 十字
      const w = r * 0.35;
      const h = r;
      return `  <path d="M${cx - w},${cy - h} L${cx + w},${cy - h} L${cx + w},${cy - w} L${cx + h},${cy - w} L${cx + h},${cy + w} L${cx + w},${cy + w} L${cx + w},${cy + h} L${cx - w},${cy + h} L${cx - w},${cy + w} L${cx - h},${cy + w} L${cx - h},${cy - w} L${cx - w},${cy - w} Z" fill="${color}" ${stroke} />\n`;
    }
    default:
      return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" ${stroke} />\n`;
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * 绘制圆角矩形路径
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function downloadDataURL(dataUrl: string, format: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  link.download = `pca_plot_${timestamp}.${format}`;
  link.click();
}
