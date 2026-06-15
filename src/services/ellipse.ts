// 置信椭圆计算服务
import { logger } from '../utils/logger';

const MODULE = 'ellipse';

export interface EllipseParams {
  centerX: number;
  centerY: number;
  semiMajor: number;
  semiMinor: number;
  angle: number;  // 弧度
}

export interface EllipsePoint {
  x: number;
  y: number;
}

// 2自由度卡方值
const CHI2_VALUES: Record<number, number> = {
  0.90: 4.605,
  0.95: 5.991,
  0.99: 9.210,
};

/**
 * 计算置信椭圆
 */
export function computeConfidenceEllipse(
  points: { x: number; y: number }[],
  confidence: 0.90 | 0.95 | 0.99,
): { params: EllipseParams; boundary: EllipsePoint[] } {
  const n = points.length;
  if (n < 3) throw new Error('至少需要3个点计算椭圆');

  // 1. 均值
  let sumX = 0, sumY = 0;
  for (const p of points) { sumX += p.x; sumY += p.y; }
  const centerX = sumX / n;
  const centerY = sumY / n;

  // 2. 协方差矩阵
  let covXX = 0, covYY = 0, covXY = 0;
  for (const p of points) {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    covXX += dx * dx;
    covYY += dy * dy;
    covXY += dx * dy;
  }
  covXX /= (n - 1);
  covYY /= (n - 1);
  covXY /= (n - 1);

  // 3. 特征值
  const trace = covXX + covYY;
  const det = covXX * covYY - covXY * covXY;
  const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
  const lambda1 = trace / 2 + disc;
  const lambda2 = trace / 2 - disc;

  // 4. 半轴长度
  const chi2 = CHI2_VALUES[confidence] ?? 5.991;
  const semiMajor = Math.sqrt(Math.max(0, lambda1) * chi2);
  const semiMinor = Math.sqrt(Math.max(0, lambda2) * chi2);

  // 5. 角度
  const angle = Math.atan2(covXY, covXX - covYY) / 2;

  // 6. 边界点（64点近似）
  const boundary: EllipsePoint[] = [];
  const steps = 64;
  for (let i = 0; i < steps; i++) {
    const t = (2 * Math.PI * i) / steps;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const x = centerX + semiMajor * cosT * cosA - semiMinor * sinT * sinA;
    const y = centerY + semiMajor * cosT * sinA + semiMinor * sinT * cosA;
    boundary.push({ x, y });
  }

  logger.debug(MODULE, '置信椭圆计算完成', {
    n, confidence,
    center: { x: centerX.toFixed(3), y: centerY.toFixed(3) },
    semiMajor: semiMajor.toFixed(3), semiMinor: semiMinor.toFixed(3),
    angleDeg: (angle * 180 / Math.PI).toFixed(1),
  });

  return {
    params: { centerX, centerY, semiMajor, semiMinor, angle },
    boundary,
  };
}
