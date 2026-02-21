import {
  AreEngine,
  AreContext,
  Rule,
  MatchMode,
  type ActionSettings,
  type GameEvent,
  type CompareOp,
  type RuleResult,
} from 'are-engine-core';
import type { ScenarioConfig } from './types';
import { useLogStore, createLogEntry } from '../stores/logStore';
import { useContextStore } from '../stores/contextStore';
import { useResultStore } from '../stores/resultStore';
import type { FireResult } from './types';

export function createScenarioEngine(config: ScenarioConfig) {
  const engine = new AreEngine();

  // Register actions — each just logs what it does (visual demo)
  for (const action of config.actions) {
    engine.registerAction(action.type, async (_ctx: AreContext, settings: ActionSettings) => {
      const details = settings.all();
      const detailStr = Object.keys(details).length > 0 ? ` ${JSON.stringify(details)}` : '';
      useLogStore.getState().addLog(
        createLogEntry(`[Action] ${action.label}${detailStr}`, config.id)
      );
    });
  }

  // Register rules from config
  for (const rc of config.rules) {
    let rule = Rule.create(rc.id)
      .inGroup(rc.group)
      .withPriority(rc.priority);

    // Set events
    for (const evt of rc.events) {
      rule = rule.on(evt);
    }

    // Match mode
    const modeMap: Record<string, MatchMode> = {
      All: MatchMode.All,
      Any: MatchMode.Any,
      None: MatchMode.None,
      ExactlyOne: MatchMode.ExactlyOne,
    };
    rule = rule.withMatchMode(modeMap[rc.matchMode] || MatchMode.All);

    // Conditions from config strings like "field op value"
    for (const cond of rc.conditions) {
      const parts = cond.split(' ');
      if (parts.length >= 3) {
        const field = parts[0];
        const op = parts[1] as CompareOp;
        const rawValue = parts.slice(2).join(' ');
        let value: unknown = rawValue;
        if (rawValue === 'true') value = true;
        else if (rawValue === 'false') value = false;
        else if (!isNaN(Number(rawValue))) value = Number(rawValue);
        else if (rawValue.startsWith('"') && rawValue.endsWith('"')) value = rawValue.slice(1, -1);
        rule = rule.whenField(field, op, value);
      }
    }

    // Actions
    for (const act of rc.actions) {
      rule = rule.then(act);
    }

    engine.addRule(rule);
  }

  // Hook up logging
  engine.onLog = (msg: string) => {
    useLogStore.getState().addLog(createLogEntry(msg, config.id));
  };

  return engine;
}

export async function fireScenarioEvent(
  engine: AreEngine,
  scenarioId: string,
  eventType: string,
  data: Record<string, unknown>,
  context: AreContext
) {
  // Set data on context for the event
  for (const [k, v] of Object.entries(data)) {
    context.set(k, v);
  }

  const result = await engine.fire(eventType, (evt: GameEvent) => {
    for (const [k, v] of Object.entries(data)) {
      evt.data[k] = v;
    }
  }, context);

  // Snapshot context — iterate known keys from data
  const contextData: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    const val = context.get(key);
    if (val !== undefined) contextData[key] = val;
  }
  useContextStore.getState().setContext(scenarioId, contextData);

  // Store result
  const fireResult: FireResult = {
    event: eventType,
    firedRules: result.firedRules.map((r: RuleResult) => ({
      ruleId: r.ruleId,
      conditionsMet: r.conditionsMet,
      executedActions: r.executedActions,
      failedConditions: r.failedConditions,
    })),
    skippedRules: result.skippedRules.map((r: RuleResult) => ({
      ruleId: r.ruleId,
      conditionsMet: r.conditionsMet,
      executedActions: r.executedActions,
      failedConditions: r.failedConditions,
    })),
    pipelineStopped: result.pipelineStopped,
    duration: result.duration,
    timestamp: Date.now(),
    contextSnapshot: { ...contextData },
  };
  useResultStore.getState().setResult(scenarioId, fireResult);

  // Build flow pipeline steps
  const { useFlowStore } = await import('../stores/flowStore');
  useFlowStore.getState().buildSteps(scenarioId, fireResult);

  return fireResult;
}
