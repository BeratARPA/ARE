import { create } from 'zustand';
import type { FireResult } from '../engine/types';

interface ResultState {
  results: Record<string, FireResult | null>;
  setResult: (scenario: string, result: FireResult) => void;
  clearResult: (scenario: string) => void;
}

export const useResultStore = create<ResultState>((set) => ({
  results: {},
  setResult: (scenario, result) =>
    set((s) => ({ results: { ...s.results, [scenario]: result } })),
  clearResult: (scenario) =>
    set((s) => ({ results: { ...s.results, [scenario]: null } })),
}));
