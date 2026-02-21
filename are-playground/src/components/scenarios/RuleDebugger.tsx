import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useResultStore } from '../../stores/resultStore';
import { useScenarioStore } from '../../stores/scenarioStore';
import type { RuleTrace, ConditionTrace } from '../../engine/types';

interface RuleDebuggerProps {
  scenarioId: string;
  color: string;
}

function buildTraces(scenarioId: string): RuleTrace[] {
  const result = useResultStore.getState().results[scenarioId];
  const config = useScenarioStore.getState().configs[scenarioId];
  if (!result || !config) return [];

  const allRuleResults = [...result.firedRules, ...result.skippedRules];
  return allRuleResults.map((rr) => {
    const ruleConfig = config.rules.find((r) => r.id === rr.ruleId);
    const conditions: ConditionTrace[] = (ruleConfig?.conditions || []).map((condStr) => {
      const parts = condStr.split(' ');
      const field = parts[0];
      const operator = parts[1];
      const rawExpected = parts.slice(2).join(' ');
      let expected: unknown = rawExpected;
      if (rawExpected === 'true') expected = true;
      else if (rawExpected === 'false') expected = false;
      else if (!isNaN(Number(rawExpected)) && rawExpected !== '') expected = Number(rawExpected);
      const actual = result.contextSnapshot?.[field];
      const passed = !rr.failedConditions.includes(condStr);
      return { raw: condStr, field, operator, expected, actual, passed };
    });
    return {
      ruleId: rr.ruleId,
      ruleLabel: ruleConfig?.label || rr.ruleId,
      conditionsMet: rr.conditionsMet,
      conditions,
      executedActions: rr.executedActions,
    };
  });
}

function TraceView({ scenarioId, color }: { scenarioId: string; color: string }) {
  const { t } = useTranslation();
  const result = useResultStore((s) => s.results[scenarioId]);
  const traces = useMemo(() => buildTraces(scenarioId), [scenarioId, result]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (traces.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-surface-200/30">
        {t('debugger.noResults')}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
      {traces.map((trace, i) => {
        const isOpen = expanded[trace.ruleId] ?? false;
        return (
          <motion.div
            key={trace.ruleId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: trace.conditionsMet ? 'rgba(81,207,102,0.25)' : 'rgba(255,107,107,0.25)' }}
          >
            {/* Header */}
            <button
              onClick={() => toggle(trace.ruleId)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left cursor-pointer transition-colors"
              style={{ background: trace.conditionsMet ? 'rgba(81,207,102,0.05)' : 'rgba(255,107,107,0.05)' }}
            >
              {trace.conditionsMet ? (
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-error shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-white">{trace.ruleLabel}</span>
                <span className="text-[10px] text-surface-200/40 ml-2 font-mono">{trace.ruleId}</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-surface-200/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Detail */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-2.5 pt-1" style={{ borderTop: '1px solid var(--th-border)' }}>
                    {trace.conditions.length === 0 ? (
                      <div className="text-[10px] text-surface-200/40 italic">{t('debugger.noConditions')}</div>
                    ) : (
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="text-surface-200/50">
                            <th className="text-left font-medium py-0.5 pr-2">{t('debugger.field')}</th>
                            <th className="text-left font-medium py-0.5 pr-2">{t('debugger.operator')}</th>
                            <th className="text-left font-medium py-0.5 pr-2">{t('debugger.expected')}</th>
                            <th className="text-left font-medium py-0.5 pr-2">{t('debugger.actual')}</th>
                            <th className="text-right font-medium py-0.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {trace.conditions.map((cond, ci) => (
                            <tr key={ci}>
                              <td className="py-0.5 pr-2 font-mono text-white">{cond.field}</td>
                              <td className="py-0.5 pr-2 font-mono" style={{ color }}>{cond.operator}</td>
                              <td className="py-0.5 pr-2 font-mono text-accent-400">{String(cond.expected)}</td>
                              <td className="py-0.5 pr-2 font-mono text-primary-300">{cond.actual !== undefined ? String(cond.actual) : '—'}</td>
                              <td className="py-0.5 text-right">
                                {cond.passed ? (
                                  <span className="text-success font-bold">{t('debugger.passed')}</span>
                                ) : (
                                  <span className="text-error font-bold">{t('debugger.failed')}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {trace.executedActions.length > 0 && (
                      <div className="mt-1.5 text-[10px] text-surface-200/50">
                        {t('debugger.executedActions')}: <span className="font-mono text-success">{trace.executedActions.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export function RuleDebugger({ scenarioId, color }: RuleDebuggerProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'summary' | 'trace'>('summary');
  const result = useResultStore((s) => s.results[scenarioId]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <BarChart3 className="h-4 w-4" style={{ color }} />
          {t('debugger.title')}
        </h3>
        <div className="flex rounded-lg overflow-hidden" style={{ background: 'var(--th-btn-ghost-bg)' }}>
          {(['summary', 'trace'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-2.5 py-1 text-[10px] font-medium cursor-pointer transition-colors"
              style={{
                background: mode === m ? color + '25' : 'transparent',
                color: mode === m ? color : 'var(--th-text-muted)',
              }}
            >
              {t(`debugger.${m}`)}
            </button>
          ))}
        </div>
      </div>

      {mode === 'summary' ? (
        <>
          {!result ? (
            <div className="flex h-24 items-center justify-center text-xs text-surface-200/30">
              {t('panels.noResults')}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <Badge color="rgba(81,207,102,0.2)">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span className="text-success">{t('panels.firedRules')}: {result.firedRules.length}</span>
                </Badge>
                <Badge color="rgba(255,107,107,0.2)">
                  <XCircle className="h-3 w-3 text-error" />
                  <span className="text-error">{t('panels.skippedRules')}: {result.skippedRules.length}</span>
                </Badge>
                <Badge color="rgba(92,124,250,0.2)">
                  <Clock className="h-3 w-3 text-primary-300" />
                  <span className="text-primary-300">{t('panels.duration', { ms: result.duration })}</span>
                </Badge>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {result.firedRules.map((r, i) => (
                  <motion.div
                    key={r.ruleId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-md border border-success/20 bg-success/5 px-2.5 py-1.5"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-success shrink-0" />
                      <span className="font-medium text-success">{r.ruleId}</span>
                    </div>
                    {r.executedActions.length > 0 && (
                      <div className="mt-1 text-[10px] text-surface-200/50 pl-5">
                        {t('panels.triggeredActions')}: {r.executedActions.join(', ')}
                      </div>
                    )}
                  </motion.div>
                ))}
                {result.skippedRules.map((r, i) => (
                  <motion.div
                    key={r.ruleId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (result.firedRules.length + i) * 0.05 }}
                    className="rounded-md border border-error/20 bg-error/5 px-2.5 py-1.5"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <XCircle className="h-3 w-3 text-error shrink-0" />
                      <span className="font-medium text-error">{r.ruleId}</span>
                    </div>
                    {r.failedConditions.length > 0 && (
                      <div className="mt-1 text-[10px] text-surface-200/50 pl-5">
                        {t('panels.conditions')}: {r.failedConditions.join(', ')}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <TraceView scenarioId={scenarioId} color={color} />
      )}
    </Card>
  );
}
