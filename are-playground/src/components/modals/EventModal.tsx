import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { useScenarioStore } from '../../stores/scenarioStore';
import type { ScenarioEvent } from '../../engine/types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioId: string;
  initialEvent?: ScenarioEvent;
}

const inputClass = 'w-full rounded-md px-2.5 py-2 text-sm font-mono border focus:border-primary-500/50 focus:outline-none transition-colors';
const inputStyle: React.CSSProperties = { background: 'var(--th-input-bg)', borderColor: 'var(--th-input-border)', color: 'var(--th-text)' };

export function EventModal({ isOpen, onClose, scenarioId, initialEvent }: EventModalProps) {
  const { t } = useTranslation();
  const isEdit = !!initialEvent;

  const [type, setType] = useState(initialEvent?.type ?? '');
  const [label, setLabel] = useState(initialEvent?.label ?? '');
  const [description, setDescription] = useState(initialEvent?.description ?? '');
  const [fields, setFields] = useState<Array<{ key: string; value: string }>>(
    initialEvent
      ? Object.entries(initialEvent.defaultData).map(([key, value]) => ({ key, value: String(value) }))
      : [{ key: '', value: '' }]
  );

  const addField = () => setFields([...fields, { key: '', value: '' }]);
  const removeField = (idx: number) => setFields(fields.filter((_, i) => i !== idx));
  const updateFieldKey = (idx: number, key: string) => {
    const next = [...fields];
    next[idx] = { ...next[idx], key };
    setFields(next);
  };
  const updateFieldValue = (idx: number, value: string) => {
    const next = [...fields];
    next[idx] = { ...next[idx], value };
    setFields(next);
  };

  const handleSave = () => {
    if (!type.trim() || !label.trim()) return;
    const defaultData: Record<string, unknown> = {};
    for (const f of fields) {
      if (!f.key.trim()) continue;
      let val: unknown = f.value;
      if (f.value === 'true') val = true;
      else if (f.value === 'false') val = false;
      else if (!isNaN(Number(f.value)) && f.value !== '') val = Number(f.value);
      defaultData[f.key] = val;
    }
    const event: ScenarioEvent = { type: type.trim(), label: label.trim(), description: description.trim(), defaultData };

    if (isEdit) {
      useScenarioStore.getState().updateEvent(scenarioId, initialEvent!.type, event);
    } else {
      useScenarioStore.getState().addEvent(scenarioId, event);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('crud.editEvent') : t('crud.addEvent')}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.type')}</label>
          <input type="text" value={type} onChange={(e) => setType(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. player.attack" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.label')}</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Player Attack" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.description')}</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} style={inputStyle} placeholder="Description..." />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-surface-200/60">{t('crud.defaultData')}</label>
            <button onClick={addField} className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 cursor-pointer">
              <Plus className="h-3 w-3" /> {t('crud.addField')}
            </button>
          </div>
          <div className="space-y-1.5">
            {fields.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={f.key}
                  onChange={(e) => updateFieldKey(idx, e.target.value)}
                  className={`${inputClass} flex-1 min-w-0`}
                  style={inputStyle}
                  placeholder="key"
                />
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => updateFieldValue(idx, e.target.value)}
                  className={`${inputClass} flex-1 min-w-0`}
                  style={inputStyle}
                  placeholder="value"
                />
                <button onClick={() => removeField(idx)} className="text-surface-200/30 hover:text-error cursor-pointer shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>{t('crud.cancel')}</Button>
          <Button variant="accent" size="sm" onClick={handleSave}>{isEdit ? t('crud.save') : t('crud.add')}</Button>
        </div>
      </div>
    </Modal>
  );
}
