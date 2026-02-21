import { useTranslation } from 'react-i18next';
import { Workflow, Zap, Shield, Filter, GitBranch, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { useFlowStore } from '../../stores/flowStore';

interface RuleFlowDiagramProps {
  scenarioId: string;
  color: string;
}

const stepIcons = [Zap, Shield, Filter, GitBranch, Play];

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: 'var(--th-btn-ghost-bg)', border: 'var(--th-border)', text: 'var(--th-text-muted)' },
  active: { bg: 'rgba(92,124,250,0.15)', border: 'rgba(92,124,250,0.4)', text: '#748ffc' },
  passed: { bg: 'rgba(81,207,102,0.12)', border: 'rgba(81,207,102,0.35)', text: '#51cf66' },
  failed: { bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.35)', text: '#ff6b6b' },
  skipped: { bg: 'var(--th-btn-ghost-bg)', border: 'var(--th-border)', text: 'var(--th-text-muted)' },
};

export function RuleFlowDiagram({ scenarioId, color }: RuleFlowDiagramProps) {
  const { t } = useTranslation();
  const steps = useFlowStore((s) => s.steps[scenarioId]);

  return (
    <Card>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
        <Workflow className="h-4 w-4" style={{ color }} />
        {t('flow.title')}
      </h3>

      {!steps ? (
        <div className="flex h-20 items-center justify-center text-xs text-surface-200/30">
          {t('flow.noFlow')}
        </div>
      ) : (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          <AnimatePresence mode="wait">
            {steps.map((step, idx) => {
              const Icon = stepIcons[idx];
              const sc = statusColors[step.status];
              return (
                <motion.div key={step.id} className="flex items-center gap-1 shrink-0">
                  {idx > 0 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: idx * 0.15, duration: 0.2 }}
                      className="w-4 h-0.5 origin-left"
                      style={{
                        background: step.status === 'pending' ? 'var(--th-border)' : sc.border,
                      }}
                    />
                  )}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.15 + 0.1, duration: 0.3, type: 'spring', stiffness: 300 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="flex items-center justify-center h-9 w-9 rounded-lg border transition-colors"
                      style={{ background: sc.bg, borderColor: sc.border }}
                    >
                      <Icon className="h-4 w-4" style={{ color: sc.text }} />
                    </div>
                    <span className="text-[9px] font-medium text-center leading-tight max-w-[60px]" style={{ color: sc.text }}>
                      {t(step.labelKey)}
                    </span>
                    {step.details && (
                      <span className="text-[8px] font-mono" style={{ color: 'var(--th-text-muted)' }}>
                        {step.details}
                      </span>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Sub-step rule breakdown */}
      {steps && steps[2]?.children && steps[2].children.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {steps[2].children.map((child) => (
            <span
              key={child.ruleId}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-mono border"
              style={{
                background: child.status === 'passed' ? 'rgba(81,207,102,0.08)' : 'rgba(255,107,107,0.08)',
                borderColor: child.status === 'passed' ? 'rgba(81,207,102,0.25)' : 'rgba(255,107,107,0.25)',
                color: child.status === 'passed' ? '#51cf66' : '#ff6b6b',
              }}
            >
              {child.status === 'passed' ? '✓' : '✗'} {child.label}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
