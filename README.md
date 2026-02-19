# ARE — Action Rule Event Engine

[![NuGet](https://img.shields.io/nuget/v/ARE.Core.svg)](https://www.nuget.org/packages/ARE.Core/)
[![npm version](https://badge.fury.io/js/are-engine-core.svg)](https://www.npmjs.com/package/are-engine-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Zero dependency, cross-platform, lightweight event-rule-action engine.**

Game, web, mobile, desktop — one engine, same logic everywhere.

```
Event ───→ Middleware ───→ Rule Matching ───→ Action Execution
              │               │                    │
           before/after    conditions + matchMode  settings + context
                           priority + groups
```

---

## What Does It Do?

There is a recurring pattern in every project: *"When something happens, if certain conditions are met, do these things."*

ARE solves this pattern with a single engine:

| Concept | Description | Example |
|---------|-------------|---------|
| **Event** | Something that happened | `order.created`, `player.died`, `user.login_failed` |
| **Rule** | Which event, which conditions, what to do | "If order exceeds $5000, send VIP email" |
| **Condition** | Determines whether a rule should execute | `total > 5000`, `zone == "boss"`, `attempts >= 3` |
| **Action** | The work to be performed | Send email, deal damage, update stock, show UI |
| **Middleware** | Intercepts the pipeline | Logging, auth checks, audit trails |
| **Context** | Shared data throughout the flow | Passing data between actions |

---

## Quick Start

### C# (.NET)

```csharp
var engine = new AreEngine();

engine.RegisterAction("send_email", async (ctx, s) =>
{
    Console.WriteLine($"Email: {s.Get("template")}");
});

engine.AddRule(
    Rule.Create("vip_order")
        .On("order.created")
        .WhenGreaterThan("total", 5000.0)
        .Then("send_email", s => s.Set("template", "vip_welcome"))
);

await engine.FireAsync("order.created", e => e.Set("total", 7500.0));
// → Email: vip_welcome
```

### JavaScript / TypeScript

```javascript
const { AreEngine, Rule } = require('are-engine-core');

const engine = new AreEngine();

engine.registerAction('send_email', async (ctx, s) => {
  console.log('Email:', s.get('template'));
});

engine.addRule(
  Rule.create('vip_order')
    .on('order.created')
    .whenGreaterThan('total', 5000)
    .then('send_email', s => s.set('template', 'vip_welcome'))
);

await engine.fire('order.created', e => e.set('total', 7500));
// → Email: vip_welcome
```

### Dart / Flutter

```dart
import 'package:are_engine_core/are_engine_core.dart';

final engine = AreEngine();

engine.registerInlineAction('send_email', (ctx, s) async {
  print('Email: ${s.get<String>('template')}');
});

engine.addRule(
  Rule.create('vip_order')
      .on('order.created')
      .whenGreaterThan('total', 5000.0)
      .then('send_email', (s) => s.set('template', 'vip_welcome')),
);

await engine.fire('order.created', (e) => e.set('total', 7500.0));
// → Email: vip_welcome
```

---

## Features

- **Zero dependency** — No external packages required
- **Fluent Builder** — `Rule.Create().On().When().Then()` chaining
- **MatchMode** — `All` (AND), `Any` (OR), `None` (NOT), `ExactlyOne` (XOR)
- **9 comparison operators** — Equal, GreaterThan, Contains, In, and more
- **Middleware** — Before/after pipeline interception
- **Rule groups** — Bulk enable/disable
- **Priority ordering** — Higher priority rules execute first
- **Pipeline control** — `StopPipeline`, `SkipRemainingActions`
- **Dynamic management** — Add/remove/enable/disable rules at runtime
- **Result reporting** — Which rules fired, which were skipped and why
- **Async** — Fully asynchronous pipeline

---

## Repository Structure

| Folder | Description |
|--------|-------------|
| [`ARE.Core`](./ARE.Core) | Core engine — NuGet package (C#) |
| [`are-core`](./are-core) | JavaScript/TypeScript port — npm package |
| [`ARE.Core.Tests`](./ARE.Core.Tests) | xUnit tests |
| [`ARE.Examples.Game`](./ARE.Examples.Game) | Game scenario example (C#) |
| [`ARE.Examples.WebApi`](./ARE.Examples.WebApi) | E-commerce scenario example (C#) |
| [`ARE.Examples.Desktop`](./ARE.Examples.Desktop) | POS / desktop scenario example (C#) |
| [`are_engine_core`](./are_engine_core) | Dart/Flutter port — pub.dev package |
| [`are-core/examples`](./are-core/examples) | JavaScript examples (Game, E-commerce, Desktop) |

---

## Platform Support

| Platform | Package |
|----------|---------|
| WinForms / WPF / MAUI | NuGet: `ARE.Core` |
| ASP.NET Core / Blazor | NuGet: `ARE.Core` |
| Unity / Godot | NuGet or .dll (`netstandard2.1`) |
| Node.js / Express | npm: `are-engine-core` |
| React / Vue / Angular | npm: `are-engine-core` |
| React Native / Electron | npm: `are-engine-core` |
| Flutter (iOS / Android / Web) | pub: `are_engine_core` |
| Dart CLI / Server | pub: `are_engine_core` |

---

## Installation

**C#:**
```bash
dotnet add package ARE.Core
```

**JavaScript:**
```bash
npm install are-engine-core
```

**Dart / Flutter:**
```yaml
dependencies:
  are_engine_core: ^1.0.0
```

---

## Documentation

- [ARE.Core (C#) — Detailed API & Usage](./ARE.Core/README.md)
- [are-engine-core (JS/TS) — Detailed API & Usage](./are-core/README.md)
- [are_engine_core (Dart/Flutter) — Detailed API & Usage](./are_engine_core/README.md)

---

## License

MIT
