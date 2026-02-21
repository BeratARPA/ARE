import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreContext } from 'are-engine-core';
import { motion } from 'framer-motion';
import { RotateCcw, Share2 } from 'lucide-react';
import type { ScenarioConfig } from '../../engine/types';
import { createScenarioEngine, fireScenarioEvent } from '../../engine/createEngine';
import { useScenarioStore } from '../../stores/scenarioStore';
import { usePreviewStore } from '../../stores/previewStore';
import { EventFirePanel } from './EventFirePanel';
import { RuleManager } from './RuleManager';
import { ActionRegistry } from './ActionRegistry';
import { LiveLog } from './LiveLog';
import { ContextViewer } from './ContextViewer';
import { RuleFlowDiagram } from './RuleFlowDiagram';
import { RuleDebugger } from './RuleDebugger';
import { RelationshipGraph } from './RelationshipGraph';
import { ScenarioPreview } from '../preview/ScenarioPreview';
import { ConfirmDialog } from '../modals/ConfirmDialog';

interface ScenarioViewProps {
  config: ScenarioConfig;
}

export function ScenarioView({ config }: ScenarioViewProps) {
  const { t } = useTranslation();
  const scenarioKey = `scenarios.${config.id}` as const;

  // Live config from store (mutable)
  const liveConfig = useScenarioStore((s) => s.configs[config.id]);
  const version = useScenarioStore((s) => s.versions[config.id]);
  const resetScenario = useScenarioStore((s) => s.resetScenario);

  const [showReset, setShowReset] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const r of liveConfig.rules) map[r.id] = true;
    return map;
  });

  const { engine, context } = useMemo(() => {
    const eng = createScenarioEngine(liveConfig);
    const ctx = new AreContext();
    // Rebuild enabledRules for new config
    const map: Record<string, boolean> = {};
    for (const r of liveConfig.rules) map[r.id] = true;
    setEnabledRules(map);
    return { engine: eng, context: ctx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const handleToggleRule = useCallback(
    (ruleId: string, enabled: boolean) => {
      setEnabledRules((prev) => ({ ...prev, [ruleId]: enabled }));
      if (enabled) engine.enableRule(ruleId);
      else engine.disableRule(ruleId);
    },
    [engine]
  );

  const handleFire = useCallback(
    async (eventType: string, data: Record<string, unknown>) => {
      const result = await fireScenarioEvent(engine, config.id, eventType, data, context);
      const firedRuleIds = result.firedRules.map((r) => r.ruleId);
      usePreviewStore.getState().handleResult(config.id, eventType, data, firedRuleIds);
    },
    [engine, config.id, context]
  );

  const handleReset = () => {
    resetScenario(config.id);
    setShowReset(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-7xl px-4 py-6"
    >
      {/* Scenario Header */}
      <div className="mb-6 flex items-start justify-between" data-tour="scenario-header">
        <div>
          <h2 className="text-xl font-bold text-white">{t(`${scenarioKey}.title`)}</h2>
          <p className="text-sm text-surface-200/60 mt-1">{t(`${scenarioKey}.description`)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGraph(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-surface-200/50 hover:text-surface-200 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            {t('graph.openGraph')}
          </button>
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-surface-200/50 hover:text-surface-200 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('crud.reset')}
          </button>
        </div>
      </div>

      {/* Visual Preview */}
      <div className="mb-4">
        <ScenarioPreview scenarioId={config.id} color={config.color} />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div data-tour="event-fire-panel">
            <EventFirePanel config={liveConfig} onFire={handleFire} />
          </div>
          <div data-tour="rule-manager">
            <RuleManager config={liveConfig} enabledRules={enabledRules} onToggleRule={handleToggleRule} />
          </div>
          <div data-tour="action-registry">
            <ActionRegistry config={liveConfig} />
          </div>
        </div>
        <div className="space-y-4">
          <div data-tour="live-log">
            <LiveLog scenarioId={config.id} color={config.color} />
          </div>
          <div data-tour="context-viewer">
            <ContextViewer scenarioId={config.id} color={config.color} />
          </div>
        </div>
        <div className="space-y-4">
          <RuleFlowDiagram scenarioId={config.id} color={config.color} />
          <div data-tour="rule-debugger">
            <RuleDebugger scenarioId={config.id} color={config.color} />
          </div>
        </div>
      </div>

      <RelationshipGraph isOpen={showGraph} onClose={() => setShowGraph(false)} config={liveConfig} />

      <ConfirmDialog
        isOpen={showReset}
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
        title={t('crud.reset')}
        message={t('crud.resetConfirm')}
      />
    </motion.div>
  );
}
