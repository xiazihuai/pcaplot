// 撤销/重做 命令模式类型

export interface Command {
  id: string;
  timestamp: number;
  description: string;
  undo: () => void;
  execute: () => void;
  estimatedSize: number;
}
