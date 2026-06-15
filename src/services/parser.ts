// 数据解析服务 — 编码检测、分隔符检测、表头检测、数据校验
import type { RawDataRow, ParseResult, SkippedRowInfo } from '../types/data';
import { logger } from '../utils/logger';

const MODULE = 'parser';

/**
 * 编码检测结果
 */
export interface EncodingDetection {
  encoding: string;
  confidence: 'high' | 'low';
}

/**
 * 检测文件编码
 * 1. 检查BOM
 * 2. 尝试UTF-8解码
 * 3. 回退GBK
 */
export async function detectEncoding(file: File): Promise<EncodingDetection> {
  logger.debug(MODULE, '开始编码检测', { fileName: file.name, fileSize: file.size });

  const buffer = await file.arrayBuffer();
  const header = new Uint8Array(buffer.slice(0, 4096));

  // BOM检测
  if (header[0] === 0xEF && header[1] === 0xBB && header[2] === 0xBF) {
    logger.debug(MODULE, '检测到 UTF-8 BOM');
    return { encoding: 'UTF-8', confidence: 'high' };
  }
  if (header[0] === 0xFE && header[1] === 0xFF) {
    logger.debug(MODULE, '检测到 UTF-16 BE BOM');
    return { encoding: 'UTF-16BE', confidence: 'high' };
  }
  if (header[0] === 0xFF && header[1] === 0xFE) {
    logger.debug(MODULE, '检测到 UTF-16 LE BOM');
    return { encoding: 'UTF-16LE', confidence: 'high' };
  }

  // 尝试UTF-8解码
  const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    utf8Decoder.decode(header);
    logger.debug(MODULE, 'UTF-8 解码成功');
    return { encoding: 'UTF-8', confidence: 'high' };
  } catch {
    logger.debug(MODULE, 'UTF-8 解码失败，尝试 GBK');
  }

  // 尝试GBK解码后检测是否有大量乱码字符
  const gbkDecoder = new TextDecoder('gbk', { fatal: false });
  const gbkText = gbkDecoder.decode(header);
  const replacementCount = (gbkText.match(/�/g) || []).length;
  if (replacementCount < gbkText.length * 0.05) {
    logger.debug(MODULE, 'GBK 解码成功', { replacementCount });
    return { encoding: 'GBK', confidence: 'high' };
  }

  logger.warn(MODULE, '编码检测不确定，回退UTF-8', { replacementCount, totalChars: gbkText.length });
  return { encoding: 'UTF-8', confidence: 'low' };
}

/**
 * 检测分隔符
 */
function detectDelimiter(lines: string[]): 'tab' | 'comma' | 'space' {
  // 取前5行数据行（跳过可能的表头）
  const sampleLines = lines.slice(0, Math.min(5, lines.length));

  let tabCount = 0, commaCount = 0, spaceCount = 0;
  for (const line of sampleLines) {
    const tabs = (line.match(/\t/g) || []).length;
    const commas = (line.match(/,/g) || []).length;
    const spaces = (line.match(/ {2,}/g) || []).length; // 连续2+空格
    tabCount += tabs;
    commaCount += commas;
    spaceCount += spaces;
  }

  logger.debug(MODULE, '分隔符统计', { tabCount, commaCount, spaceCount });

  if (tabCount >= commaCount && tabCount >= spaceCount && tabCount > 0) return 'tab';
  if (commaCount >= tabCount && commaCount >= spaceCount && commaCount > 0) return 'comma';
  if (spaceCount > 0) return 'space';
  // 默认逗号
  return 'comma';
}

/**
 * 按分隔符分割行
 */
function splitLine(line: string, delimiter: 'tab' | 'comma' | 'space'): string[] {
  switch (delimiter) {
    case 'tab':
      return line.split('\t');
    case 'comma':
      return line.split(',');
    case 'space':
      return line.split(/\s{2,}|\t/);
    default:
      return line.split(',');
  }
}

/**
 * 检测是否有表头行
 */
function detectHeader(firstLine: string[], delimiter: 'tab' | 'comma' | 'space', lines: string[]): boolean {
  if (firstLine.length < 4) return false;

  // 如果第一行的前几个字段中有非数字内容，可能是表头
  const col2 = parseFloat(firstLine[2]);
  const col3 = parseFloat(firstLine[3]);

  // PC1/PC2通常是数值
  if (isNaN(col2) || isNaN(col3)) return true;

  // 进一步检查：如果第二行也全是数字且第一行有很多文字特征
  const textFields = firstLine.slice(0, 4).filter(f => {
    const trimmed = f.trim();
    return trimmed.length > 0 && isNaN(parseFloat(trimmed)) && !/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed);
  });
  return textFields.length >= 2;
}

/**
 * 解析文件
 */
export async function parseFile(file: File, encoding?: string): Promise<ParseResult> {
  logger.info(MODULE, `开始解析文件: ${file.name}`, { size: file.size });

  // 编码检测
  const detected = encoding ? { encoding, confidence: 'high' as const } : await detectEncoding(file);
  logger.info(MODULE, `使用编码: ${detected.encoding}`, { confidence: detected.confidence });

  // 读取并解码文本
  let text: string;
  try {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder(detected.encoding.toLowerCase() === 'gbk' ? 'gbk' : 'utf-8');
    text = decoder.decode(buffer);
  } catch (err) {
    logger.error(MODULE, '文件解码失败', err);
    throw new Error(`无法解码文件，请检查编码设置: ${err}`);
  }

  // 分割行
  const allLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (allLines.length < 2) {
    throw new Error('文件至少需要包含表头和一行数据');
  }

  // 检测分隔符
  const delimiter = detectDelimiter(allLines);
  logger.debug(MODULE, '检测到分隔符', { delimiter });

  // 解析第一行
  const firstLine = splitLine(allLines[0], delimiter);
  const hasHeader = detectHeader(firstLine, delimiter, allLines);
  logger.debug(MODULE, '表头检测结果', { hasHeader, firstLinePreview: firstLine.slice(0, 4) });

  // 提取表头和数据行
  const headerLine = hasHeader ? allLines[0] : '';
  const dataLines = hasHeader ? allLines.slice(1) : allLines;
  const headers = hasHeader ? firstLine : [];

  // 解析数据行
  const rows: RawDataRow[] = [];
  const skippedRows: SkippedRowInfo[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const cols = splitLine(line, delimiter);
    const rowIndex = hasHeader ? i + 1 : i;

    if (cols.length < 4) {
      skippedRows.push({
        rowIndex,
        reason: 'insufficient_columns',
        linePreview: line.substring(0, 100),
      });
      continue;
    }

    const sampleName = cols[0].trim();
    const groupName = cols[1].trim() || '未分组';
    const pc1 = parseFloat(cols[2].trim());
    const pc2 = parseFloat(cols[3].trim());

    if (isNaN(pc1) || isNaN(pc2)) {
      skippedRows.push({
        rowIndex,
        reason: 'not_numeric',
        linePreview: line.substring(0, 100),
      });
      continue;
    }

    if (!sampleName) {
      skippedRows.push({
        rowIndex,
        reason: 'missing_value',
        linePreview: line.substring(0, 100),
      });
      continue;
    }

    rows.push({ sampleName, groupName, pc1, pc2, originalRowIndex: rowIndex });
  }

  logger.info(MODULE, '解析完成', {
    totalLines: allLines.length,
    parsedRows: rows.length,
    skippedRows: skippedRows.length,
    delimiter,
    hasHeader,
    encoding: detected.encoding,
  });

  if (skippedRows.length > 0) {
    logger.warn(MODULE, `跳过了 ${skippedRows.length} 行数据`, {
      reasons: skippedRows.reduce((acc, r) => {
        acc[r.reason] = (acc[r.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    });
  }

  return { rows, headers, skippedRows, delimiter, hasHeader, encoding: detected.encoding, encodingConfidence: detected.confidence };
}
