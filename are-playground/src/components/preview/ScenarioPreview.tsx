import { useTranslation } from 'react-i18next';
import { Eye, RotateCcw } from 'lucide-react';
import { Card } from '../ui/Card';
import { usePreviewStore } from '../../stores/previewStore';
import { RPGPreview } from './RPGPreview';
import { SmartHomePreview } from './SmartHomePreview';
import { ECommercePreview } from './ECommercePreview';

interface ScenarioPreviewProps {
  scenarioId: string;
  color: string;
}

export function ScenarioPreview({ scenarioId, color }: ScenarioPreviewProps) {
  const { t } = useTranslation();
  const resetPreview = usePreviewStore((s) => s.resetPreview);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Eye className="h-4 w-4" style={{ color }} />
          {t('preview.title')}
        </h3>
        <button
          onClick={() => resetPreview(scenarioId)}
          className="flex items-center gap-1 text-xs text-surface-200/40 hover:text-surface-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          {t('preview.reset')}
        </button>
      </div>
      <div className="h-[280px] rounded-xl overflow-hidden border" style={{ background: '#12152a', borderColor: 'var(--th-border)' }} data-theme="dark">
        {scenarioId === 'rpgGame' && <RPGPreview />}
        {scenarioId === 'smartHome' && <SmartHomePreview />}
        {scenarioId === 'ecommerce' && <ECommercePreview />}
      </div>
    </Card>
  );
}
