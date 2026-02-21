import { create } from 'zustand';

type TabId = 'rpgGame' | 'smartHome' | 'ecommerce' | 'sandbox';
type Theme = 'dark' | 'light';

interface AppState {
  activeTab: TabId;
  language: 'en' | 'tr';
  theme: Theme;
  setActiveTab: (tab: TabId) => void;
  setLanguage: (lang: 'en' | 'tr') => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('are-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  }
  return 'dark';
};

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'rpgGame',
  language: 'en',
  theme: getInitialTheme(),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLanguage: (lang) => set({ language: lang }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('are-theme', next);
      return { theme: next };
    }),
}));
