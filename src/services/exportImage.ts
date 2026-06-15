// 图片导出服务 — 将整个画布（pca-canvas）导出为图片
// 包含：网格点背景 + PCA主图 + 图例
import * as echarts from 'echarts';
import { useDataStore } from '../stores/useDataStore';
import { useStyleStore } from '../stores/useStyleStore';
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
 */
function drawLegendOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasEl: HTMLElement,
  pixelRatio: number,
): void {
  const legendEl = document.querySelector('.custom-legend') as HTMLElement | null;
  if (!legendEl) return;

  const groups = useDataStore.getState().groups;
  const groupColorOverrides = useStyleStore.getState().groupColorOverrides;
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

  // 背景圆角矩形
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1 * pixelRatio;
  roundRect(ctx, lx, ly, lw, lh, radius);
  ctx.fill();
  ctx.stroke();

  // 每个分组
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const color = groupColorOverrides[group.name] ?? group.color;
    const itemY = ly + padY + i * itemH;
    const dotX = lx + padX + dotR;
    const dotY = itemY + itemH / 2;

    // 圆点
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5 * pixelRatio;
    ctx.stroke();

    // 组名
    ctx.fillStyle = '#333333';
    ctx.font = `${itemFontSize}px sans-serif`;
    const textX = dotX + dotR + Math.round(6 * pixelRatio);
    const textY = dotY + dotR * 0.6;
    ctx.fillText(group.name, textX, textY);
  }
}

/**
 * 构建图例的 SVG 元素（位置相对于画布）
 */
function buildLegendAsSVG(
  canvasEl: HTMLElement,
  pixelRatio: number,
): string {
  const legendEl = document.querySelector('.custom-legend') as HTMLElement | null;
  if (!legendEl) return '';

  const groups = useDataStore.getState().groups;
  const groupColorOverrides = useStyleStore.getState().groupColorOverrides;
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

  let svg = '';
  // 背景
  svg += `  <rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${radius}" ry="${radius}" fill="rgba(255,255,255,0.92)" stroke="#dddddd" stroke-width="${1 * pixelRatio}" />\n`;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const color = groupColorOverrides[group.name] ?? group.color;
    const itemY = ly + padY + i * itemH;
    const dotX = lx + padX + dotR;
    const dotY = itemY + itemH / 2;

    // 圆点
    svg += `  <circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="${color}" stroke="rgba(0,0,0,0.15)" stroke-width="${0.5 * pixelRatio}" />\n`;
    // 组名
    const textX = dotX + dotR + Math.round(6 * pixelRatio);
    const textY = dotY + dotR;
    svg += `  <text x="${textX}" y="${textY}" font-family="sans-serif" font-size="${itemFontSize}" fill="#333333">${escapeXml(group.name)}</text>\n`;
  }

  return svg;
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
