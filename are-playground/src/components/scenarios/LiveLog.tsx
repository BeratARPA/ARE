import { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { useLogStore } from '../../stores/logStore';

interface LiveLogProps {
  scenarioId: string;
  color: string;
}

const typeColors: Record<string, string> = {
  info: 'text-primary-300',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

const typeDots: Record<string, string> = {
  info: 'bg-primary-400',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

export function LiveLog({ scenarioId, color }: LiveLogProps) {
  const { t } = useTranslation();
  const allLogs = useLogStore((s) => s.logs);
  const clearLogs = useLogStore((s) => s.clearLogs);
  const logs = useMemo(() => allLogs.filter((l) => l.scenario === scenarioId), [allLogs, scenarioId]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <ScrollText className="h-4 w-4" style={{ color }} />
          {t('panels.liveLog')}
        </h3>
        {logs.length > 0 && (
          <button
            onClick={() => clearLogs(scenarioId)}
            className="flex items-center gap-1 text-xs text-surface-200/40 hover:text-surface-200 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            {t('panels.clearLog')}
          </button>
        )}
      </div>

      <div className="h-52 overflow-y-auto rounded-lg bg-surface-950/50 p-2 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-surface-200/30">
            {t('panels.noLogs')}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 py-0.5"
              >
                <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${typeDots[log.type]}`} />
                <span className="text-surface-200/30 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={typeColors[log.type]}>{log.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </Card>
  );
}
