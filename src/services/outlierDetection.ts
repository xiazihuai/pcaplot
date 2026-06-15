// 离群检测服务 — 跨组椭圆包含检测
// 检测某个组的点是否落在其他组的置信椭圆内，提示可能的分组异常
import type { ParsedDataRow, GroupInfo } from '../types/data';
import { computeConfidenceEllipse } from './ellipse';
import { logger } from '../utils/logger';

const MODULE = 'outlierDetection';

export interface OutlierCandidate {
  /** 样本名 */
  sampleName: string;
  /** 样本所属的实际分组 */
  sourceGroup: string;
  /** 样本落入的目标椭圆分组 */
  targetGroup: string;
  /** 点在椭圆内的归一化距离平方 (<1 表示在椭圆内) */
  normalizedDistSq: number;
  /** PC1 坐标 */
  pc1: number;
  /** PC2 坐标 */
  pc2: number;
}

export interface OutlierResult {
  /** 离群候选列表（按归一化距离升序，越小的越靠内） */
  candidates: OutlierCandidate[];
  /** 统计摘要 */
  summary: {
    totalChecked: number;
    totalOutliers: number;
    /** 每个目标组收到的外来点数 */
    byTargetGroup: Record<string, number>;
    /** 每个源组流出到其他组的点数 */
    bySourceGroup: Record<string, number>;
  };
}

/**
 * 执行跨组离群检测
 *
 * 对每个有 ≥3 个点的组计算置信椭圆，然后遍历所有点，
 * 检查点是否落在非所属组的椭圆内。如果点在某个椭圆内，
 * 且归一化距离 (dx/a)²+(dy/b)² < 1，则标记为离群候选。
 */
const MAX_OUTLIER_POINTS = 50000;

export function detectOutliers(
  rows: ParsedDataRow[],
  groups: GroupInfo[],
  confidence: 0.90 | 0.95 | 0.99 = 0.95,
): OutlierResult {
  // 超过 50k 点跳过离群检测（计算量过大）
  if (rows.length > MAX_OUTLIER_POINTS) {
    logger.info(MODULE, `数据量 ${rows.length} 超过阈值，跳过离群检测`);
    return {
      candidates: [],
      summary: { totalChecked: rows.length, totalOutliers: 0, byTargetGroup: {}, bySourceGroup: {} },
    };
  }

  logger.info(MODULE, '开始离群检测', {
    totalPoints: rows.length,
    totalGroups: groups.length,
    confidence,
  });

  const candidates: OutlierCandidate[] = [];

  // 为每个 ≥3 点的组计算椭圆
  // 只检查开启了椭圆的组（ellipseEnabled !== false）
  interface GroupEllipse {
    groupName: string;
    centerX: number;
    centerY: number;
    semiMajor: number;
    semiMinor: number;
    angle: number; // 弧度
  }

  const ellipses: GroupEllipse[] = [];

  for (const group of groups) {
    if (group.count < 3) {
      logger.debug(MODULE, `跳过 "${group.name}"：点数不足3个`);
      continue;
    }
    const groupPoints = rows
      .filter(r => r.groupName === group.name)
      .map(r => ({ x: r.pc1, y: r.pc2 }));

    if (groupPoints.length < 3) continue;

    try {
      const { params } = computeConfidenceEllipse(groupPoints, confidence);
      ellipses.push({
        groupName: group.name,
        centerX: params.centerX,
        centerY: params.centerY,
        semiMajor: params.semiMajor,
        semiMinor: params.semiMinor,
        angle: params.angle,
      });
      logger.debug(MODULE, `"${group.name}" 椭圆: 中心(${params.centerX.toFixed(2)},${params.centerY.toFixed(2)}) 半轴(${params.semiMajor.toFixed(2)},${params.semiMinor.toFixed(2)})`);
    } catch (err) {
      logger.warn(MODULE, `"${group.name}" 椭圆计算失败`, err);
    }
  }

  if (ellipses.length < 2) {
    logger.debug(MODULE, '椭圆数不足2个，跳过离群检测');
    return {
      candidates: [],
      summary: { totalChecked: rows.length, totalOutliers: 0, byTargetGroup: {}, bySourceGroup: {} },
    };
  }

  // 检测每个点是否落在非所属组的椭圆内
  for (const row of rows) {
    for (const ellipse of ellipses) {
      // 跳过自己所属的组
      if (ellipse.groupName === row.groupName) continue;

      // 将点变换到椭圆的特征向量坐标系
      const dx = row.pc1 - ellipse.centerX;
      const dy = row.pc2 - ellipse.centerY;

      const cosA = Math.cos(-ellipse.angle);
      const sinA = Math.sin(-ellipse.angle);
      const rx = dx * cosA - dy * sinA; // 在椭圆长轴方向上的投影
      const ry = dx * sinA + dy * cosA; // 在椭圆短轴方向上的投影

      const a = Math.max(ellipse.semiMajor, 1e-6);
      const b = Math.max(ellipse.semiMinor, 1e-6);
      const distSq = (rx * rx) / (a * a) + (ry * ry) / (b * b);

      if (distSq < 1.0) {
        candidates.push({
          sampleName: row.sampleName,
          sourceGroup: row.groupName,
          targetGroup: ellipse.groupName,
          normalizedDistSq: distSq,
          pc1: row.pc1,
          pc2: row.pc2,
        });
      }
    }
  }

  // 按归一化距离排序（越靠内越靠前）
  candidates.sort((a, b) => a.normalizedDistSq - b.normalizedDistSq);

  // 生成摘要
  const byTargetGroup: Record<string, number> = {};
  const bySourceGroup: Record<string, number> = {};
  for (const c of candidates) {
    byTargetGroup[c.targetGroup] = (byTargetGroup[c.targetGroup] || 0) + 1;
    bySourceGroup[c.sourceGroup] = (bySourceGroup[c.sourceGroup] || 0) + 1;
  }

  const summary = {
    totalChecked: rows.length,
    totalOutliers: candidates.length,
    byTargetGroup,
    bySourceGroup,
  };

  if (candidates.length > 0) {
    logger.warn(MODULE, `检测到 ${candidates.length} 个离群候选`, summary);
  } else {
    logger.info(MODULE, '未检测到离群点');
  }

  return { candidates, summary };
}
