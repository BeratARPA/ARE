import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';

interface SandboxConsoleProps {
  output: Array<{ type: string; text: string }>;
  onClear: () => void;
}

const typeColors: Record<string, string> = {
  log: 'text-surface-200',
  info: 'text-primary-300',
  warn: 'text-warning',
  error: 'text-error',
};

export function SandboxConsole({ output, onClear }: SandboxConsoleProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output.length]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Terminal className="h-4 w-4 text-accent-400" />
          {t('sandbox.console')}
        </h3>
        {output.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-surface-200/40 hover:text-surface-200 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            {t('sandbox.clearConsole')}
          </button>
        )}
      </div>

      <div className="h-[500px] overflow-y-auto rounded-lg bg-surface-950/80 p-3 font-mono text-xs">
        {output.length === 0 ? (
          <div className="flex h-full items-center justify-center text-surface-200/30">
            {t('sandbox.emptyConsole')}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {output.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className={`py-0.5 whitespace-pre-wrap ${typeColors[line.type] || 'text-surface-200'}`}
              >
                <span className="text-surface-200/20 select-none mr-2">{String(i + 1).padStart(2)}</span>
                {line.text}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </Card>
  );
}
