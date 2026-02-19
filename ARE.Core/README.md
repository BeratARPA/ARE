# ARE.Core — Action Rule Event Engine

Zero dependency, cross-platform, lightweight event-rule-action engine.

Game, web, mobile, desktop — same architecture, same logic everywhere.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        ARE ENGINE                            │
│                                                              │
│  Event ───→ Middleware ───→ Rule Matching ───→ Action Exec   │
│    │            │               │                  │         │
│  eventType    before          conditions         settings    │
│  data         after           matchMode          execute     │
│  timestamp    intercept       priority           context     │
│                               groups                         │
└──────────────────────────────────────────────────────────────┘
```

**Pipeline Flow:**

1. An **Event** is fired (e.g., `order.created`, `player.died`)
2. The **Middleware** chain runs (logging, auth, audit, etc.)
3. **Rules** matching the event type are found and sorted by priority
4. Each rule's **Conditions** are evaluated (according to its MatchMode)
5. If conditions are met, the rule's **Actions** execute in order
6. Throughout the entire flow, **Context** enables shared data between components

---

## Components

| Component | Role | Description |
|-----------|------|-------------|
| **IEvent** | Event | Something that happened in the system. Carries `eventType` + `data` + `timestamp` |
| **IAction** | Action | The work to be performed. Parameterized via `ActionSettings` |
| **ICondition** | Condition | Determines whether a rule should execute |
| **IRule** | Rule | The Event → Condition → Action binding. Contains group, priority, and MatchMode |
| **IMiddleware** | Middleware | Intercepts the pipeline before/after event processing |
| **AreContext** | Shared Data | Carries data across the entire pipeline between actions and rules |
| **ActionSettings** | Action Parameters | Key-value parameters specific to each action binding |
| **EngineResult** | Result | Reports which rules fired, which were skipped, and execution duration |

---

## MatchMode — Condition Matching Modes

| Mode | Description | Equivalent |
|------|-------------|------------|
| `All` | All conditions must be true | AND |
| `Any` | At least one condition must be true | OR |
| `None` | No conditions should be true | NOT |
| `ExactlyOne` | Exactly one condition must be true | XOR-like |

---

## CompareOp — Comparison Operators

| Operator | Description |
|----------|-------------|
| `Equal` | Equal to |
| `NotEqual` | Not equal to |
| `GreaterThan` | Greater than |
| `GreaterOrEqual` | Greater than or equal to |
| `LessThan` | Less than |
| `LessOrEqual` | Less than or equal to |
| `Contains` | Contains (string) |
| `StartsWith` | Starts with (string) |
| `In` | Exists in a list |

---

## Flow Control

| Property | Effect |
|----------|--------|
| `context.StopPipeline = true` | Stops the entire pipeline; remaining rules will not execute |
| `context.SkipRemainingActions = true` | Skips only the remaining actions of the current rule |

---

## Installation

```bash
dotnet add package ARE.Core
```

Or add to your `.csproj` file:

```xml
<PackageReference Include="ARE.Core" Version="1.0.0" />
```

---

## Quick Start

```csharp
using ARE.Core;

// 1) Create the engine
var engine = new AreEngine();

// 2) Register an action
engine.RegisterAction("send_email", async (ctx, s) =>
{
    var template = s.Get("template");
    Console.WriteLine($"Email sent: {template}");
});

// 3) Define a rule
engine.AddRule(
    Rule.Create("vip_order")
        .On("order.created")
        .WhenGreaterThan("total", 5000.0)
        .Then("send_email", s => s.Set("template", "vip_welcome"))
);

// 4) Fire an event
await engine.FireAsync("order.created", e => e.Set("total", 7500.0));
// Output: Email sent: vip_welcome
```

---

## Detailed Usage

### Defining an Action — Class-Based

```csharp
public class DamageAction : IAction
{
    public string ActionType => "damage";

    public Task ExecuteAsync(AreContext context, ActionSettings settings)
    {
        var amount = settings.Get("amount");
        var target = context.Get("target") ?? "player";
        Console.WriteLine($"{target} took {amount} damage!");
        context.Set("lastDamage", amount);
        return Task.CompletedTask;
    }
}

// Registration
engine.RegisterAction(new DamageAction());
```

### Defining an Action — Inline (Quick Prototyping)

```csharp
engine.RegisterAction("log", async (ctx, s) =>
{
    Console.WriteLine(s.Get("message"));
});
```

### Defining a Rule — Fluent Builder

```csharp
engine.AddRule(
    Rule.Create("boss_room_spawn")
        .InGroup("spawning")           // Group
        .WithPriority(10)              // Priority (higher = runs first)
        .On("player.enter_zone")       // Which event to listen for
        .WithMatchMode(MatchMode.All)  // All conditions must be met
        .WhenEquals("zone_type", "boss")
        .When("level_check", (evt, ctx) =>
        {
            var level = evt.Data.TryGetValue("player_level", out var l) ? (int)l : 0;
            return level >= 5;
        })
        .Then("spawn_enemy", s => s.Set("type", "dragon").Set("count", 1), order: 0)
        .Then("play_sound", s => s.Set("clip", "boss_roar"), order: 1)
);
```

### Listening to Multiple Events

```csharp
Rule.Create("license_warning")
    .On("app.started", "license.checked")  // Both events trigger this rule
    .When("expiring", (evt, _) =>
    {
        var days = evt.Data.TryGetValue("days_remaining", out var d) ? (int)d : 999;
        return days <= 7;
    })
    .Then("show_notification", s => s
        .Set("title", "License Warning")
        .Set("message", "7 days remaining!"))
```

### Middleware

```csharp
// Logging middleware
engine.Use(0, async (ctx, next) =>
{
    Console.WriteLine($"Event started: {ctx.CurrentEvent?.EventType}");
    var start = DateTime.UtcNow;
    await next();
    var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;
    Console.WriteLine($"Event completed: {elapsed:F1}ms");
});

// Auth middleware
engine.Use(-10, async (ctx, next) =>
{
    var isAuth = ctx.Get("is_authenticated");
    if (!isAuth)
    {
        ctx.StopPipeline = true;
        return;
    }
    await next();
});
```

### Direct Listener (Without Rules)

```csharp
engine.On("order.created", async (evt, ctx) =>
{
    Console.WriteLine($"Order received: {evt.Data["order_id"]}");
});
```

### Dynamic Rule Management

```csharp
// Enable/disable individual rules
engine.DisableRule("seasonal_discount");
engine.EnableRule("seasonal_discount");

// Enable/disable entire groups
engine.DisableGroup("marketing");
engine.EnableGroup("marketing");

// Remove a rule
engine.RemoveRule("old_rule");

// Add a new rule at runtime
engine.AddRule(
    Rule.Create("flash_sale")
        .InGroup("marketing")
        .On("order.created")
        .WhenGreaterThan("total", 100.0)
        .Then("apply_discount", s => s.Set("percent", 20))
);
```

### Reading Results

```csharp
var result = await engine.FireAsync("order.created", e => e.Set("total", 7500.0));

Console.WriteLine($"Fired: {result.FiredRules.Count}");
Console.WriteLine($"Skipped: {result.SkippedRules.Count}");
Console.WriteLine($"Pipeline stopped: {result.PipelineStopped}");
Console.WriteLine($"Duration: {result.Duration.TotalMilliseconds}ms");

foreach (var rule in result.FiredRules)
    Console.WriteLine($"  {rule.RuleId} → {string.Join(", ", rule.ExecutedActions)}");

foreach (var rule in result.SkippedRules)
    Console.WriteLine($"  {rule.RuleId} → failed: {string.Join(", ", rule.FailedConditions)}");
```

---

## Platform Support

| Platform | Package | Target |
|----------|---------|--------|
| WinForms / WPF | NuGet: `ARE.Core` | net6.0 / net7.0 / net8.0 |
| .NET MAUI (Mobile) | NuGet: `ARE.Core` | net6.0+ |
| ASP.NET Core | NuGet: `ARE.Core` | net6.0+ |
| Blazor | NuGet: `ARE.Core` | net6.0+ |
| Unity | NuGet or .dll | netstandard2.1 |
| Godot (.NET) | NuGet: `ARE.Core` | netstandard2.1 |
| Node.js / React / Vue | npm: `are-engine-core` | ES2020+ |
| React Native | npm: `are-engine-core` | ES2020+ |
| Electron | npm: `are-engine-core` | ES2020+ |

---

## Project Structure

```
ARE.Core/
├── Abstractions/              ← IEvent, IAction, ICondition, IRule, IMiddleware, Enums
├── Core/                      ← AreEngine, AreContext, GameEvent, ActionSettings
├── Conditions/                ← DataCondition, FieldCondition
├── Rules/                     ← Rule (fluent builder)
├── Results/                   ← EngineResult, RuleResult
└── Middleware/                ← InlineHelpers
```

---

## Packaging

**NuGet:**

```bash
cd ARE.Core
dotnet pack -c Release
# Output: bin/Release/ARE.Core.1.0.0.nupkg
```

**npm:**

```bash
cd are-core
npm pack
# Output: are-engine-core-1.0.0.tgz
```

---

## License

MIT
