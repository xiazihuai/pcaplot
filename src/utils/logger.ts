// 分级日志系统 — 开发/生产模式自适应，内存环形缓冲

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

export interface LogEntry {
  timestamp: number;
  isoTime: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  stack?: string;
}

class LoggerImpl {
  private buffer: LogEntry[] = [];
  private maxSize: number;
  private currentLevel: number;

  constructor() {
    const isDev = import.meta.env.DEV;
    this.maxSize = isDev ? 1000 : 500;
    this.currentLevel = isDev ? LOG_LEVEL_VALUES.DEBUG : LOG_LEVEL_VALUES.WARN;
    // 允许通过 URL 参数开启调试日志
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'true') {
        this.currentLevel = LOG_LEVEL_VALUES.DEBUG;
      }
      (window as unknown as Record<string, unknown>).__PCAplotDebug__ = false;
    }
  }

  private log(level: LogLevel, module: string, message: string, errorOrData?: unknown, data?: unknown): void {
    const levelValue = LOG_LEVEL_VALUES[level];
    if (levelValue < this.currentLevel) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      isoTime: new Date().toISOString(),
      level,
      module,
      message,
    };

    let extraData: unknown = data;
    if (errorOrData instanceof Error) {
      entry.stack = errorOrData.stack;
      extraData = data;
    } else if (errorOrData !== undefined) {
      extraData = errorOrData;
    }
    if (extraData !== undefined) {
      try {
        entry.data = JSON.parse(JSON.stringify(extraData));
      } catch {
        entry.data = String(extraData);
      }
    }

    // 环形缓冲
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(entry);

    // 开发模式控制台输出
    if (import.meta.env.DEV) {
      const prefix = `[${entry.isoTime}] [${level}] [${module}]`;
      const style = this.getConsoleStyle(level);
      switch (level) {
        case 'DEBUG':
          console.debug(`%c${prefix}`, style, message, extraData ?? '');
          break;
        case 'INFO':
          console.info(`%c${prefix}`, style, message, extraData ?? '');
          break;
        case 'WARN':
          console.warn(`%c${prefix}`, style, message, extraData ?? '');
          break;
        case 'ERROR':
        case 'FATAL':
          console.error(`%c${prefix}`, style, message, extraData ?? '');
          break;
      }
    } else if (levelValue >= LOG_LEVEL_VALUES.ERROR) {
      console.error(`[${level}] [${module}]`, message, extraData ?? '');
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case 'DEBUG': return 'color: #888';
      case 'INFO': return 'color: #2e7d32';
      case 'WARN': return 'color: #f57c00; font-weight: bold';
      case 'ERROR': return 'color: #d32f2f; font-weight: bold';
      case 'FATAL': return 'color: #fff; background: #b71c1c; font-weight: bold';
      default: return '';
    }
  }

  debug(module: string, message: string, data?: unknown): void {
    this.log('DEBUG', module, message, data);
  }

  info(module: string, message: string, data?: unknown): void {
    this.log('INFO', module, message, data);
  }

  warn(module: string, message: string, data?: unknown): void {
    this.log('WARN', module, message, data);
  }

  error(module: string, message: string, errorOrData?: unknown, data?: unknown): void {
    this.log('ERROR', module, message, errorOrData, data);
  }

  fatal(module: string, message: string, errorOrData?: unknown, data?: unknown): void {
    this.log('FATAL', module, message, errorOrData, data);
  }

  getRecentLogs(count = 50): LogEntry[] {
    return this.buffer.slice(-count);
  }

  exportLogs(): string {
    const header = `PCAplot Log Export — ${new Date().toISOString()}\n` +
      `Version: 0.1.0\n` +
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}\n` +
      `${'='.repeat(60)}\n\n`;
    const body = this.buffer.map(e => {
      let line = `[${e.isoTime}] [${e.level}] [${e.module}] ${e.message}`;
      if (e.data) line += ` | ${JSON.stringify(e.data)}`;
      if (e.stack) line += `\n${e.stack}`;
      return line;
    }).join('\n');
    return header + body;
  }

  downloadLogs(): void {
    const text = this.exportLogs();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcaplot_logs_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = LOG_LEVEL_VALUES[level];
  }

  clearBuffer(): void {
    this.buffer = [];
  }

  get size(): number {
    return this.buffer.length;
  }
}

// 全局单例
export const logger = new LoggerImpl();

// 方便在控制台调试
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__pcaplotLogger = logger;
}
