import { create } from 'zustand';
import type { ScenarioConfig, ScenarioEvent, ScenarioRuleConfig, ScenarioAction } from '../engine/types';
import { rpgGameConfig } from '../engine/scenarios/rpgGame';
import { smartHomeConfig } from '../engine/scenarios/smartHome';
import { ecommerceConfig } from '../engine/scenarios/ecommerce';

const defaults: Record<string, ScenarioConfig> = {
  rpgGame: rpgGameConfig,
  smartHome: smartHomeConfig,
  ecommerce: ecommerceConfig,
};

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

interface ScenarioState {
  configs: Record<string, ScenarioConfig>;
  versions: Record<string, number>;

  addEvent: (scenarioId: string, event: ScenarioEvent) => void;
  updateEvent: (scenarioId: string, oldType: string, event: ScenarioEvent) => void;
  deleteEvent: (scenarioId: string, eventType: string) => void;

  addRule: (scenarioId: string, rule: ScenarioRuleConfig) => void;
  updateRule: (scenarioId: string, oldId: string, rule: ScenarioRuleConfig) => void;
  deleteRule: (scenarioId: string, ruleId: string) => void;

  addAction: (scenarioId: string, action: ScenarioAction) => void;
  updateAction: (scenarioId: string, oldType: string, action: ScenarioAction) => void;
  deleteAction: (scenarioId: string, actionType: string) => void;

  resetScenario: (scenarioId: string) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  configs: {
    rpgGame: clone(rpgGameConfig),
    smartHome: clone(smartHomeConfig),
    ecommerce: clone(ecommerceConfig),
  },
  versions: { rpgGame: 0, smartHome: 0, ecommerce: 0 },

  addEvent: (sid, event) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      cfg.events.push(event);
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  updateEvent: (sid, oldType, event) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      const idx = cfg.events.findIndex((e: ScenarioEvent) => e.type === oldType);
      if (idx !== -1) cfg.events[idx] = event;
      // Update rules that reference the old event type
      if (oldType !== event.type) {
        for (const rule of cfg.rules) {
          const ri = rule.events.indexOf(oldType);
          if (ri !== -1) rule.events[ri] = event.type;
        }
      }
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  deleteEvent: (sid, eventType) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      cfg.events = cfg.events.filter((e: ScenarioEvent) => e.type !== eventType);
      // Clean up rules referencing this event
      for (const rule of cfg.rules) {
        rule.events = rule.events.filter((e: string) => e !== eventType);
      }
      // Remove rules with no events left
      cfg.rules = cfg.rules.filter((r: ScenarioRuleConfig) => r.events.length > 0);
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  addRule: (sid, rule) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      cfg.rules.push(rule);
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  updateRule: (sid, oldId, rule) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      const idx = cfg.rules.findIndex((r: ScenarioRuleConfig) => r.id === oldId);
      if (idx !== -1) cfg.rules[idx] = rule;
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  deleteRule: (sid, ruleId) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      cfg.rules = cfg.rules.filter((r: ScenarioRuleConfig) => r.id !== ruleId);
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  addAction: (sid, action) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      cfg.actions.push(action);
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  updateAction: (sid, oldType, action) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      const idx = cfg.actions.findIndex((a: ScenarioAction) => a.type === oldType);
      if (idx !== -1) cfg.actions[idx] = action;
      // Update rules that reference the old action type
      if (oldType !== action.type) {
        for (const rule of cfg.rules) {
          const ri = rule.actions.indexOf(oldType);
          if (ri !== -1) rule.actions[ri] = action.type;
        }
      }
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  deleteAction: (sid, actionType) =>
    set((s) => {
      const cfg = clone(s.configs[sid]);
      cfg.actions = cfg.actions.filter((a: ScenarioAction) => a.type !== actionType);
      // Clean up rules referencing this action
      for (const rule of cfg.rules) {
        rule.actions = rule.actions.filter((a: string) => a !== actionType);
      }
      return {
        configs: { ...s.configs, [sid]: cfg },
        versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
      };
    }),

  resetScenario: (sid) =>
    set((s) => ({
      configs: { ...s.configs, [sid]: clone(defaults[sid]) },
      versions: { ...s.versions, [sid]: s.versions[sid] + 1 },
    })),
}));
