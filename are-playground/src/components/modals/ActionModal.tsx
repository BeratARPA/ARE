import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { useScenarioStore } from '../../stores/scenarioStore';
import type { ScenarioAction } from '../../engine/types';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioId: string;
  initialAction?: ScenarioAction;
}

const inputClass = 'w-full rounded-md px-2.5 py-2 text-sm font-mono border focus:border-primary-500/50 focus:outline-none transition-colors';
const inputStyle: React.CSSProperties = { background: 'var(--th-input-bg)', borderColor: 'var(--th-input-border)', color: 'var(--th-text)' };

export function ActionModal({ isOpen, onClose, scenarioId, initialAction }: ActionModalProps) {
  const { t } = useTranslation();
  const isEdit = !!initialAction;

  const [type, setType] = useState(initialAction?.type ?? '');
  const [label, setLabel] = useState(initialAction?.label ?? '');
  const [description, setDescription] = useState(initialAction?.description ?? '');

  const handleSave = () => {
    if (!type.trim() || !label.trim()) return;
    const action: ScenarioAction = { type: type.trim(), label: label.trim(), description: description.trim() };

    if (isEdit) {
      useScenarioStore.getState().updateAction(scenarioId, initialAction!.type, action);
    } else {
      useScenarioStore.getState().addAction(scenarioId, action);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('crud.editAction') : t('crud.addAction')}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.type')}</label>
          <input type="text" value={type} onChange={(e) => setType(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. play_sound" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.label')}</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Play Sound" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.description')}</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} style={inputStyle} placeholder="Description..." />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>{t('crud.cancel')}</Button>
          <Button variant="accent" size="sm" onClick={handleSave}>{isEdit ? t('crud.save') : t('crud.add')}</Button>
        </div>
      </div>
    </Modal>
  );
}
