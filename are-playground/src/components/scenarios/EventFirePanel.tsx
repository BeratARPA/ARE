import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EventModal } from '../modals/EventModal';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { useScenarioStore } from '../../stores/scenarioStore';
import type { ScenarioConfig, ScenarioEvent } from '../../engine/types';

interface EventFirePanelProps {
  config: ScenarioConfig;
  onFire: (eventType: string, data: Record<string, unknown>) => void;
}

export function EventFirePanel({ config, onFire }: EventFirePanelProps) {
  const { t } = useTranslation();
  const [selectedEventIdx, setSelectedEventIdx] = useState(0);
  const [eventData, setEventData] = useState<Record<string, unknown>>(
    () => config.events.length > 0 ? { ...config.events[0].defaultData } : {}
  );
  const [isOpen, setIsOpen] = useState(false);
  const [firing, setFiring] = useState(false);

  const [eventModal, setEventModal] = useState<{ open: boolean; editing?: ScenarioEvent }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (config.events.length === 0) return;
    const clamped = Math.min(selectedEventIdx, config.events.length - 1);
    if (clamped !== selectedEventIdx) setSelectedEventIdx(clamped);
    setEventData({ ...config.events[clamped].defaultData });
  }, [config.events, config.events.length, selectedEventIdx]);

  const selectedEvent = config.events[selectedEventIdx];

  const handleSelectEvent = useCallback((idx: number) => {
    setSelectedEventIdx(idx);
    setEventData({ ...config.events[idx].defaultData });
    setIsOpen(false);
  }, [config.events]);

  const handleFire = useCallback(async () => {
    if (!selectedEvent) return;
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

  const handleDelete = () => {
    if (deleteConfirm) {
      useScenarioStore.getState().deleteEvent(config.id, deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (config.events.length === 0) {
    return (
      <Card className="relative z-10">
        <h3 className="flex items-center justify-between text-sm font-semibold text-white mb-3">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: config.color }} />
            {t('panels.fireEvent')}
          </span>
          <button onClick={() => setEventModal({ open: true })} className="text-primary-400 hover:text-primary-300 cursor-pointer">
            <Plus className="h-4 w-4" />
          </button>
        </h3>
        <p className="text-xs text-surface-200/40 text-center py-4">No events. Add one to get started.</p>
        <EventModal isOpen={eventModal.open} onClose={() => setEventModal({ open: false })} scenarioId={config.id} />
      </Card>
    );
  }

  return (
    <Card className="relative z-10">
      <h3 className="flex items-center justify-between text-sm font-semibold text-white mb-3">
        <span className="flex items-center gap-2">
          <Zap className="h-4 w-4" style={{ color: config.color }} />
          {t('panels.fireEvent')}
        </span>
        <button onClick={() => setEventModal({ open: true })} className="text-primary-400 hover:text-primary-300 cursor-pointer" title={t('crud.addEvent')}>
          <Plus className="h-4 w-4" />
        </button>
      </h3>

      <div className="relative mb-3">
        <div className="flex gap-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex flex-1 items-center justify-between rounded-lg bg-surface-900/80 px-3 py-2 text-sm text-white cursor-pointer hover:bg-surface-800/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: config.color }} />
              {selectedEvent.label}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setEventModal({ open: true, editing: selectedEvent })}
            className="rounded-lg bg-surface-900/80 px-2 text-surface-200/40 hover:text-primary-300 cursor-pointer transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteConfirm(selectedEvent.type)}
            className="rounded-lg bg-surface-900/80 px-2 text-surface-200/40 hover:text-error cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-50 mt-1 w-full rounded-lg border shadow-xl max-h-64 overflow-y-auto"
              style={{ background: 'var(--th-bg-secondary)', borderColor: 'var(--th-border)' }}
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
                className="flex-1 rounded-md px-2.5 py-1.5 text-xs font-mono border focus:border-primary-500/50 focus:outline-none transition-colors"
                style={{ background: 'var(--th-input-bg)', borderColor: 'var(--th-input-border)', color: 'var(--th-text)' }}
              />
            </div>
          ))}
        </div>
      </div>

      <motion.div animate={firing ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}>
        <Button variant="accent" size="lg" className="w-full" onClick={handleFire}>
          <Zap className="h-4 w-4" />
          {t('panels.fire')}
        </Button>
      </motion.div>

      <EventModal key={eventModal.editing?.type ?? '__new__'} isOpen={eventModal.open} onClose={() => setEventModal({ open: false })} scenarioId={config.id} initialEvent={eventModal.editing} />
      <ConfirmDialog isOpen={!!deleteConfirm} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} title={t('crud.delete')} message={t('crud.confirmDelete', { name: deleteConfirm })} />
    </Card>
  );
}
