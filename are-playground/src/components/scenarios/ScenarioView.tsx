import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreContext } from 'are-engine-core';
import { motion } from 'framer-motion';
import type { ScenarioConfig } from '../../engine/types';
import { createScenarioEngine, fireScenarioEvent } from '../../engine/createEngine';
import { EventFirePanel } from './EventFirePanel';
import { RuleManager } from './RuleManager';
import { ActionRegistry } from './ActionRegistry';
import { LiveLog } from './LiveLog';
import { ContextViewer } from './ContextViewer';
import { ResultInspector } from './ResultInspector';

interface ScenarioViewProps {
  config: ScenarioConfig;
}

export function ScenarioView({ config }: ScenarioViewProps) {
  const { t } = useTranslation();
  const scenarioKey = `scenarios.${config.id}` as const;

  const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const r of config.rules) map[r.id] = true;
    return map;
  });

  const { engine, context } = useMemo(() => {
    const eng = createScenarioEngine(config);
    const ctx = new AreContext();
    return { engine: eng, context: ctx };
  }, [config]);

  // Sync enabled state to engine rules
  const handleToggleRule = useCallback(
    (ruleId: string, enabled: boolean) => {
      setEnabledRules((prev) => ({ ...prev, [ruleId]: enabled }));
      if (enabled) engine.enableRule(ruleId);
      else engine.disableRule(ruleId);
    },
    [engine]
  );

  const handleFire = useCallback(
    (eventType: string, data: Record<string, unknown>) => {
      fireScenarioEvent(engine, config.id, eventType, data, context);
    },
    [engine, config.id, context]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-7xl px-4 py-6"
    >
      {/* Scenario Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">{t(`${scenarioKey}.title`)}</h2>
        <p className="text-sm text-surface-200/60 mt-1">{t(`${scenarioKey}.description`)}</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Fire + Rules + Actions */}
        <div className="space-y-4">
          <EventFirePanel config={config} onFire={handleFire} />
          <RuleManager config={config} enabledRules={enabledRules} onToggleRule={handleToggleRule} />
          <ActionRegistry config={config} />
        </div>

        {/* Middle Column: Log + Context */}
        <div className="space-y-4">
          <LiveLog scenarioId={config.id} color={config.color} />
          <ContextViewer scenarioId={config.id} color={config.color} />
        </div>

        {/* Right Column: Results */}
        <div className="space-y-4">
          <ResultInspector scenarioId={config.id} color={config.color} />
        </div>
      </div>
    </motion.div>
  );
}
