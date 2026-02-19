import { useTranslation } from 'react-i18next';
import { Database } from 'lucide-react';
import { Card } from '../ui/Card';
import { useContextStore } from '../../stores/contextStore';

interface ContextViewerProps {
  scenarioId: string;
  color: string;
}

export function ContextViewer({ scenarioId, color }: ContextViewerProps) {
  const { t } = useTranslation();
  const contextData = useContextStore((s) => s.contexts[scenarioId]);

  const entries = contextData ? Object.entries(contextData) : [];

  return (
    <Card>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
        <Database className="h-4 w-4" style={{ color }} />
        {t('panels.context')}
      </h3>

      <div className="h-40 overflow-y-auto rounded-lg bg-surface-950/50 p-3 font-mono text-[11px]">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-surface-200/30">
            {t('panels.emptyContext')}
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-surface-200/40">{'{'}</span>
            {entries.map(([key, value], idx) => (
              <div key={key} className="pl-4">
                <span className="text-primary-300">&quot;{key}&quot;</span>
                <span className="text-surface-200/40">: </span>
                <span className={typeof value === 'string' ? 'text-success' : typeof value === 'number' ? 'text-accent-400' : 'text-warning'}>
                  {typeof value === 'string' ? `"${value}"` : String(value)}
                </span>
                {idx < entries.length - 1 && <span className="text-surface-200/40">,</span>}
              </div>
            ))}
            <span className="text-surface-200/40">{'}'}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
