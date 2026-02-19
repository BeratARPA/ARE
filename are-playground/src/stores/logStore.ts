import { create } from 'zustand';
import type { LogEntry } from '../engine/types';

interface LogState {
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  clearLogs: (scenario?: string) => void;
}

let logCounter = 0;

export function createLogEntry(message: string, scenario: string): LogEntry {
  let type: LogEntry['type'] = 'info';
  if (message.includes('conditions not met') || message.includes('skipped')) type = 'warning';
  else if (message.includes('error') || message.includes('Error')) type = 'error';
  else if (message.includes('Executing action') || message.includes('completed')) type = 'success';

  return {
    id: `log-${++logCounter}`,
    timestamp: Date.now(),
    message,
    type,
    scenario,
  };
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  addLog: (entry) => set((s) => ({ logs: [...s.logs.slice(-200), entry] })),
  clearLogs: (scenario) =>
    set((s) => ({
      logs: scenario ? s.logs.filter((l) => l.scenario !== scenario) : [],
    })),
}));
