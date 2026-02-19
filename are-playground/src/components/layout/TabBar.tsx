import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Sword, Home, ShoppingCart, Code } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'rpgGame' as const, icon: Sword, color: '#ff6b6b' },
  { id: 'smartHome' as const, icon: Home, color: '#51cf66' },
  { id: 'ecommerce' as const, icon: ShoppingCart, color: '#748ffc' },
  { id: 'sandbox' as const, icon: Code, color: '#ffa94d' },
];

export function TabBar() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <nav className="flex gap-1 rounded-xl bg-surface-900/60 p-1">
        {tabs.map(({ id, icon: Icon, color }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                isActive ? 'text-white' : 'text-surface-200/60 hover:text-surface-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: `${color}20`, boxShadow: `0 0 20px ${color}15` }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: isActive ? color : undefined }} />
                <span className="hidden sm:inline">{t(`tabs.${id}`)}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
