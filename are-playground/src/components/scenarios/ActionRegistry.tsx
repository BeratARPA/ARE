import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cog, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { ActionModal } from '../modals/ActionModal';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { useScenarioStore } from '../../stores/scenarioStore';
import type { ScenarioConfig, ScenarioAction } from '../../engine/types';

interface ActionRegistryProps {
  config: ScenarioConfig;
}

export function ActionRegistry({ config }: ActionRegistryProps) {
  const { t } = useTranslation();
  const [actionModal, setActionModal] = useState<{ open: boolean; editing?: ScenarioAction }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const actionUsage: Record<string, string[]> = {};
  for (const rule of config.rules) {
    for (const act of rule.actions) {
      if (!actionUsage[act]) actionUsage[act] = [];
      actionUsage[act].push(rule.label);
    }
  }

  const handleDelete = () => {
    if (deleteConfirm) {
      useScenarioStore.getState().deleteAction(config.id, deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <Card>
      <h3 className="flex items-center justify-between text-sm font-semibold text-white mb-3">
        <span className="flex items-center gap-2">
          <Cog className="h-4 w-4" style={{ color: config.color }} />
          {t('panels.actions')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-normal text-surface-200/50">
            {t('panels.actionsCount', { count: config.actions.length })}
          </span>
          <button onClick={() => setActionModal({ open: true })} className="text-primary-400 hover:text-primary-300 cursor-pointer">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </h3>

      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {config.actions.map((action) => {
          const usedBy = actionUsage[action.type] || [];
          return (
            <div key={action.type} className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white/3 transition-colors">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: config.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white">{action.label}</div>
                <div className="text-[10px] text-surface-200/50">{action.description}</div>
                {usedBy.length > 0 && <div className="text-[10px] text-surface-200/30 mt-0.5">Used by: {usedBy.join(', ')}</div>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => setActionModal({ open: true, editing: action })} className="text-surface-200/40 hover:text-primary-300 cursor-pointer"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => setDeleteConfirm(action.type)} className="text-surface-200/40 hover:text-error cursor-pointer"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <ActionModal key={actionModal.editing?.type ?? '__new__'} isOpen={actionModal.open} onClose={() => setActionModal({ open: false })} scenarioId={config.id} initialAction={actionModal.editing} />
      <ConfirmDialog isOpen={!!deleteConfirm} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} title={t('crud.delete')} message={t('crud.confirmDelete', { name: deleteConfirm })} />
    </Card>
  );
}
