// 形状定义 — 8种ECharts散点图形状（2D）+ 7种echarts-gl 3D形状
// 使用SVG path定义非内置形状

export const SHAPE_COUNT = 8;

export interface ShapeDefinition {
  id: number;       // 1-8
  name: string;
  nameCN: string;
  // ECharts symbol: 内置名称 或 'path://...'
  symbol: string;
  // 小型SVG用于图例/选择器
  iconSVG: string;
}

// ==================== 3D 形状定义 ====================
// echarts-gl scatter3D 仅支持内置 symbol，不支持自定义 SVG path
// 可用符号: 'circle', 'square', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow'

export const SHAPE_3D_COUNT = 7;

export interface Shape3DDefinition {
  id: number;       // 1-7
  name: string;     // echarts-gl symbol 名称
  nameCN: string;
  symbol: string;   // echarts-gl scatter3D 内置 symbol
  iconSVG: string;  // 图例/选择器用 SVG
}

const SHAPES_3D: Shape3DDefinition[] = [
  { id: 1, name: 'circle',    nameCN: '圆形',   symbol: 'circle',    iconSVG: '<circle cx="8" cy="8" r="6"/>' },
  { id: 2, name: 'square',    nameCN: '方形',   symbol: 'square',    iconSVG: '<rect x="2" y="2" width="12" height="12"/>' },
  { id: 3, name: 'triangle',  nameCN: '三角',   symbol: 'triangle',  iconSVG: '<polygon points="8,1 15,14 1,14"/>' },
  { id: 4, name: 'diamond',   nameCN: '菱形',   symbol: 'diamond',   iconSVG: '<polygon points="8,1 15,8 8,15 1,8"/>' },
  { id: 5, name: 'roundRect', nameCN: '圆角方', symbol: 'roundRect',  iconSVG: '<rect x="2" y="3" width="12" height="10" rx="3" ry="3"/>' },
  { id: 6, name: 'pin',       nameCN: '图钉',   symbol: 'pin',       iconSVG: '<path d="M8,1 L14,15 L8,11 L2,15 Z"/>' },
  { id: 7, name: 'arrow',     nameCN: '箭头',   symbol: 'arrow',     iconSVG: '<polygon points="8,1 14,8 10,8 10,15 6,15 6,8 2,8"/>' },
];

/**
 * 2D 形状 ID → 3D 形状 ID 映射
 * 将 8 种 2D 形状映射到视觉最接近的 3D 内置符号
 */
const SHAPE_2D_TO_3D_MAP: Record<number, number> = {
  1: 1,  // circle    → circle
  2: 2,  // rect      → square
  3: 3,  // triangle  → triangle
  4: 4,  // triangleDown → diamond
  5: 4,  // diamond   → diamond
  6: 6,  // pentagram → pin
  7: 1,  // hexagon   → circle (无多边形)
  8: 7,  // cross     → arrow
};

/**
 * 3D 形状 ID → 首选 2D 形状 ID（用于存储到 groupShapeOverrides）
 * 当用户在 3D 面板中选择形状时，将其映射回 2D ID 存储
 */
const SHAPE_3D_TO_2D_MAP: Record<number, number> = {
  1: 1,  // circle    → circle
  2: 2,  // square    → rect
  3: 3,  // triangle  → triangle
  4: 5,  // diamond   → diamond (2D)
  5: 2,  // roundRect → rect (最接近)
  6: 6,  // pin       → pentagram (最接近)
  7: 8,  // arrow     → cross (最接近)
};

// 自定义SVG路径（在 0-1 坐标空间）
const HEXAGON_PATH = 'path://M0,-1 L0.866,-0.5 L0.866,0.5 L0,1 L-0.866,0.5 L-0.866,-0.5 Z';
const PENTAGRAM_PATH = 'path://M0,-1 L0.2245,-0.309 L0.9511,-0.309 L0.3633,0.118 L0.5878,0.809 L0,0.382 L-0.5878,0.809 L-0.3633,0.118 L-0.9511,-0.309 L-0.2245,-0.309 Z';
const CROSS_PATH = 'path://M-0.35,-1 L0.35,-1 L0.35,-0.35 L1,-0.35 L1,0.35 L0.35,0.35 L0.35,1 L-0.35,1 L-0.35,0.35 L-1,0.35 L-1,-0.35 L-0.35,-0.35 Z';
const TRIANGLE_DOWN_PATH = 'path://M0,1 L1,-1 L-1,-1 Z';

const SHAPES: ShapeDefinition[] = [
  { id: 1,  name: 'circle',    nameCN: '圆形',   symbol: 'circle',              iconSVG: '<circle cx="8" cy="8" r="6"/>' },
  { id: 2,  name: 'rect',      nameCN: '正方形', symbol: 'rect',                iconSVG: '<rect x="2" y="2" width="12" height="12"/>' },
  { id: 3,  name: 'triangle',  nameCN: '三角(上)', symbol: 'triangle',          iconSVG: '<polygon points="8,1 15,14 1,14"/>' },
  { id: 4,  name: 'triangleDown', nameCN: '三角(下)', symbol: TRIANGLE_DOWN_PATH, iconSVG: '<polygon points="8,14 1,1 15,1"/>' },
  { id: 5,  name: 'diamond',   nameCN: '菱形',   symbol: 'diamond',             iconSVG: '<polygon points="8,1 15,8 8,15 1,8"/>' },
  { id: 6,  name: 'pentagram', nameCN: '五角星', symbol: PENTAGRAM_PATH,        iconSVG: '<polygon points="8,1 9.8,5.5 14.6,6.2 11,9.7 11.8,14.5 8,12.5 4.2,14.5 5,9.7 1.4,6.2 6.2,5.5"/>' },
  { id: 7,  name: 'hexagon',   nameCN: '六边形', symbol: HEXAGON_PATH,           iconSVG: '<polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5"/>' },
  { id: 8,  name: 'cross',     nameCN: '十字',   symbol: CROSS_PATH,            iconSVG: '<path d="M5.2,0 L10.8,0 L10.8,5.2 L16,5.2 L16,10.8 L10.8,10.8 L10.8,16 L5.2,16 L5.2,10.8 L0,10.8 L0,5.2 L5.2,5.2 Z"/>' },
];

export function getShape(index: number): ShapeDefinition {
  return SHAPES[(index % SHAPE_COUNT + SHAPE_COUNT) % SHAPE_COUNT];
}

export function getShapeById(id: number): ShapeDefinition | undefined {
  return SHAPES.find(s => s.id === id);
}

export function getAllShapes(): ShapeDefinition[] {
  return [...SHAPES];
}

// ==================== 3D 形状工具函数 ====================

export function get3DShape(index: number): Shape3DDefinition {
  return SHAPES_3D[((index % SHAPE_3D_COUNT) + SHAPE_3D_COUNT) % SHAPE_3D_COUNT];
}

export function get3DShapeById(id: number): Shape3DDefinition | undefined {
  return SHAPES_3D.find(s => s.id === id);
}

export function getAll3DShapes(): Shape3DDefinition[] {
  return [...SHAPES_3D];
}

/**
 * 将 2D 形状 ID 映射到最接近的 3D 形状 ID
 */
export function map2DShapeTo3DId(shapeId2D: number): number {
  return SHAPE_2D_TO_3D_MAP[shapeId2D] ?? 1;
}

/**
 * 将 3D 形状 ID 反向映射到首选 2D 形状 ID（用于存储）
 */
export function map3DShapeTo2DId(shapeId3D: number): number {
  return SHAPE_3D_TO_2D_MAP[shapeId3D] ?? 1;
}

/**
 * 根据 2D 形状 ID 获取对应的 3D 形状定义（用于面板展示）
 */
export function get3DShapeFor2DId(shapeId2D: number): Shape3DDefinition {
  const id3D = map2DShapeTo3DId(shapeId2D);
  return get3DShapeById(id3D) ?? SHAPES_3D[0];
}

/**
 * 根据 3D 形状 ID 获取 echarts-gl symbol 名称
 */
export function get3DSymbol(shapeId3D: number): string {
  return get3DShapeById(shapeId3D)?.symbol ?? 'circle';
}
