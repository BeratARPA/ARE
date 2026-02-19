import { useTranslation } from 'react-i18next';
import { BarChart3, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useResultStore } from '../../stores/resultStore';

interface ResultInspectorProps {
  scenarioId: string;
  color: string;
}

export function ResultInspector({ scenarioId, color }: ResultInspectorProps) {
  const { t } = useTranslation();
  const result = useResultStore((s) => s.results[scenarioId]);

  return (
    <Card>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
        <BarChart3 className="h-4 w-4" style={{ color }} />
        {t('panels.results')}
      </h3>

      {!result ? (
        <div className="flex h-32 items-center justify-center text-xs text-surface-200/30">
          {t('panels.noResults')}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
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

          {/* Fired Rules */}
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
    </Card>
  );
}
