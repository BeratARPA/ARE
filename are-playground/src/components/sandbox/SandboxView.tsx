import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Code, Play, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CodeEditor } from './CodeEditor';
import { SandboxConsole } from './SandboxConsole';

const DEFAULT_CODE = `// ARE Engine Sandbox
// The full ARE API is available: AreEngine, Rule, GameEvent, etc.

const engine = new AreEngine();

// Register a simple action
engine.registerAction('greet', (ctx, settings) => {
  const name = settings.get('name') || 'World';
  console.log(\`Hello, \${name}! 👋\`);
});

engine.registerAction('log_event', (ctx, settings) => {
  console.log(\`Event processed: \${ctx.currentEvent.eventType}\`);
});

// Create a rule
const rule = Rule.create('welcome_rule')
  .on('user.login')
  .whenField('role', 'eq', 'admin')
  .then('greet', (s) => s.set('name', 'Admin'))
  .then('log_event');

engine.addRule(rule);

// Set onLog to see engine internals
engine.onLog = (msg) => console.log(msg);

// Fire an event
const result = await engine.fire('user.login', (evt) => {
  evt.data.role = 'admin';
  evt.data.username = 'beratarpa';
});

console.log(\`\\n✅ Result: \${result.firedRules.length} rules fired, \${result.skippedRules.length} skipped (\${result.duration}ms)\`);
`;

export function SandboxView() {
  const { t } = useTranslation();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<Array<{ type: string; text: string }>>([]);
  const [running, setRunning] = useState(false);
  const outputRef = useRef(output);
  outputRef.current = output;

  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutput([]);

    const logs: Array<{ type: string; text: string }> = [];
    const mockConsole = {
      log: (...args: unknown[]) => logs.push({ type: 'log', text: args.map(String).join(' ') }),
      error: (...args: unknown[]) => logs.push({ type: 'error', text: args.map(String).join(' ') }),
      warn: (...args: unknown[]) => logs.push({ type: 'warn', text: args.map(String).join(' ') }),
      info: (...args: unknown[]) => logs.push({ type: 'info', text: args.map(String).join(' ') }),
    };

    try {
      const { AreEngine, AreContext, GameEvent, Rule, ActionSettings, FieldCondition, MatchMode, CompareOp } = await import('are-engine-core');

      const asyncFn = new Function(
        'AreEngine', 'AreContext', 'GameEvent', 'Rule', 'ActionSettings',
        'FieldCondition', 'MatchMode', 'CompareOp', 'console',
        `return (async () => { ${code} })();`
      );

      await asyncFn(
        AreEngine, AreContext, GameEvent, Rule, ActionSettings,
        FieldCondition, MatchMode, CompareOp, mockConsole
      );
    } catch (err) {
      logs.push({ type: 'error', text: `Error: ${err instanceof Error ? err.message : String(err)}` });
    }

    setOutput(logs);
    setRunning(false);
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setOutput([]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-7xl px-4 py-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Code className="h-5 w-5 text-accent-400" />
          {t('sandbox.title')}
        </h2>
        <p className="text-sm text-surface-200/60 mt-1">{t('sandbox.description')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-surface-200/60">editor.js</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3 w-3" />
                {t('sandbox.reset')}
              </Button>
              <Button variant="accent" size="sm" onClick={handleRun} disabled={running}>
                <Play className="h-3 w-3" />
                {running ? '...' : t('sandbox.run')}
              </Button>
            </div>
          </div>
          <CodeEditor code={code} onChange={setCode} />
        </Card>

        {/* Console */}
        <SandboxConsole output={output} onClear={() => setOutput([])} />
      </div>
    </motion.div>
  );
}
