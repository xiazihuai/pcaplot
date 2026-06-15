// 形状定义 — 8种ECharts散点图形状
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
