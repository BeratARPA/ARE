import { create } from 'zustand';

export interface TutorialStep {
  target: string;          // data-tour attribute value
  titleKey: string;        // i18n key for title
  descKey: string;         // i18n key for description
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TutorialStep[] = [
  { target: 'scenario-header', titleKey: 'tutorial.step1Title', descKey: 'tutorial.step1Desc', placement: 'bottom' },
  { target: 'event-fire-panel', titleKey: 'tutorial.step2Title', descKey: 'tutorial.step2Desc', placement: 'right' },
  { target: 'rule-manager', titleKey: 'tutorial.step3Title', descKey: 'tutorial.step3Desc', placement: 'right' },
  { target: 'action-registry', titleKey: 'tutorial.step4Title', descKey: 'tutorial.step4Desc', placement: 'right' },
  { target: 'live-log', titleKey: 'tutorial.step5Title', descKey: 'tutorial.step5Desc', placement: 'left' },
  { target: 'context-viewer', titleKey: 'tutorial.step6Title', descKey: 'tutorial.step6Desc', placement: 'left' },
  { target: 'rule-debugger', titleKey: 'tutorial.step7Title', descKey: 'tutorial.step7Desc', placement: 'left' },
];

const STORAGE_KEY = 'are-tour-seen';

interface TutorialState {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  hasSeenTutorial: () => boolean;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  isActive: false,
  currentStep: 0,
  steps: STEPS,

  start: () => set({ isActive: true, currentStep: 0 }),

  next: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      // Finished
      localStorage.setItem(STORAGE_KEY, 'true');
      set({ isActive: false, currentStep: 0 });
    }
  },

  back: () => {
    const { currentStep } = get();
    if (currentStep > 0) set({ currentStep: currentStep - 1 });
  },

  skip: () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    set({ isActive: false, currentStep: 0 });
  },

  hasSeenTutorial: () => localStorage.getItem(STORAGE_KEY) === 'true',
}));
