# ARE.Core — Action Rule Event Engine

Sıfır bağımlılık, cross-platform, hafif olay-kural-eylem motoru.

Oyun, web, mobil, masaüstü — her yerde aynı yapı, aynı mantık.

---

## Mimari

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

**Akış:**

1. Bir **Event** fırlatılır (örn: `order.created`, `player.died`)
2. **Middleware** zinciri çalışır (loglama, auth, audit vb.)
3. Event tipine uyan **Rule**'lar bulunur, önceliğe göre sıralanır
4. Her kuralın **Condition**'ları değerlendirilir (MatchMode'a göre)
5. Koşullar sağlanırsa kuralın **Action**'ları sırayla çalıştırılır
6. Tüm akış boyunca **Context** üzerinden veri paylaşılır

---

## Bileşenler

| Bileşen | Görev | Açıklama |
|---------|-------|----------|
| **IEvent** | Olay | Sistemde olan biten şey. `eventType` + `data` + `timestamp` taşır |
| **IAction** | Eylem | Yapılacak iş. `ActionSettings` ile parametrize edilir |
| **ICondition** | Koşul | Bir kuralın çalışıp çalışmayacağını belirler |
| **IRule** | Kural | Event → Condition → Action bağlantısı. Grup, öncelik, MatchMode içerir |
| **IMiddleware** | Ara katman | Event işlenmeden önce/sonra araya girer |
| **AreContext** | Paylaşılan veri | Tüm pipeline boyunca action'lar ve kurallar arası veri taşır |
| **ActionSettings** | Eylem ayarları | Her action bağlantısına özel key-value parametreler |
| **EngineResult** | Sonuç | Hangi kurallar tetiklendi, hangileri atlandı, süre bilgisi |

---

## MatchMode — Koşul Eşleşme Modları

| Mod | Açıklama | Karşılık |
|-----|----------|----------|
| `All` | Tüm koşullar doğru olmalı | AND |
| `Any` | En az bir koşul doğru olmalı | OR |
| `None` | Hiçbir koşul doğru olmamalı | NOT |
| `ExactlyOne` | Tam olarak bir koşul doğru olmalı | XOR benzeri |

---

## CompareOp — Karşılaştırma Operatörleri

| Operatör | Açıklama |
|----------|----------|
| `Equal` | Eşit |
| `NotEqual` | Eşit değil |
| `GreaterThan` | Büyük |
| `GreaterOrEqual` | Büyük veya eşit |
| `LessThan` | Küçük |
| `LessOrEqual` | Küçük veya eşit |
| `Contains` | İçeriyor (string) |
| `StartsWith` | İle başlıyor (string) |
| `In` | Liste içinde var |

---

## Akış Kontrolü

| Özellik | Etki |
|---------|------|
| `context.StopPipeline = true` | Tüm pipeline durur, kalan kurallar çalışmaz |
| `context.SkipRemainingActions = true` | Sadece mevcut kuralın kalan action'ları atlanır |

---

## Kurulum

```bash
dotnet add package ARE.Core
```

Veya `.csproj` dosyasına:

```xml

```

---

## Hızlı Başlangıç

```csharp
using ARE.Core;

// 1) Engine oluştur
var engine = new AreEngine();

// 2) Action kaydet
engine.RegisterAction("send_email", async (ctx, s) =>
{
    var template = s.Get("template");
    Console.WriteLine($"Email gönderildi: {template}");
});

// 3) Kural tanımla
engine.AddRule(
    Rule.Create("vip_order")
        .On("order.created")
        .WhenGreaterThan("total", 5000.0)
        .Then("send_email", s => s.Set("template", "vip_welcome"))
);

// 4) Event fırlat
await engine.FireAsync("order.created", e => e.Set("total", 7500.0));
// Çıktı: Email gönderildi: vip_welcome
```

---

## Detaylı Kullanım

### Action Tanımlama — Sınıf ile

```csharp
public class DamageAction : IAction
{
    public string ActionType => "damage";

    public Task ExecuteAsync(AreContext context, ActionSettings settings)
    {
        var amount = settings.Get("amount");
        var target = context.Get("target") ?? "player";
        Console.WriteLine($"{target} → {amount} hasar aldı!");
        context.Set("lastDamage", amount);
        return Task.CompletedTask;
    }
}

// Kayıt
engine.RegisterAction(new DamageAction());
```

### Action Tanımlama — Inline (Hızlı Prototipleme)

```csharp
engine.RegisterAction("log", async (ctx, s) =>
{
    Console.WriteLine(s.Get("message"));
});
```

### Kural Tanımlama — Fluent Builder

```csharp
engine.AddRule(
    Rule.Create("boss_room_spawn")
        .InGroup("spawning")           // Grup
        .WithPriority(10)              // Öncelik (yüksek = önce)
        .On("player.enter_zone")       // Hangi event
        .WithMatchMode(MatchMode.All)  // Tüm koşullar sağlanmalı
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

### Birden Fazla Event Dinleme

```csharp
Rule.Create("license_warning")
    .On("app.started", "license.checked")  // İki event de tetikler
    .When("expiring", (evt, _) =>
    {
        var days = evt.Data.TryGetValue("days_remaining", out var d) ? (int)d : 999;
        return days <= 7;
    })
    .Then("show_notification", s => s
        .Set("title", "Lisans Uyarısı")
        .Set("message", "7 gün kaldı!"))
```

### Middleware

```csharp
// Loglama middleware'i
engine.Use(0, async (ctx, next) =>
{
    Console.WriteLine($"Event başladı: {ctx.CurrentEvent?.EventType}");
    var start = DateTime.UtcNow;
    await next();
    var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;
    Console.WriteLine($"Event bitti: {elapsed:F1}ms");
});

// Auth middleware'i
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

### Doğrudan Listener (Kural Olmadan)

```csharp
engine.On("order.created", async (evt, ctx) =>
{
    Console.WriteLine($"Sipariş geldi: {evt.Data["order_id"]}");
});
```

### Dinamik Kural Yönetimi

```csharp
// Tek kural aç/kapat
engine.DisableRule("seasonal_discount");
engine.EnableRule("seasonal_discount");

// Grup toplu aç/kapat
engine.DisableGroup("marketing");
engine.EnableGroup("marketing");

// Kural kaldır
engine.RemoveRule("old_rule");

// Runtime'da yeni kural ekle
engine.AddRule(
    Rule.Create("flash_sale")
        .InGroup("marketing")
        .On("order.created")
        .WhenGreaterThan("total", 100.0)
        .Then("apply_discount", s => s.Set("percent", 20))
);
```

### Sonuç Okuma

```csharp
var result = await engine.FireAsync("order.created", e => e.Set("total", 7500.0));

Console.WriteLine($"Tetiklenen: {result.FiredRules.Count}");
Console.WriteLine($"Atlanan: {result.SkippedRules.Count}");
Console.WriteLine($"Pipeline durdu mu: {result.PipelineStopped}");
Console.WriteLine($"Süre: {result.Duration.TotalMilliseconds}ms");

foreach (var rule in result.FiredRules)
    Console.WriteLine($"  {rule.RuleId} → {string.Join(", ", rule.ExecutedActions)}");

foreach (var rule in result.SkippedRules)
    Console.WriteLine($"  {rule.RuleId} → sağlanmayan: {string.Join(", ", rule.FailedConditions)}");
```

---

## Platform Desteği

| Platform | Paket | Hedef |
|----------|-------|-------|
| WinForms / WPF | NuGet: `ARE.Core` | net6.0 / net7.0 / net8.0 |
| .NET MAUI (Mobil) | NuGet: `ARE.Core` | net6.0+ |
| ASP.NET Core | NuGet: `ARE.Core` | net6.0+ |
| Blazor | NuGet: `ARE.Core` | net6.0+ |
| Unity | NuGet veya .dll | netstandard2.1 |
| Godot (.NET) | NuGet: `ARE.Core` | netstandard2.1 |
| Node.js / React / Vue | npm: `are-core` | ES2020+ |
| React Native | npm: `are-core` | ES2020+ |
| Electron | npm: `are-core` | ES2020+ |

---

## Proje Yapısı

```
ARE.Core/
├── ARE.Core.sln
├── README.md
├── LICENSE
│
├── src/
│   ├── ARE.Core/                      ← NuGet paketi (C#)
│   │   ├── Abstractions/              ← IEvent, IAction, ICondition, IRule, IMiddleware, Enums
│   │   ├── Core/                      ← AreEngine, AreContext, GameEvent, ActionSettings
│   │   ├── Conditions/                ← DataCondition, FieldCondition
│   │   ├── Rules/                     ← Rule (fluent builder)
│   │   ├── Results/                   ← EngineResult, RuleResult
│   │   └── Middleware/                ← InlineHelpers
│   │
│   └── are-core/                      ← npm paketi (JS/TS)
│       ├── dist/                      ← Hazır JS + tip tanımları
│       └── test/                      ← Testler
│
├── examples/
│   ├── ARE.Examples.Game/             ← Oyun senaryosu
│   ├── ARE.Examples.WebApi/           ← E-ticaret senaryosu
│   ├── ARE.Examples.Desktop/          ← POS / masaüstü senaryosu
│   └── js-examples/                   ← React örneği
│
└── tests/
    └── ARE.Core.Tests/                ← xUnit testleri
```

---

## Paketleme

**NuGet:**

```bash
cd src/ARE.Core
dotnet pack -c Release
# Çıktı: bin/Release/ARE.Core.1.0.0.nupkg
```

**npm:**

```bash
cd src/are-core
npm pack
# Çıktı: are-core-1.0.0.tgz
```

---

## Lisans

MIT