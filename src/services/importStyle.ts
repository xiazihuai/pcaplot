// 样式文件导入服务
import { useDataStore } from '../stores/useDataStore';
import { useStyleStore } from '../stores/useStyleStore';
import type { PcaStyleJSON } from '../types/export';
import { logger } from '../utils/logger';
import { parseFile } from './parser';
import { getColor, getDefaultSchemeId, COLOR_SCHEMES } from './colorSchemes';
import type { ColorSchemeId } from './colorSchemes';
import { getShape } from './shapeDefinitions';

const MODULE = 'importStyle';

export async function importStyleFile(file: File): Promise<void> {
  logger.info(MODULE, `导入样式文件: ${file.name}`);

  const text = await file.text();

  // 检测格式
  if (text.trim().startsWith('{')) {
    // .pcastyle JSON 格式
    await importFromJSON(text);
  } else if (text.includes('# PCAplot Style Export')) {
    // 带样式的 CSV
    await importFromStyledCSV(text);
  } else {
    throw new Error('不支持的样式文件格式，请导入 .pcastyle 或带样式的 CSV 文件');
  }
}

async function importFromJSON(text: string): Promise<void> {
  let json: PcaStyleJSON;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`JSON 解析失败: ${err}`);
  }

  if (!json.version || !json.style) {
    throw new Error('样式文件格式不正确，缺少必要字段');
  }

  logger.info(MODULE, '解析 .pcastyle 文件', { version: json.version });

  // 推导导入的配色方案 ID（在 if 块内外都需要用到）
  const rawSchemeId = (json.style?.activeColorSchemeId as string) || getDefaultSchemeId();
  const importedSchemeId: ColorSchemeId = (COLOR_SCHEMES.find(s => s.id === rawSchemeId)?.id as ColorSchemeId) ?? getDefaultSchemeId();

  // 恢复数据
  if (json.data?.rows?.length) {
    const dataStore = useDataStore.getState();
    const uniqueGroups = [...new Set(json.data.rows.map(r => r.groupName))].sort();

    useDataStore.setState({
      parsedRows: json.data.rows.map(r => ({
        sampleName: r.sampleName,
        groupName: r.groupName,
        pc1: r.pc1,
        pc2: r.pc2,
      })),
      groups: uniqueGroups.map((name, i) => ({
        name,
        originalName: name,
        count: json.data.rows.filter(r => r.groupName === name).length,
        color: getColor(importedSchemeId, i),
        shape: getShape(i).id,
        pointSize: -1,
        opacity: -1,
        ellipseEnabled: true,
      })),
      xAxisTitle: json.data.xAxisTitle || 'PC1',
      yAxisTitle: json.data.yAxisTitle || 'PC2',
      fileName: '(导入的样式)',
    });
  }

  // 恢复样式
  const styleStore = useStyleStore.getState();
  styleStore.importStyle(json);

  // 确保 group 颜色与导入的配色方案同步（处理无覆盖的情况）
  useDataStore.getState().syncGroupColors(importedSchemeId);

  logger.info(MODULE, '样式导入完成');
}

async function importFromStyledCSV(text: string): Promise<void> {
  logger.info(MODULE, '解析带样式的 CSV 文件');

  // 提取注释行中的样式 JSON
  const styleLines: string[] = [];
  const dataLines: string[] = [];

  for (const line of text.split('\n')) {
    if (line.startsWith('# STYLE: ')) {
      styleLines.push(line.substring('# STYLE: '.length).trim());
    } else if (!line.startsWith('#') && line.trim().length > 0) {
      dataLines.push(line);
    }
  }

  // 重新组装 JSON
  const styleJSON = styleLines.join('');
  let styleData: Record<string, unknown>;
  try {
    styleData = JSON.parse(styleJSON);
  } catch {
    throw new Error('无法解析 CSV 文件中的样式数据');
  }

  // 解析数据行
  const csvText = dataLines.join('\n');
  const blob = new Blob([csvText], { type: 'text/csv' });
  const file = new File([blob], 'imported.csv', { type: 'text/csv' });

  // 先解析数据
  const dataStore = useDataStore.getState();
  await dataStore.importFile(file);

  // 再恢复样式
  const pseudoStyleJSON: PcaStyleJSON = {
    version: '0.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      rows: [],
      xAxisTitle: 'PC1',
      yAxisTitle: 'PC2',
    },
    style: styleData,
  };

  const styleStore = useStyleStore.getState();
  styleStore.importStyle(pseudoStyleJSON);

  logger.info(MODULE, 'CSV 样式导入完成');
}
