import { useTranslation } from 'react-i18next';
import { Cog } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ScenarioConfig } from '../../engine/types';

interface ActionRegistryProps {
  config: ScenarioConfig;
}

export function ActionRegistry({ config }: ActionRegistryProps) {
  const { t } = useTranslation();

  // Count how many rules reference each action
  const actionUsage: Record<string, string[]> = {};
  for (const rule of config.rules) {
    for (const act of rule.actions) {
      if (!actionUsage[act]) actionUsage[act] = [];
      actionUsage[act].push(rule.label);
    }
  }

  return (
    <Card>
      <h3 className="flex items-center justify-between text-sm font-semibold text-white mb-3">
        <span className="flex items-center gap-2">
          <Cog className="h-4 w-4" style={{ color: config.color }} />
          {t('panels.actions')}
        </span>
        <span className="text-xs font-normal text-surface-200/50">
          {t('panels.actionsCount', { count: config.actions.length })}
        </span>
      </h3>

      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {config.actions.map((action) => {
          const usedBy = actionUsage[action.type] || [];
          return (
            <div
              key={action.type}
              className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white/3 transition-colors"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: config.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white">{action.label}</div>
                <div className="text-[10px] text-surface-200/50">{action.description}</div>
                {usedBy.length > 0 && (
                  <div className="text-[10px] text-surface-200/30 mt-0.5">
                    Used by: {usedBy.join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
