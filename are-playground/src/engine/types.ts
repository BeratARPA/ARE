export interface ScenarioEvent {
  type: string;
  label: string;
  description: string;
  defaultData: Record<string, unknown>;
}

export interface ScenarioAction {
  type: string;
  label: string;
  description: string;
}

export interface ScenarioRuleConfig {
  id: string;
  label: string;
  description: string;
  group: string;
  priority: number;
  events: string[];
  matchMode: string;
  conditions: string[];
  actions: string[];
}

export interface ScenarioConfig {
  id: string;
  icon: string;
  color: string;
  events: ScenarioEvent[];
  actions: ScenarioAction[];
  rules: ScenarioRuleConfig[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  scenario: string;
}

export interface RuleResultEntry {
  ruleId: string;
  conditionsMet: boolean;
  executedActions: string[];
  failedConditions: string[];
}

export interface FireResult {
  event: string;
  firedRules: RuleResultEntry[];
  skippedRules: RuleResultEntry[];
  pipelineStopped: boolean;
  duration: number;
  timestamp: number;
  contextSnapshot: Record<string, unknown>;
}

export interface PipelineStep {
  id: string;
  labelKey: string;
  status: 'pending' | 'active' | 'passed' | 'failed' | 'skipped';
  details?: string;
  children?: { ruleId: string; status: 'passed' | 'failed'; label: string }[];
}

export interface ConditionTrace {
  raw: string;
  field: string;
  operator: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
}

export interface RuleTrace {
  ruleId: string;
  ruleLabel: string;
  conditionsMet: boolean;
  conditions: ConditionTrace[];
  executedActions: string[];
}
