# are-engine-core — Action Rule Event Engine

Zero dependency, lightweight event-rule-action engine.

Browser, Node.js, React, Vue, React Native, Electron — works in any JS/TS environment.

> This package is the JavaScript/TypeScript port of the C# [ARE.Core](../ARE.Core/) engine.
> Same architecture, same API, same behavior.

---

## Installation

```bash
npm install are-engine-core
```

No build step required. TypeScript type definitions are included out of the box.

---

## Quick Start

```javascript
const { AreEngine, Rule } = require('are-engine-core');
// or
// import { AreEngine, Rule } from 'are-engine-core';

// 1) Create the engine
const engine = new AreEngine();

// 2) Register an action
engine.registerAction('send_email', async (ctx, s) => {
  console.log('Email sent:', s.get('template'));
});

// 3) Define a rule
engine.addRule(
  Rule.create('vip_order')
    .on('order.created')
    .whenGreaterThan('total', 5000)
    .then('send_email', s => s.set('template', 'vip_welcome'))
);

// 4) Fire an event
await engine.fire('order.created', e => e.set('total', 7500));
// Output: Email sent: vip_welcome
```

---

## Detailed Usage

### Defining an Action — Object-Based

```javascript
const damageAction = {
  actionType: 'damage',
  execute: async (ctx, settings) => {
    const amount = settings.get('amount');
    console.log(`${amount} damage dealt!`);
    ctx.set('lastDamage', amount);
  }
};

engine.registerAction(damageAction);
```

### Defining an Action — Inline

```javascript
engine.registerAction('log', async (ctx, s) => {
  console.log(s.get('message'));
});
```

### Defining a Rule — Fluent Builder

```javascript
engine.addRule(
  Rule.create('boss_room')
    .inGroup('spawning')
    .withPriority(10)
    .on('player.enter_zone')
    .withMatchMode(MatchMode.All)
    .whenEquals('zone_type', 'boss')
    .when('level_check', (evt) => (evt.data.player_level ?? 0) >= 5)
    .then('spawn_enemy', s => s.set('type', 'dragon').set('count', 1))
    .then('play_sound', s => s.set('clip', 'boss_roar'))
);
```

### Listening to Multiple Events

```javascript
Rule.create('license_warning')
  .on('app.started', 'license.checked')
  .when('expiring', (evt) => (evt.data.days_remaining ?? 999) <= 7)
  .then('show_notification', s => s
    .set('title', 'License Warning')
    .set('message', '7 days remaining!'))
```

### Condition Types

```javascript
// Field comparison (declarative)
.whenEquals('status', 'active')
.whenGreaterThan('score', 100)
.whenLessThan('stock', 10)
.whenField('category', CompareOp.Contains, 'premium')
.whenField('role', CompareOp.In, ['admin', 'moderator'])

// Lambda (flexible)
.when('custom_check', (evt, ctx) => {
  return evt.data.total > 1000 && ctx.get('user_type') === 'vip';
})
```

### MatchMode — Condition Matching Modes

```javascript
const { MatchMode } = require('are-engine-core');

// All conditions must be true (AND) — default
.withMatchMode(MatchMode.All)

// At least one condition must be true (OR)
.withMatchMode(MatchMode.Any)

// No conditions should be true (NOT)
.withMatchMode(MatchMode.None)

// Exactly one condition must be true
.withMatchMode(MatchMode.ExactlyOne)
```

### Middleware

```javascript
// Logging middleware
engine.use(0, async (ctx, next) => {
  console.log('Event started:', ctx.currentEvent.eventType);
  const start = Date.now();
  await next();
  console.log('Event completed:', (Date.now() - start) + 'ms');
});

// Auth middleware
engine.use(-10, async (ctx, next) => {
  if (!ctx.get('isAuthenticated')) {
    ctx.stopPipeline = true;
    return;
  }
  await next();
});
```

### Direct Listener (Without Rules)

```javascript
engine.on('order.created', async (evt, ctx) => {
  console.log('Order received:', evt.data.order_id);
});
```

### Dynamic Rule Management

```javascript
// Individual rules
engine.disableRule('seasonal_discount');
engine.enableRule('seasonal_discount');
engine.removeRule('old_rule');

// Entire groups
engine.disableGroup('marketing');
engine.enableGroup('marketing');

// Add a new rule at runtime
engine.addRule(
  Rule.create('flash_sale')
    .inGroup('marketing')
    .on('order.created')
    .whenGreaterThan('total', 100)
    .then('apply_discount', s => s.set('percent', 20))
);
```

### Flow Control

```javascript
// Stop the entire pipeline (remaining rules will not execute)
engine.registerAction('validate', async (ctx) => {
  if (!ctx.currentEvent.data.valid) {
    ctx.stopPipeline = true;
  }
});

// Skip only the remaining actions of the current rule
engine.registerAction('conditional_skip', async (ctx) => {
  if (someCondition) {
    ctx.skipRemainingActions = true;
  }
});
```

### Context — Sharing Data Between Actions

```javascript
engine.registerAction('calculate', async (ctx) => {
  ctx.set('total', 1500);
});

engine.registerAction('apply_tax', async (ctx) => {
  const total = ctx.get('total');
  ctx.set('totalWithTax', total * 1.18);
});

// When both run sequentially in the same event, they share data via context
```

### Reading Results

```javascript
const result = await engine.fire('order.created', e => e.set('total', 7500));

console.log('Fired:', result.firedRules.length);
console.log('Skipped:', result.skippedRules.length);
console.log('Pipeline stopped:', result.pipelineStopped);
console.log('Duration:', result.duration + 'ms');

result.firedRules.forEach(r => {
  console.log(`  ${r.ruleId} → ${r.executedActions.join(', ')}`);
});

result.skippedRules.forEach(r => {
  console.log(`  ${r.ruleId} → failed: ${r.failedConditions.join(', ')}`);
});
```

---

## React Usage

```jsx
import { AreEngine, Rule, GameEvent, AreContext } from 'are-engine-core';
import { useRef } from 'react';

function useAreEngine(setup) {
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new AreEngine();
    setup(engineRef.current);
  }

  const fire = async (eventType, data) => {
    const ctx = new AreContext();
    const evt = new GameEvent(eventType);
    Object.entries(data).forEach(([k, v]) => evt.set(k, v));
    return await engineRef.current.fire(evt, ctx);
  };

  return { fire, engine: engineRef.current };
}

// Usage
function App() {
  const { fire } = useAreEngine((engine) => {
    engine.registerAction('toast', async (ctx, s) => {
      ctx.set('toast', s.get('message'));
    });

    engine.addRule(
      Rule.create('big_order')
        .on('cart.checkout')
        .whenGreaterThan('total', 500)
        .then('toast', s => s.set('message', 'Free shipping!'))
    );
  });

  return <button onClick={() => fire('cart.checkout', { total: 700 })}>Checkout</button>;
}
```

---

## Export List

```javascript
const {
  AreEngine,      // Core engine
  AreContext,      // Shared data bag
  GameEvent,       // Default event implementation
  Rule,            // Fluent rule builder
  ActionSettings,  // Action parameters
  FieldCondition,  // Field comparison condition
  MatchMode,       // All, Any, None, ExactlyOne
  CompareOp,       // Equal, GreaterThan, Contains, In, etc.
} = require('are-engine-core');
```

---

## TypeScript Support

Type definitions (`are-core.d.ts`) are included in the package. No additional setup required.

```typescript
import { AreEngine, Rule, IAction, IEvent, AreContext, ActionSettings } from 'are-engine-core';

// Define a custom action type
const myAction: IAction = {
  actionType: 'my_action',
  execute: async (ctx: AreContext, settings: ActionSettings): Promise<void> => {
    const value = settings.get<string>('key');
    ctx.set('result', value);
  }
};
```

---

## Import Patterns

```javascript
// CommonJS (Node.js, Electron)
const { AreEngine, Rule } = require('are-engine-core');

// ES Module (React, Vue, Angular, Vite, Next.js)
import { AreEngine, Rule } from 'are-engine-core';

// Script tag (browser - global)
// You can use the dist/are-core.js file directly
```

---

## Tests

```bash
npm test
# or
node test/test.js
```

17 tests covering: engine, conditions, MatchMode, middleware, pipeline control, group management, and context sharing.

---

## License

MIT
