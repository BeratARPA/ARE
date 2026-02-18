# are-core — Action Rule Event Engine

Sıfır bağımlılık, hafif olay-kural-eylem motoru.

Browser, Node.js, React, Vue, React Native, Electron — her JS/TS ortamında çalışır.

> Bu paket, C# [ARE.Core](../ARE.Core/) motorunun JavaScript/TypeScript portudur.
> Aynı mimari, aynı API, aynı davranış.

---

## Kurulum

```bash
npm install are-engine-core
```

Build adımı yok. TypeScript tip tanımları dahil gelir.

---

## Hızlı Başlangıç

```javascript
const { AreEngine, Rule } = require('are-core');
// veya
// import { AreEngine, Rule } from 'are-core';

// 1) Engine oluştur
const engine = new AreEngine();

// 2) Action kaydet
engine.registerAction('send_email', async (ctx, s) => {
  console.log('Email gönderildi:', s.get('template'));
});

// 3) Kural tanımla
engine.addRule(
  Rule.create('vip_order')
    .on('order.created')
    .whenGreaterThan('total', 5000)
    .then('send_email', s => s.set('template', 'vip_welcome'))
);

// 4) Event fırlat
await engine.fire('order.created', e => e.set('total', 7500));
// Çıktı: Email gönderildi: vip_welcome
```

---

## Detaylı Kullanım

### Action Tanımlama — Obje ile

```javascript
const damageAction = {
  actionType: 'damage',
  execute: async (ctx, settings) => {
    const amount = settings.get('amount');
    console.log(`${amount} hasar verildi!`);
    ctx.set('lastDamage', amount);
  }
};

engine.registerAction(damageAction);
```

### Action Tanımlama — Inline

```javascript
engine.registerAction('log', async (ctx, s) => {
  console.log(s.get('message'));
});
```

### Kural Tanımlama — Fluent Builder

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

### Birden Fazla Event Dinleme

```javascript
Rule.create('license_warning')
  .on('app.started', 'license.checked')
  .when('expiring', (evt) => (evt.data.days_remaining ?? 999) <= 7)
  .then('show_notification', s => s
    .set('title', 'Lisans Uyarısı')
    .set('message', '7 gün kaldı!'))
```

### Koşul Tipleri

```javascript
// Alan karşılaştırma (deklaratif)
.whenEquals('status', 'active')
.whenGreaterThan('score', 100)
.whenLessThan('stock', 10)
.whenField('category', CompareOp.Contains, 'premium')
.whenField('role', CompareOp.In, ['admin', 'moderator'])

// Lambda (esnek)
.when('custom_check', (evt, ctx) => {
  return evt.data.total > 1000 && ctx.get('user_type') === 'vip';
})
```

### MatchMode — Koşul Eşleşme Modları

```javascript
const { MatchMode } = require('are-core');

// Tüm koşullar doğru olmalı (AND) — varsayılan
.withMatchMode(MatchMode.All)

// En az bir koşul doğru olmalı (OR)
.withMatchMode(MatchMode.Any)

// Hiçbir koşul doğru olmamalı (NOT)
.withMatchMode(MatchMode.None)

// Tam olarak bir koşul doğru olmalı
.withMatchMode(MatchMode.ExactlyOne)
```

### Middleware

```javascript
// Loglama
engine.use(0, async (ctx, next) => {
  console.log('Event başladı:', ctx.currentEvent.eventType);
  const start = Date.now();
  await next();
  console.log('Event bitti:', (Date.now() - start) + 'ms');
});

// Auth kontrolü
engine.use(-10, async (ctx, next) => {
  if (!ctx.get('isAuthenticated')) {
    ctx.stopPipeline = true;
    return;
  }
  await next();
});
```

### Doğrudan Listener (Kural Olmadan)

```javascript
engine.on('order.created', async (evt, ctx) => {
  console.log('Sipariş:', evt.data.order_id);
});
```

### Dinamik Kural Yönetimi

```javascript
// Tek kural
engine.disableRule('seasonal_discount');
engine.enableRule('seasonal_discount');
engine.removeRule('old_rule');

// Grup toplu
engine.disableGroup('marketing');
engine.enableGroup('marketing');

// Runtime'da yeni kural ekle
engine.addRule(
  Rule.create('flash_sale')
    .inGroup('marketing')
    .on('order.created')
    .whenGreaterThan('total', 100)
    .then('apply_discount', s => s.set('percent', 20))
);
```

### Akış Kontrolü

```javascript
// Pipeline'ı tamamen durdur (sonraki kurallar çalışmaz)
engine.registerAction('validate', async (ctx) => {
  if (!ctx.currentEvent.data.valid) {
    ctx.stopPipeline = true;
  }
});

// Sadece mevcut kuralın kalan action'larını atla
engine.registerAction('conditional_skip', async (ctx) => {
  if (someCondition) {
    ctx.skipRemainingActions = true;
  }
});
```

### Context — Action'lar Arası Veri Paylaşımı

```javascript
engine.registerAction('calculate', async (ctx) => {
  ctx.set('total', 1500);
});

engine.registerAction('apply_tax', async (ctx) => {
  const total = ctx.get('total');
  ctx.set('totalWithTax', total * 1.18);
});

// İkisi aynı event'te sırayla çalışırsa, context üzerinden veri paylaşır
```

### Sonuç Okuma

```javascript
const result = await engine.fire('order.created', e => e.set('total', 7500));

console.log('Tetiklenen:', result.firedRules.length);
console.log('Atlanan:', result.skippedRules.length);
console.log('Pipeline durdu mu:', result.pipelineStopped);
console.log('Süre:', result.duration + 'ms');

result.firedRules.forEach(r => {
  console.log(`  ${r.ruleId} → ${r.executedActions.join(', ')}`);
});

result.skippedRules.forEach(r => {
  console.log(`  ${r.ruleId} → sağlanmayan: ${r.failedConditions.join(', ')}`);
});
```

---

## React Kullanımı

```jsx
import { AreEngine, Rule, GameEvent, AreContext } from 'are-core';
import { useRef, useState } from 'react';

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

// Kullanım
function App() {
  const { fire } = useAreEngine((engine) => {
    engine.registerAction('toast', async (ctx, s) => {
      ctx.set('toast', s.get('message'));
    });

    engine.addRule(
      Rule.create('big_order')
        .on('cart.checkout')
        .whenGreaterThan('total', 500)
        .then('toast', s => s.set('message', '🎉 Kargo bedava!'))
    );
  });

  return <button onClick={() => fire('cart.checkout', { total: 700 })}>Ödeme;
}
```

---

## Export Listesi

```javascript
const {
  AreEngine,      // Çekirdek motor
  AreContext,      // Paylaşılan veri çantası
  GameEvent,       // Varsayılan event implementasyonu
  Rule,            // Fluent kural builder
  ActionSettings,  // Action parametreleri
  FieldCondition,  // Alan karşılaştırma koşulu
  MatchMode,       // All, Any, None, ExactlyOne
  CompareOp,       // Equal, GreaterThan, Contains, In vb.
} = require('are-core');
```

---

## TypeScript Desteği

Tip tanımları (`are-core.d.ts`) pakete dahildir. Ek kurulum gerekmez.

```typescript
import { AreEngine, Rule, IAction, IEvent, AreContext, ActionSettings } from 'are-core';

// Kendi action tipini tanımla
const myAction: IAction = {
  actionType: 'my_action',
  execute: async (ctx: AreContext, settings: ActionSettings): Promise => {
    const value = settings.get('key');
    ctx.set('result', value);
  }
};
```

---

## Farklı Ortamlarda Import

```javascript
// CommonJS (Node.js, Electron)
const { AreEngine, Rule } = require('are-core');

// ES Module (React, Vue, Angular, Vite, Next.js)
import { AreEngine, Rule } from 'are-core';

// Script tag (browser - global)
// dist/are-core.js dosyasını doğrudan kullanabilirsin

```

---

## Testler

```bash
npm test
# veya
node test/test.js
```

17 test: engine, koşullar, MatchMode, middleware, pipeline kontrolü, grup yönetimi, context paylaşımı.

---

## Lisans

MIT
