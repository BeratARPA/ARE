#  ARE — Action Rule Event Engine

[![NuGet](https://img.shields.io/nuget/v/ARE.Core.svg)](https://www.nuget.org/packages/ARE.Core/)
[![npm version](https://badge.fury.io/js/are-engine-core.svg)](https://www.npmjs.com/package/are-engine-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Sıfır bağımlılık, cross-platform, hafif olay-kural-eylem motoru.**

Oyun, web, mobil, masaüstü — tek motor, her yerde aynı mantık.

```
Event ───→ Middleware ───→ Rule Matching ───→ Action Execution
              │               │                    │
           before/after    conditions + matchMode  settings + context
                           priority + groups
```

---

## Ne İşe Yarar?

Projelerde sürekli tekrar eden bir kalıp var: *"Bir şey olduğunda, bazı koşullar sağlanıyorsa, şunları yap."*

ARE bu kalıbı tek bir motorla çözer:

| Kavram | Açıklama | Örnek |
|--------|----------|-------|
| **Event** | Olan biten şey | `order.created`, `player.died`, `user.login_failed` |
| **Rule** | Hangi event'te, hangi koşullarla, ne yapılacak | "Sipariş 5000₺ üstüyse VIP mail gönder" |
| **Condition** | Kuralın çalışıp çalışmayacağını belirler | `total > 5000`, `zone == "boss"`, `attempts >= 3` |
| **Action** | Yapılacak iş | E-posta gönder, hasar ver, stok güncelle, UI göster |
| **Middleware** | Pipeline'a araya girer | Loglama, auth kontrolü, audit |
| **Context** | Akış boyunca paylaşılan veri | Action'lar arası veri taşıma |

---

## Hızlı Başlangıç

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
const { AreEngine, Rule } = require('are-core');

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

---

## Özellikler

- **Sıfır bağımlılık** — Hiçbir harici paket kullanmaz
- **Fluent Builder** — `Rule.Create().On().When().Then()` zinciri
- **MatchMode** — `All` (AND), `Any` (OR), `None` (NOT), `ExactlyOne` (XOR)
- **9 karşılaştırma operatörü** — Equal, GreaterThan, Contains, In vb.
- **Middleware** — Before/after pipeline araya girme
- **Kural grupları** — Toplu enable/disable
- **Öncelik sırası** — Yüksek priority önce çalışır
- **Pipeline kontrolü** — `StopPipeline`, `SkipRemainingActions`
- **Dinamik yönetim** — Runtime'da kural ekle/kaldır/aç/kapat
- **Sonuç raporlama** — Hangi kurallar tetiklendi, hangileri neden atlandı
- **Async** — Tamamen asenkron pipeline

---

## Repo Yapısı

| Klasör | Açıklama |
|--------|----------|
| [`ARE.Core`](./ARE.Core) | Ana motor — NuGet paketi (C#) |
| [`are-core`](./are-core) | JavaScript/TypeScript portu — npm paketi |
| [`ARE.Core.Tests`](./ARE.Core.Tests) | xUnit testleri |
| [`ARE.Examples.Game`](./ARE.Examples.Game) | Oyun senaryosu örneği |
| [`ARE.Examples.WebApi`](./ARE.Examples.WebApi) | E-ticaret senaryosu örneği |
| [`ARE.Examples.Desktop`](./ARE.Examples.Desktop) | POS / masaüstü senaryosu örneği |

---

## Platform Desteği

| Platform | Paket |
|----------|-------|
| WinForms / WPF / MAUI | NuGet: `ARE.Core` |
| ASP.NET Core / Blazor | NuGet: `ARE.Core` |
| Unity / Godot | NuGet veya .dll (`netstandard2.1`) |
| Node.js / Express | npm: `are-core` |
| React / Vue / Angular | npm: `are-core` |
| React Native / Electron | npm: `are-core` |

---

## Kurulum

**C#:**
```bash
dotnet add package ARE.Core
```

**JavaScript:**
```bash
npm install are-engine-core
```

---

## Dokümantasyon

- [ARE.Core (C#) — Detaylı API ve kullanım](./ARE.Core/README.md)
- [are-core (JS/TS) — Detaylı API ve kullanım](./are-core/README.md)

---

## Lisans

MIT
