import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/5 py-6 mt-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-xs text-surface-200/50">
        <div className="flex items-center gap-1.5">
          <span>{t('footer.builtWith')}</span>
          <Zap className="h-3 w-3 text-accent-500" />
          <a
            href="https://github.com/BeratARPA/ARE"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-400 hover:text-primary-300"
          >
            {t('footer.areEngine')}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://www.npmjs.com/package/are-engine-core" target="_blank" rel="noopener noreferrer" className="hover:text-surface-200 transition-colors">{t('footer.npm')}</a>
          <span>·</span>
          <a href="https://www.nuget.org/packages/ARE.Core/" target="_blank" rel="noopener noreferrer" className="hover:text-surface-200 transition-colors">{t('footer.nuget')}</a>
          <span>·</span>
          <a href="https://pub.dev/packages/are_engine_core" target="_blank" rel="noopener noreferrer" className="hover:text-surface-200 transition-colors">{t('footer.pubdev')}</a>
        </div>
      </div>
    </footer>
  );
}
