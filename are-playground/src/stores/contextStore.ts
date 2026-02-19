import { create } from 'zustand';

interface ContextState {
  contexts: Record<string, Record<string, unknown>>;
  setContext: (scenario: string, data: Record<string, unknown>) => void;
  clearContext: (scenario: string) => void;
}

export const useContextStore = create<ContextState>((set) => ({
  contexts: {},
  setContext: (scenario, data) =>
    set((s) => ({ contexts: { ...s.contexts, [scenario]: data } })),
  clearContext: (scenario) =>
    set((s) => {
      const next = { ...s.contexts };
      delete next[scenario];
      return { contexts: next };
    }),
}));
