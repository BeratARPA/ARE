import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { useScenarioStore } from '../../stores/scenarioStore';
import type { ScenarioRuleConfig } from '../../engine/types';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioId: string;
  initialRule?: ScenarioRuleConfig;
}

const inputBase = 'rounded-md px-2.5 py-2 text-sm font-mono border focus:border-primary-500/50 focus:outline-none transition-colors';
const inputClass = `w-full ${inputBase}`;

const inputStyle: React.CSSProperties = { background: 'var(--th-input-bg)', borderColor: 'var(--th-input-border)', color: 'var(--th-text)' };

const operators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'in'];
const matchModes = ['All', 'Any', 'None', 'ExactlyOne'];

interface ConditionRow {
  field: string;
  op: string;
  value: string;
}

function parseCondition(cond: string): ConditionRow {
  const parts = cond.split(' ');
  return { field: parts[0] || '', op: parts[1] || 'eq', value: parts.slice(2).join(' ') || '' };
}

export function RuleModal({ isOpen, onClose, scenarioId, initialRule }: RuleModalProps) {
  const { t } = useTranslation();
  const isEdit = !!initialRule;
  const config = useScenarioStore((s) => s.configs[scenarioId]);

  const [id, setId] = useState(initialRule?.id ?? '');
  const [label, setLabel] = useState(initialRule?.label ?? '');
  const [description, setDescription] = useState(initialRule?.description ?? '');
  const [group, setGroup] = useState(initialRule?.group ?? '');
  const [priority, setPriority] = useState(initialRule?.priority ?? 5);
  const [matchMode, setMatchMode] = useState(initialRule?.matchMode ?? 'All');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(initialRule?.events ?? []);
  const [conditions, setConditions] = useState<ConditionRow[]>(
    initialRule?.conditions.map(parseCondition) ?? []
  );
  const [selectedActions, setSelectedActions] = useState<string[]>(initialRule?.actions ?? []);

  const toggleEvent = (type: string) => {
    setSelectedEvents((prev) =>
      prev.includes(type) ? prev.filter((e) => e !== type) : [...prev, type]
    );
  };

  const toggleAction = (type: string) => {
    setSelectedActions((prev) =>
      prev.includes(type) ? prev.filter((a) => a !== type) : [...prev, type]
    );
  };

  const addCondition = () => setConditions([...conditions, { field: '', op: 'eq', value: '' }]);
  const removeCondition = (idx: number) => setConditions(conditions.filter((_, i) => i !== idx));
  const updateCondition = (idx: number, partial: Partial<ConditionRow>) => {
    const next = [...conditions];
    next[idx] = { ...next[idx], ...partial };
    setConditions(next);
  };

  const handleSave = () => {
    if (!id.trim() || !label.trim() || selectedActions.length === 0) return;

    const conditionStrings = conditions
      .filter((c) => c.field.trim())
      .map((c) => `${c.field.trim()} ${c.op} ${c.value.trim()}`);

    const rule: ScenarioRuleConfig = {
      id: id.trim(),
      label: label.trim(),
      description: description.trim(),
      group: group.trim(),
      priority,
      events: selectedEvents,
      matchMode,
      conditions: conditionStrings,
      actions: selectedActions,
    };

    if (isEdit) {
      useScenarioStore.getState().updateRule(scenarioId, initialRule!.id, rule);
    } else {
      useScenarioStore.getState().addRule(scenarioId, rule);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('crud.editRule') : t('crud.addRule')}>
      <div className="space-y-3">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.id')}</label>
            <input type="text" value={id} onChange={(e) => setId(e.target.value)} className={inputClass} style={inputStyle} placeholder="rule_id" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.group')}</label>
            <input type="text" value={group} onChange={(e) => setGroup(e.target.value)} className={inputClass} style={inputStyle} placeholder="combat" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.label')}</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} style={inputStyle} placeholder="Rule Name" />
        </div>

        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.description')}</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} style={inputStyle} placeholder="What this rule does..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.priority')}</label>
            <input type="number" min={1} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-200/60 mb-1">{t('crud.matchMode')}</label>
            <select value={matchMode} onChange={(e) => setMatchMode(e.target.value)} className={inputClass} style={inputStyle}>
              {matchModes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Events */}
        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1.5">{t('crud.events')}</label>
          <div className="flex flex-wrap gap-1.5">
            {config.events.map((evt) => (
              <button
                key={evt.type}
                type="button"
                onClick={() => toggleEvent(evt.type)}
                className={`rounded-md px-2.5 py-1 text-xs font-mono cursor-pointer transition-colors border ${
                  selectedEvents.includes(evt.type)
                    ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                    : 'bg-surface-950/50 border-white/5 text-surface-200/50 hover:border-white/15'
                }`}
              >
                {evt.type}
              </button>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-surface-200/60">{t('crud.conditions')}</label>
            <button onClick={addCondition} className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 cursor-pointer">
              <Plus className="h-3 w-3" /> {t('crud.addCondition')}
            </button>
          </div>
          <div className="space-y-1.5">
            {conditions.map((c, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={c.field}
                  onChange={(e) => updateCondition(idx, { field: e.target.value })}
                  className={`${inputBase} flex-1 min-w-0`}
                  style={{ background: 'var(--th-input-bg)', borderColor: 'var(--th-input-border)', color: 'var(--th-text)' }}
                  placeholder="field"
                />
                <select
                  value={c.op}
                  onChange={(e) => updateCondition(idx, { op: e.target.value })}
                  className={`${inputBase} w-28 shrink-0`}
                  style={{ background: 'var(--th-input-bg)', borderColor: 'var(--th-input-border)', color: 'var(--th-text)' }}
                >
                  {operators.map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => updateCondition(idx, { value: e.target.value })}
                  className={`${inputBase} flex-1 min-w-0`}
                  style={{ background: 'var(--th-input-bg)', borderColor: 'var(--th-input-border)', color: 'var(--th-text)' }}
                  placeholder="value"
                />
                <button onClick={() => removeCondition(idx)} className="text-surface-200/30 hover:text-error cursor-pointer shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <label className="block text-xs font-medium text-surface-200/60 mb-1.5">{t('crud.actions')}</label>
          <div className="flex flex-wrap gap-1.5">
            {config.actions.map((act) => (
              <button
                key={act.type}
                type="button"
                onClick={() => toggleAction(act.type)}
                className={`rounded-md px-2.5 py-1 text-xs font-mono cursor-pointer transition-colors border ${
                  selectedActions.includes(act.type)
                    ? 'bg-accent-500/20 border-accent-500/40 text-accent-400'
                    : 'bg-surface-950/50 border-white/5 text-surface-200/50 hover:border-white/15'
                }`}
              >
                {act.type}
              </button>
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
