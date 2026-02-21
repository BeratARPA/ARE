import { create } from 'zustand';
import type { PipelineStep, FireResult } from '../engine/types';

interface FlowState {
  steps: Record<string, PipelineStep[]>;
  buildSteps: (scenarioId: string, result: FireResult) => void;
  clearFlow: (scenarioId: string) => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  steps: {},
  buildSteps: (scenarioId, result) => {
    const allActions = result.firedRules.flatMap((r) => r.executedActions);
    const steps: PipelineStep[] = [
      {
        id: 'event',
        labelKey: 'flow.eventReceived',
        status: 'passed',
        details: result.event,
      },
      {
        id: 'middleware',
        labelKey: 'flow.middleware',
        status: result.pipelineStopped ? 'failed' : 'passed',
      },
      {
        id: 'conditions',
        labelKey: 'flow.conditionEval',
        status: result.firedRules.length > 0 || result.skippedRules.length > 0 ? 'passed' : 'skipped',
        children: [
          ...result.firedRules.map((r) => ({ ruleId: r.ruleId, status: 'passed' as const, label: r.ruleId })),
          ...result.skippedRules.map((r) => ({ ruleId: r.ruleId, status: 'failed' as const, label: r.ruleId })),
        ],
      },
      {
        id: 'matching',
        labelKey: 'flow.ruleMatching',
        status: result.firedRules.length > 0 ? 'passed' : result.skippedRules.length > 0 ? 'failed' : 'skipped',
        details: `${result.firedRules.length}/${result.firedRules.length + result.skippedRules.length}`,
      },
      {
        id: 'actions',
        labelKey: 'flow.actionExecution',
        status: allActions.length > 0 ? 'passed' : 'skipped',
        details: allActions.length > 0 ? `${allActions.length} executed` : undefined,
      },
    ];
    set((s) => ({ steps: { ...s.steps, [scenarioId]: steps } }));
  },
  clearFlow: (scenarioId) => {
    set((s) => {
      const next = { ...s.steps };
      delete next[scenarioId];
      return { steps: next };
    });
  },
}));
