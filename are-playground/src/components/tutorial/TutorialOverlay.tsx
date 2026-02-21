import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorialStore } from '../../stores/tutorialStore';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const TOOLTIP_GAP = 12;

export function TutorialOverlay() {
  const { t } = useTranslation();
  const { isActive, currentStep, steps, next, back, skip } = useTutorialStore();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  const step = steps[currentStep];

  const measure = useCallback(() => {
    if (!isActive || !step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setTargetRect(null);
    }
  }, [isActive, step]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  // Re-measure when step changes
  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(measure, 50);
    return () => clearTimeout(timer);
  }, [currentStep, isActive, measure]);

  if (!isActive || !step) return null;

  // Spotlight hole position
  const hole = targetRect
    ? {
        top: targetRect.top - PAD,
        left: targetRect.left - PAD,
        width: targetRect.width + PAD * 2,
        height: targetRect.height + PAD * 2,
      }
    : null;

  // Tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!hole) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const style: React.CSSProperties = { position: 'fixed' };
    const tooltipW = 320;

    switch (step.placement) {
      case 'bottom':
        style.top = hole.top + hole.height + TOOLTIP_GAP;
        style.left = hole.left + hole.width / 2 - tooltipW / 2;
        break;
      case 'top':
        style.bottom = window.innerHeight - hole.top + TOOLTIP_GAP;
        style.left = hole.left + hole.width / 2 - tooltipW / 2;
        break;
      case 'right':
        style.top = hole.top + hole.height / 2;
        style.left = hole.left + hole.width + TOOLTIP_GAP;
        style.transform = 'translateY(-50%)';
        break;
      case 'left':
        style.top = hole.top + hole.height / 2;
        style.right = window.innerWidth - hole.left + TOOLTIP_GAP;
        style.transform = 'translateY(-50%)';
        break;
    }

    // Ensure tooltip stays within viewport
    if (typeof style.left === 'number') {
      style.left = Math.max(16, Math.min(style.left, window.innerWidth - tooltipW - 16));
    }

    return style;
  };

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0" style={{ zIndex: 9998 }}>
        {/* Dark overlay with spotlight hole via clip-path */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          style={{
            background: 'rgba(0,0,0,0.7)',
            ...(hole
              ? {
                  clipPath: `polygon(
                    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                    ${hole.left}px ${hole.top}px,
                    ${hole.left}px ${hole.top + hole.height}px,
                    ${hole.left + hole.width}px ${hole.top + hole.height}px,
                    ${hole.left + hole.width}px ${hole.top}px,
                    ${hole.left}px ${hole.top}px
                  )`,
                }
              : {}),
          }}
          onClick={skip}
        />

        {/* Spotlight border glow */}
        {hole && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed rounded-lg pointer-events-none"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              border: '2px solid rgba(92,124,250,0.5)',
              boxShadow: '0 0 20px rgba(92,124,250,0.3)',
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="fixed w-80 rounded-xl border shadow-2xl p-4"
          style={{
            ...getTooltipStyle(),
            background: 'var(--th-modal-bg, #1a1d35)',
            borderColor: 'rgba(92,124,250,0.3)',
            zIndex: 9999,
          }}
        >
          <div className="text-sm font-bold text-white mb-1">{t(step.titleKey)}</div>
          <div className="text-xs leading-relaxed mb-4" style={{ color: 'var(--th-text-muted, rgba(255,255,255,0.5))' }}>
            {t(step.descKey)}
          </div>

          <div className="flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === currentStep ? 16 : 6,
                    background: i === currentStep ? '#5c7cfa' : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={skip}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium cursor-pointer transition-colors"
                style={{ color: 'var(--th-text-muted, rgba(255,255,255,0.4))' }}
              >
                {t('tutorial.skip')}
              </button>
              {!isFirst && (
                <button
                  onClick={back}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--th-text, white)' }}
                >
                  {t('tutorial.back')}
                </button>
              )}
              <button
                onClick={next}
                className="px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors text-white"
                style={{ background: '#5c7cfa' }}
              >
                {isLast ? t('tutorial.done') : t('tutorial.next')}
              </button>
            </div>
          </div>

          {/* Step counter */}
          <div className="text-[9px] text-center mt-2" style={{ color: 'var(--th-text-muted, rgba(255,255,255,0.3))' }}>
            {t('tutorial.stepOf', { current: currentStep + 1, total: steps.length })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
