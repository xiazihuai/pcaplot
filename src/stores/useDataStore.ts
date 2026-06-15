// 数据层 Store — 不可变数据、分组推导
import { create } from 'zustand';
import type { RawDataRow, ParsedDataRow, GroupInfo, SkippedRowInfo } from '../types/data';
import type { OutlierResult } from '../services/outlierDetection';
import { parseFile } from '../services/parser';
import { detectOutliers } from '../services/outlierDetection';
import { getColor } from '../services/colorSchemes';
import { getShape } from '../services/shapeDefinitions';
import type { ColorSchemeId } from '../services/colorSchemes';
import { logger } from '../utils/logger';
import { DEFAULT_COLOR_SCHEME_ID } from '../constants/defaults';
import { useUIStore } from './useUIStore';

const MODULE = 'dataStore';

interface DataStoreState {
  rawRows: RawDataRow[];
  parsedRows: ParsedDataRow[];
  groups: GroupInfo[];
  skippedRows: SkippedRowInfo[];

  xAxisTitle: string;
  yAxisTitle: string;
  originalHeaders: string[];

  fileName: string | null;

  // 离群检测结果
  outlierResult: OutlierResult | null;

  importFile: (file: File, encoding?: string) => Promise<void>;
  updateGroupName: (oldName: string, newName: string) => void;
  setAxisTitles: (titles: { x?: string; y?: string }) => void;
  clearData: () => void;
  // 当配色方案变更时同步颜色
  syncGroupColors: (schemeId: ColorSchemeId) => void;
  // 运行离群检测
  runOutlierDetection: (confidence: 0.90 | 0.95 | 0.99) => void;
}

export const useDataStore = create<DataStoreState>((set, get) => ({
  rawRows: [],
  parsedRows: [],
  groups: [],
  skippedRows: [],
  xAxisTitle: 'PC1',
  yAxisTitle: 'PC2',
  originalHeaders: [],
  fileName: null,
  outlierResult: null,

  importFile: async (file: File, encoding?: string) => {
    logger.info(MODULE, `导入文件: ${file.name}`);
    const result = await parseFile(file, encoding);

    // 编码置信度低时弹出编码选择弹窗
    if (!encoding && result.encodingConfidence === 'low') {
      useUIStore.getState().openEncodingDialog(file);
      // 仍然尝试用检测到的编码显示数据
    }

    const parsedRows: ParsedDataRow[] = result.rows.map(r => ({
      sampleName: r.sampleName,
      groupName: r.groupName,
      pc1: r.pc1,
      pc2: r.pc2,
    }));

    const uniqueGroups = [...new Set(parsedRows.map(r => r.groupName))].sort();
    const schemeId: ColorSchemeId = DEFAULT_COLOR_SCHEME_ID;

    const groups: GroupInfo[] = uniqueGroups.map((name, i) => ({
      name,
      originalName: name,
      count: parsedRows.filter(r => r.groupName === name).length,
      color: getColor(schemeId, i),
      shape: getShape(i).id,
      pointSize: -1,
      opacity: -1,        // -1 表示使用全局
      ellipseEnabled: true, // 默认所有组开启椭圆
    }));

    const xTitle = result.hasHeader && result.headers.length >= 3 ? result.headers[2] : 'PC1';
    const yTitle = result.hasHeader && result.headers.length >= 4 ? result.headers[3] : 'PC2';

    set({
      rawRows: result.rows,
      parsedRows,
      groups,
      skippedRows: result.skippedRows,
      xAxisTitle: xTitle,
      yAxisTitle: yTitle,
      originalHeaders: result.headers,
      fileName: file.name,
    });

    // 触发离群检测（使用默认95%置信度）
    get().runOutlierDetection(0.95);

    logger.info(MODULE, '数据导入完成', {
      fileName: file.name,
      totalRows: parsedRows.length,
      groups: groups.length,
      skippedRows: result.skippedRows.length,
      groupsDetail: groups.map(g => ({ name: g.name, count: g.count, color: g.color, shape: g.shape })),
    });
  },

  updateGroupName: (oldName: string, newName: string) => {
    logger.debug(MODULE, '更新组名', { oldName, newName });
    set(state => ({
      groups: state.groups.map(g =>
        g.name === oldName ? { ...g, name: newName } : g
      ),
      parsedRows: state.parsedRows.map(r =>
        r.groupName === oldName ? { ...r, groupName: newName } : r
      ),
    }));
  },

  setAxisTitles: (titles) => {
    logger.debug(MODULE, '更新轴标题', titles);
    set(state => ({
      xAxisTitle: titles.x !== undefined ? titles.x : state.xAxisTitle,
      yAxisTitle: titles.y !== undefined ? titles.y : state.yAxisTitle,
    }));
  },

  clearData: () => {
    logger.info(MODULE, '清除全部数据');
    set({
      rawRows: [],
      parsedRows: [],
      groups: [],
      skippedRows: [],
      xAxisTitle: 'PC1',
      yAxisTitle: 'PC2',
      originalHeaders: [],
      fileName: null,
    });
  },

  syncGroupColors: (schemeId: ColorSchemeId) => {
    logger.debug(MODULE, '同步分组颜色', { schemeId });
    set(state => ({
      groups: state.groups.map((g, i) => ({
        ...g,
        color: getColor(schemeId, i),
      })),
    }));
  },

  runOutlierDetection: (confidence) => {
    const { parsedRows, groups } = get();
    if (parsedRows.length === 0 || groups.length < 2) {
      set({ outlierResult: null });
      return;
    }
    const result = detectOutliers(parsedRows, groups, confidence);
    set({ outlierResult: result });
    if (result.candidates.length > 0) {
      logger.warn(MODULE, `离群检测: ${result.candidates.length} 个候选离群点`);
    }
  },
}));
