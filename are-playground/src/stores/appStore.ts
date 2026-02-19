import { create } from 'zustand';

type TabId = 'rpgGame' | 'smartHome' | 'ecommerce' | 'sandbox';

interface AppState {
  activeTab: TabId;
  language: 'en' | 'tr';
  setActiveTab: (tab: TabId) => void;
  setLanguage: (lang: 'en' | 'tr') => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'rpgGame',
  language: 'en',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLanguage: (lang) => set({ language: lang }),
}));
