// 撤销/重做 Zustand 中间件 — 命令模式
import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import type { Command } from '../types/command';
import { logger } from '../utils/logger';
import { MAX_UNDO_STACK } from '../constants/defaults';

const MODULE = 'undoRedo';

let cmdCounter = 0;

export interface UndoRedoSlice {
  undoStack: Command[];
  redoStack: Command[];
  canUndo: boolean;
  canRedo: boolean;
  lastActionDescription: string | null;
  _pushCommand: (cmd: Omit<Command, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

interface UndoRedoState {
  undoStack: Command[];
  redoStack: Command[];
}

export function createUndoRedoSlice(): UndoRedoSlice {
  const state: UndoRedoState = {
    undoStack: [],
    redoStack: [],
  };

  return {
    get undoStack() { return state.undoStack; },
    get redoStack() { return state.redoStack; },
    get canUndo() { return state.undoStack.length > 0; },
    get canRedo() { return state.redoStack.length > 0; },
    lastActionDescription: null,

    _pushCommand(cmd: Omit<Command, 'id' | 'timestamp'>) {
      const fullCmd: Command = {
        ...cmd,
        id: `cmd_${++cmdCounter}_${Date.now()}`,
        timestamp: Date.now(),
      };

      state.undoStack.push(fullCmd);
      state.redoStack = [];

      // 超过最大深度时淘汰最旧命令
      if (state.undoStack.length > MAX_UNDO_STACK) {
        const removed = state.undoStack.shift();
        logger.debug(MODULE, '撤销栈达到上限，淘汰最旧命令', { removedId: removed?.id });
      }

      logger.debug(MODULE, '命令入栈', {
        commandId: fullCmd.id,
        description: fullCmd.description,
        undoStackDepth: state.undoStack.length,
      });
    },

    undo() {
      const cmd = state.undoStack.pop();
      if (!cmd) {
        logger.debug(MODULE, '撤销栈为空，无法撤销');
        return;
      }
      cmd.undo();
      state.redoStack.push(cmd);
      logger.debug(MODULE, '撤销', { commandId: cmd.id, description: cmd.description });
    },

    redo() {
      const cmd = state.redoStack.pop();
      if (!cmd) {
        logger.debug(MODULE, '重做栈为空，无法重做');
        return;
      }
      cmd.execute();
      state.undoStack.push(cmd);
      logger.debug(MODULE, '重做', { commandId: cmd.id, description: cmd.description });
    },

    clearHistory() {
      state.undoStack = [];
      state.redoStack = [];
      logger.debug(MODULE, '撤销/重做历史已清除');
    },
  };
}

/**
 * 辅助函数：创建一个快照命令
 * @param description 命令描述
 * @param applyChange 应用变更的逻辑
 * @param reverseChange 撤销变更的逻辑
 */
export function createSnapshotCommand(
  description: string,
  applyChange: () => void,
  reverseChange: () => void,
  estimatedSize = 1024,
): Command {
  return {
    id: `cmd_${++cmdCounter}_${Date.now()}`,
    timestamp: Date.now(),
    description,
    execute: applyChange,
    undo: reverseChange,
    estimatedSize,
  };
}
