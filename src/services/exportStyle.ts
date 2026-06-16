// 样式导出服务 — .pcastyle JSON + 带样式注释的 .csv
import { useDataStore } from '../stores/useDataStore';
import { useStyleStore } from '../stores/useStyleStore';
import { APP_VERSION } from '../constants/version';
import type { PcaStyleJSON } from '../types/export';
import { logger } from '../utils/logger';

const MODULE = 'exportStyle';

function buildStyleJSON(): PcaStyleJSON {
  const dataState = useDataStore.getState();
  const styleState = useStyleStore.getState();

  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      rows: dataState.parsedRows.map(r => ({
        sampleName: r.sampleName,
        groupName: r.groupName,
        pc1: r.pc1,
        pc2: r.pc2,
        pc3: r.pc3,
      })),
      xAxisTitle: dataState.xAxisTitle,
      yAxisTitle: dataState.yAxisTitle,
      zAxisTitle: dataState.zAxisTitle,
      is3D: dataState.is3D,
    },
    style: styleState.exportStyleSnapshot(),
  };
}

export async function exportStyleAsJSON(): Promise<void> {
  logger.info(MODULE, '导出 .pcastyle 文件');
  const json = buildStyleJSON();
  const text = JSON.stringify(json, null, 2);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, 'pcastyle');
}

export async function exportStyleAsCSV(): Promise<void> {
  logger.info(MODULE, '导出带样式的 CSV 文件');
  const json = buildStyleJSON();

  // 构建 CSV 内容
  const styleBlock = JSON.stringify(json.style);
  const lines: string[] = [];
  lines.push('# PCAplot Style Export');
  lines.push(`# Version: ${APP_VERSION}`);
  lines.push(`# Exported: ${json.exportedAt}`);
  // 将 style JSON 分行注释
  const styleLines = styleBlock.match(/.{1,200}/g) ?? [styleBlock];
  for (const sl of styleLines) {
    lines.push(`# STYLE: ${sl}`);
  }
  lines.push('SampleName,Group,PC1,PC2,PC3');

  for (const row of json.data.rows) {
    lines.push(`${row.sampleName},${row.groupName},${row.pc1},${row.pc2},${row.pc3}`);
  }

  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, 'csv');
}

function downloadBlob(blob: Blob, ext: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  a.download = `pca_plot_${timestamp}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
