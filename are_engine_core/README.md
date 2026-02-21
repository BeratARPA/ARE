# are_engine_core — Action Rule Event Engine

Zero dependency, lightweight event-rule-action engine for Dart & Flutter.

> This package is the Dart port of the C# [ARE.Core](../ARE.Core/) engine.
> Same architecture, same API, same behavior.

---

## Installation

```yaml
dependencies:
  are_engine_core: ^1.0.2
```

```bash
dart pub get
```

---

## Quick Start

```dart
import 'package:are_engine_core/are_engine_core.dart';

void main() async {
  final engine = AreEngine();

  // Register an action
  engine.registerInlineAction('send_email', (ctx, s) async {
    print('Email sent: ${s.get<String>('template')}');
  });

  // Define a rule
  engine.addRule(
    Rule.create('vip_order')
        .on('order.created')
        .whenGreaterThan('total', 5000.0)
        .then('send_email', (s) => s.set('template', 'vip_welcome')),
  );

  // Fire an event
  await engine.fire('order.created', (e) => e.set('total', 7500.0));
  // Output: Email sent: vip_welcome
}
```

---

## Detailed Usage

### Defining an Action — Class-Based

```dart
class DamageAction implements IAction {
  @override
  String get actionType => 'damage';

  @override
  Future<void> execute(AreContext context, ActionSettings settings) async {
    final amount = settings.get<int>('amount') ?? 0;
    final target = context.get<String>('target') ?? 'player';
    print('$target took $amount damage!');
    context.set('lastDamage', amount);
  }
}

// Registration
engine.registerAction(DamageAction());
```

### Defining an Action — Inline (Quick Prototyping)

```dart
engine.registerInlineAction('log', (ctx, s) async {
  print(s.get<String>('message'));
});
```

### Defining a Rule — Fluent Builder

```dart
engine.addRule(
  Rule.create('boss_room_spawn')
      .inGroup('spawning')
      .withPriority(10)
      .on('player.enter_zone')
      .withMatchMode(MatchMode.all)
      .whenEquals('zone_type', 'boss')
      .when('level_check', (evt, ctx) {
        final level = evt.data['player_level'] ?? 0;
        return level >= 5;
      })
      .then('spawn_enemy', (s) => s.set('type', 'dragon').set('count', 1), 0)
      .then('play_sound', (s) => s.set('clip', 'boss_roar'), 1),
);
```

### Listening to Multiple Events

```dart
Rule.create('license_warning')
    .on('app.started', 'license.checked')
    .when('expiring', (evt, ctx) {
      final days = evt.data['days_remaining'] ?? 999;
      return days <= 7;
    })
    .then('show_notification', (s) => s
        .set('title', 'License Warning')
        .set('message', '7 days remaining!'));
```

### Condition Types

```dart
// Field comparison (declarative)
.whenEquals('status', 'active')
.whenGreaterThan('score', 100)
.whenLessThan('stock', 10)
.whenField('category', CompareOp.contains, 'premium')
.whenField('role', CompareOp.inList, ['admin', 'moderator'])

// Lambda (flexible)
.when('custom_check', (evt, ctx) {
  return evt.data['total'] > 1000 && ctx.get<String>('user_type') == 'vip';
})
```

### MatchMode — Condition Matching Modes

```dart
// All conditions must be true (AND) — default
.withMatchMode(MatchMode.all)

// At least one condition must be true (OR)
.withMatchMode(MatchMode.any)

// No conditions should be true (NOT)
.withMatchMode(MatchMode.none)

// Exactly one condition must be true
.withMatchMode(MatchMode.exactlyOne)
```

### Middleware

```dart
// Logging middleware
engine.use(0, (ctx, next) async {
  print('Event started: ${ctx.currentEvent?.eventType}');
  final start = DateTime.now();
  await next();
  final elapsed = DateTime.now().difference(start).inMilliseconds;
  print('Event completed: ${elapsed}ms');
});

// Auth middleware
engine.use(-10, (ctx, next) async {
  if (ctx.get<bool>('isAuthenticated') != true) {
    ctx.stopPipeline = true;
    return;
  }
  await next();
});
```

### Direct Listener (Without Rules)

```dart
engine.on('order.created', (evt, ctx) async {
  print('Order received: ${evt.data['order_id']}');
});
```

### Dynamic Rule Management

```dart
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
      .whenGreaterThan('total', 100.0)
      .then('apply_discount', (s) => s.set('percent', 20)),
);
```

### Flow Control

```dart
// Stop the entire pipeline (remaining rules will not execute)
engine.registerInlineAction('validate', (ctx, s) async {
  if (ctx.currentEvent!.data['valid'] != true) {
    ctx.stopPipeline = true;
  }
});

// Skip only the remaining actions of the current rule
engine.registerInlineAction('conditional_skip', (ctx, s) async {
  if (someCondition) {
    ctx.skipRemainingActions = true;
  }
});
```

### Context — Sharing Data Between Actions

```dart
engine.registerInlineAction('calculate', (ctx, s) async {
  ctx.set('total', 1500);
});

engine.registerInlineAction('apply_tax', (ctx, s) async {
  final total = ctx.get<int>('total')!;
  ctx.set('totalWithTax', total * 1.18);
});

// When both run sequentially in the same event, they share data via context
```

### Reading Results

```dart
final result = await engine.fire('order.created', (e) => e.set('total', 7500));

print('Fired: ${result.firedRules.length}');
print('Skipped: ${result.skippedRules.length}');
print('Pipeline stopped: ${result.pipelineStopped}');
print('Duration: ${result.duration.inMilliseconds}ms');

for (final r in result.firedRules) {
  print('  ${r.ruleId} → ${r.executedActions.join(', ')}');
}

for (final r in result.skippedRules) {
  print('  ${r.ruleId} → failed: ${r.failedConditions.join(', ')}');
}
```

---

## Export List

```dart
import 'package:are_engine_core/are_engine_core.dart';

// Classes: AreEngine, AreContext, GameEvent, Rule, ActionSettings,
//          FieldCondition, DataCondition, ActionBinding
// Results: EngineResult, RuleResult
// Enums:   MatchMode, CompareOp
// Interfaces: IEvent, IAction, ICondition, IMiddleware, IRule
```

---

## Tests

```bash
dart test
```

17 tests covering: engine, conditions, MatchMode, middleware, pipeline control, group management, context sharing, and result reporting.

---

## License

MIT
