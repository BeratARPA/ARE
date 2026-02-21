import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { RuleModal } from '../modals/RuleModal';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { useScenarioStore } from '../../stores/scenarioStore';
import type { ScenarioConfig, ScenarioRuleConfig } from '../../engine/types';

interface RuleManagerProps {
  config: ScenarioConfig;
  enabledRules: Record<string, boolean>;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
}

export function RuleManager({ config, enabledRules, onToggleRule }: RuleManagerProps) {
  const { t } = useTranslation();
  const [ruleModal, setRuleModal] = useState<{ open: boolean; editing?: ScenarioRuleConfig }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteConfirm) {
      useScenarioStore.getState().deleteRule(config.id, deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <Card>
      <h3 className="flex items-center justify-between text-sm font-semibold text-white mb-3">
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: config.color }} />
          {t('panels.rules')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-normal text-surface-200/50">
            {t('panels.rulesCount', { count: config.rules.length })}
          </span>
          <button onClick={() => setRuleModal({ open: true })} className="text-primary-400 hover:text-primary-300 cursor-pointer">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </h3>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        <AnimatePresence>
          {config.rules.map((rule) => {
            const enabled = enabledRules[rule.id] !== false;
            return (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: enabled ? 1 : 0.5, x: 0 }}
                className={`rounded-lg border p-3 transition-colors ${enabled ? 'border-white/8 bg-white/3' : 'border-white/3 bg-white/1'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{rule.label}</div>
                    <div className="text-[10px] text-surface-200/50 mt-0.5">{rule.description}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setRuleModal({ open: true, editing: rule })} className="text-surface-200/30 hover:text-primary-300 cursor-pointer">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => setDeleteConfirm(rule.id)} className="text-surface-200/30 hover:text-error cursor-pointer">
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <Toggle checked={enabled} onChange={(v) => onToggleRule(rule.id, v)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge color="rgba(92,124,250,0.15)"><span className="text-primary-300">{t('panels.priority')}: {rule.priority}</span></Badge>
                  <Badge color="rgba(81,207,102,0.15)"><span className="text-success">{t('panels.group')}: {rule.group}</span></Badge>
                  <Badge color="rgba(255,169,77,0.15)"><span className="text-accent-400">{t('panels.matchMode')}: {rule.matchMode}</span></Badge>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <RuleModal key={ruleModal.editing?.id ?? '__new__'} isOpen={ruleModal.open} onClose={() => setRuleModal({ open: false })} scenarioId={config.id} initialRule={ruleModal.editing} />
      <ConfirmDialog isOpen={!!deleteConfirm} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} title={t('crud.delete')} message={t('crud.confirmDelete', { name: deleteConfirm })} />
    </Card>
  );
}
