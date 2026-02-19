import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './stores/appStore';
import { Header } from './components/layout/Header';
import { TabBar } from './components/layout/TabBar';
import { Footer } from './components/layout/Footer';
import { ScenarioView } from './components/scenarios/ScenarioView';
import { SandboxView } from './components/sandbox/SandboxView';
import { rpgGameConfig } from './engine/scenarios/rpgGame';
import { smartHomeConfig } from './engine/scenarios/smartHome';
import { ecommerceConfig } from './engine/scenarios/ecommerce';

const scenarioConfigs = {
  rpgGame: rpgGameConfig,
  smartHome: smartHomeConfig,
  ecommerce: ecommerceConfig,
} as const;

function App() {
  const activeTab = useAppStore((s) => s.activeTab);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TabBar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'sandbox' ? (
            <SandboxView key="sandbox" />
          ) : (
            <ScenarioView
              key={activeTab}
              config={scenarioConfigs[activeTab as keyof typeof scenarioConfigs]}
            />
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default App;
