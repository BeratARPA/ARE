import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Github, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export function Header() {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useAppStore();

  const toggleLang = () => {
    const next = language === 'en' ? 'tr' : 'en';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="h-7 w-7 text-accent-500" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-white">
              {t('app.title')}
            </h1>
            <p className="text-xs text-surface-200/60">{t('app.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-surface-200 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" />
            {language === 'en' ? 'TR' : 'EN'}
          </button>
          <a
            href="https://github.com/BeratARPA/ARE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-surface-200 hover:bg-white/10 transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            {t('app.github')}
          </a>
        </div>
      </div>
    </header>
  );
}
