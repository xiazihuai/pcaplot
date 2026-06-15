// 配色方案定义 — 7套方案，每套 ≥10 种颜色
import { logger } from '../utils/logger';

const MODULE = 'colorSchemes';

export type ColorSchemeId =
  | 'tableau10'
  | 'nature'
  | 'colorbrewerSet1'
  | 'wong2011'
  | 'viridisDiscrete'
  | 'highContrast'
  | 'customWarm';

export interface ColorScheme {
  id: ColorSchemeId;
  name: string;
  description: string;
  colors: string[];
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'tableau10',
    name: 'Tableau 10',
    description: '经典Tableau配色，区分度高，适合屏幕显示',
    colors: [
      '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
      '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC',
      '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
    ],
  },
  {
    id: 'nature',
    name: 'Nature 配色',
    description: '受Nature期刊图表启发，柔和专业',
    colors: [
      '#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F',
      '#8491B4', '#91D1C2', '#DC0000', '#7E6148', '#B09C85',
      '#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F',
    ],
  },
  {
    id: 'colorbrewerSet1',
    name: 'ColorBrewer Set1',
    description: 'ColorBrewer经典定性配色方案',
    colors: [
      '#E41A1C', '#377EB8', '#4DAF4A', '#984EA3', '#FF7F00',
      '#FFFF33', '#A65628', '#F781BF', '#999999', '#66C2A5',
      '#E41A1C', '#377EB8', '#4DAF4A', '#984EA3', '#FF7F00',
    ],
  },
  {
    id: 'wong2011',
    name: 'Wong 2011 (色盲友好)',
    description: 'Wong 2011色盲友好方案，覆盖常见色盲类型',
    colors: [
      '#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442',
      '#0072B2', '#D55E00', '#CC79A7', '#882255', '#44AA99',
      '#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442',
    ],
  },
  {
    id: 'viridisDiscrete',
    name: 'Viridis 离散化',
    description: '从Viridis连续色图中均匀采样，感知均匀',
    colors: [
      '#440154', '#472F7D', '#3E4F8A', '#326B8D', '#26858C',
      '#1FA187', '#40BC74', '#7AD251', '#BCE320', '#FDE725',
      '#440154', '#472F7D', '#3E4F8A', '#326B8D', '#26858C',
    ],
  },
  {
    id: 'highContrast',
    name: '高对比度',
    description: '手动挑选的高对比度颜色组合，适合复杂图表',
    colors: [
      '#FF0000', '#0000FF', '#00CC00', '#FF6600', '#9900CC',
      '#00CCCC', '#CC0066', '#336600', '#000066', '#CC9900',
      '#FF0000', '#0000FF', '#00CC00', '#FF6600', '#9900CC',
    ],
  },
  {
    id: 'customWarm',
    name: '暖色调',
    description: '以暖色为主调的备选方案',
    colors: [
      '#D73027', '#F46D43', '#FDAE61', '#FEE090', '#E0F3F8',
      '#ABD9E9', '#74ADD1', '#4575B4', '#542788', '#B35806',
      '#D73027', '#F46D43', '#FDAE61', '#FEE090', '#E0F3F8',
    ],
  },
];

export function getColor(schemeId: ColorSchemeId, index: number): string {
  const scheme = COLOR_SCHEMES.find(s => s.id === schemeId);
  if (!scheme) {
    logger.warn(MODULE, `未找到配色方案: ${schemeId}，回退到tableau10`);
    const fallback = COLOR_SCHEMES[0];
    return fallback.colors[index % fallback.colors.length];
  }
  return scheme.colors[index % scheme.colors.length];
}

export function getAllSchemes(): ColorScheme[] {
  return COLOR_SCHEMES;
}

export function getSchemeById(id: ColorSchemeId): ColorScheme | undefined {
  return COLOR_SCHEMES.find(s => s.id === id);
}

export function getDefaultSchemeId(): ColorSchemeId {
  return 'tableau10';
}

export function getSchemeNames(): { id: ColorSchemeId; name: string }[] {
  return COLOR_SCHEMES.map(s => ({ id: s.id, name: s.name }));
}
