import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { ScenarioConfig } from '../../engine/types';

interface EventFirePanelProps {
  config: ScenarioConfig;
  onFire: (eventType: string, data: Record<string, unknown>) => void;
}

export function EventFirePanel({ config, onFire }: EventFirePanelProps) {
  const { t } = useTranslation();
  const [selectedEventIdx, setSelectedEventIdx] = useState(0);
  const [eventData, setEventData] = useState<Record<string, unknown>>(
    () => ({ ...config.events[0].defaultData })
  );
  const [isOpen, setIsOpen] = useState(false);
  const [firing, setFiring] = useState(false);

  const selectedEvent = config.events[selectedEventIdx];

  const handleSelectEvent = useCallback((idx: number) => {
    setSelectedEventIdx(idx);
    setEventData({ ...config.events[idx].defaultData });
    setIsOpen(false);
  }, [config.events]);

  const handleFire = useCallback(async () => {
    setFiring(true);
    onFire(selectedEvent.type, eventData);
    setTimeout(() => setFiring(false), 400);
  }, [selectedEvent, eventData, onFire]);

  const updateField = (key: string, raw: string) => {
    let value: unknown = raw;
    if (raw === 'true') value = true;
    else if (raw === 'false') value = false;
    else if (!isNaN(Number(raw)) && raw !== '') value = Number(raw);
    setEventData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
        <Zap className="h-4 w-4" style={{ color: config.color }} />
        {t('panels.fireEvent')}
      </h3>

      {/* Event Selector */}
      <div className="relative mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-surface-900/80 px-3 py-2 text-sm text-white cursor-pointer hover:bg-surface-800/80 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: config.color }} />
            {selectedEvent.label}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-20 mt-1 w-full rounded-lg bg-surface-900 border border-white/10 shadow-xl overflow-hidden"
            >
              {config.events.map((evt, idx) => (
                <button
                  key={evt.type}
                  onClick={() => handleSelectEvent(idx)}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-white/5 cursor-pointer transition-colors ${
                    idx === selectedEventIdx ? 'bg-white/5 text-white' : 'text-surface-200'
                  }`}
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full shrink-0" style={{ background: config.color }} />
                  <div>
                    <div className="font-medium">{evt.label}</div>
                    <div className="text-xs text-surface-200/50">{evt.type}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Event Data Editor */}
      <div className="mb-3">
        <div className="text-xs font-medium text-surface-200/60 mb-1.5">{t('panels.eventData')}</div>
        <div className="space-y-1.5">
          {Object.entries(eventData).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <label className="w-28 shrink-0 text-xs text-surface-200/80 font-mono">{key}</label>
              <input
                type="text"
                value={String(value)}
                onChange={(e) => updateField(key, e.target.value)}
                className="flex-1 rounded-md bg-surface-900/80 px-2.5 py-1.5 text-xs font-mono text-white border border-white/5 focus:border-primary-500/50 focus:outline-none transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fire Button */}
      <motion.div animate={firing ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}>
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          onClick={handleFire}
        >
          <Zap className="h-4 w-4" />
          {t('panels.fire')}
        </Button>
      </motion.div>
    </Card>
  );
}
