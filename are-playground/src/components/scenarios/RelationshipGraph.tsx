import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../modals/Modal';
import type { ScenarioConfig } from '../../engine/types';

interface RelationshipGraphProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScenarioConfig;
}

interface Edge {
  from: string;
  to: string;
  type: 'event-rule' | 'rule-action';
}

interface NodeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const EVENT_COLOR = '#ff922b';
const RULE_COLOR = '#5c7cfa';
const ACTION_COLOR = '#51cf66';

export function RelationshipGraph({ isOpen, onClose, config }: RelationshipGraphProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [positions, setPositions] = useState<Record<string, NodeRect>>({});
  const [hovered, setHovered] = useState<string | null>(null);

  const edges: Edge[] = [];
  for (const rule of config.rules) {
    for (const evt of rule.events) {
      edges.push({ from: evt, to: rule.id, type: 'event-rule' });
    }
    for (const act of rule.actions) {
      edges.push({ from: rule.id, to: act, type: 'rule-action' });
    }
  }

  const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const newPositions: Record<string, NodeRect> = {};
      for (const [id, el] of Object.entries(nodeRefs.current)) {
        if (el) {
          const r = el.getBoundingClientRect();
          newPositions[id] = {
            x: r.left - cRect.left,
            y: r.top - cRect.top,
            w: r.width,
            h: r.height,
          };
        }
      }
      setPositions(newPositions);
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, config]);

  const connectedToHover = new Set<string>();
  if (hovered) {
    connectedToHover.add(hovered);
    for (const e of edges) {
      if (e.from === hovered || e.to === hovered) {
        connectedToHover.add(e.from);
        connectedToHover.add(e.to);
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('graph.title')}>
      <div ref={containerRef} className="relative min-h-[400px]">
        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {edges.map((edge, i) => {
            const fromPos = positions[edge.from];
            const toPos = positions[edge.to];
            if (!fromPos || !toPos) return null;
            const x1 = fromPos.x + fromPos.w;
            const y1 = fromPos.y + fromPos.h / 2;
            const x2 = toPos.x;
            const y2 = toPos.y + toPos.h / 2;
            const cx1 = x1 + (x2 - x1) * 0.4;
            const cx2 = x2 - (x2 - x1) * 0.4;

            const isHighlighted = !hovered || (connectedToHover.has(edge.from) && connectedToHover.has(edge.to));
            const strokeColor = edge.type === 'event-rule' ? EVENT_COLOR : ACTION_COLOR;

            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1.5}
                opacity={isHighlighted ? 0.6 : 0.08}
                style={{ transition: 'opacity 0.2s' }}
              />
            );
          })}
        </svg>

        {/* 3-column node layout */}
        <div className="grid grid-cols-3 gap-6 relative" style={{ zIndex: 1 }}>
          {/* Events column */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: EVENT_COLOR }}>
              {t('graph.events')}
            </div>
            {config.events.map((evt) => (
              <div
                key={evt.type}
                ref={setNodeRef(evt.type)}
                onMouseEnter={() => setHovered(evt.type)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-lg px-2.5 py-2 border cursor-default transition-all"
                style={{
                  borderColor: hovered && !connectedToHover.has(evt.type) ? 'var(--th-border)' : EVENT_COLOR + '50',
                  background: hovered && !connectedToHover.has(evt.type) ? 'transparent' : EVENT_COLOR + '10',
                  opacity: hovered && !connectedToHover.has(evt.type) ? 0.3 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div className="text-[10px] font-semibold text-white">{evt.label}</div>
                <div className="text-[8px] font-mono" style={{ color: 'var(--th-text-muted)' }}>{evt.type}</div>
              </div>
            ))}
          </div>

          {/* Rules column */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: RULE_COLOR }}>
              {t('graph.rules')}
            </div>
            {config.rules.map((rule) => (
              <div
                key={rule.id}
                ref={setNodeRef(rule.id)}
                onMouseEnter={() => setHovered(rule.id)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-lg px-2.5 py-2 border cursor-default transition-all"
                style={{
                  borderColor: hovered && !connectedToHover.has(rule.id) ? 'var(--th-border)' : RULE_COLOR + '50',
                  background: hovered && !connectedToHover.has(rule.id) ? 'transparent' : RULE_COLOR + '10',
                  opacity: hovered && !connectedToHover.has(rule.id) ? 0.3 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div className="text-[10px] font-semibold text-white">{rule.label}</div>
                <div className="text-[8px] font-mono" style={{ color: 'var(--th-text-muted)' }}>{rule.id}</div>
              </div>
            ))}
          </div>

          {/* Actions column */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: ACTION_COLOR }}>
              {t('graph.actions')}
            </div>
            {config.actions.map((action) => (
              <div
                key={action.type}
                ref={setNodeRef(action.type)}
                onMouseEnter={() => setHovered(action.type)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-lg px-2.5 py-2 border cursor-default transition-all"
                style={{
                  borderColor: hovered && !connectedToHover.has(action.type) ? 'var(--th-border)' : ACTION_COLOR + '50',
                  background: hovered && !connectedToHover.has(action.type) ? 'transparent' : ACTION_COLOR + '10',
                  opacity: hovered && !connectedToHover.has(action.type) ? 0.3 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div className="text-[10px] font-semibold text-white">{action.label}</div>
                <div className="text-[8px] font-mono" style={{ color: 'var(--th-text-muted)' }}>{action.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
