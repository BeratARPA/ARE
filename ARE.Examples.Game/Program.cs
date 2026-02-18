using ARE.Core.Abstractions;
using ARE.Core.Abstractions.Enums;
using ARE.Core.Core;
using ARE.Core.Rules;

namespace ARE.Examples.Game
{
    // -- Özel Action'lar --
    public class DamageAction : IAction
    {
        public string ActionType => "damage";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var amount = settings.Get<int>("amount");

            var target = context.Get<string>("target") ?? "player";

            Console.WriteLine($"💥 {target} → {amount} hasar aldı!");

            // Oyunda: player.Health -= amount;
            context.Set("lastDamage", amount);

            return Task.CompletedTask;
        }
    }

    public class SpawnEnemyAction : IAction
    {
        public string ActionType => "spawn_enemy";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var enemyType = settings.Get<string>("type") ?? "goblin";

            var count = settings.Get<int>("count");

            if (count == 0) count = 1;

            Console.WriteLine($"👾 {count}x {enemyType} spawn edildi!");

            return Task.CompletedTask;
        }
    }

    public class PlaySoundAction : IAction
    {
        public string ActionType => "play_sound";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var sound = settings.Get<string>("clip") ?? "default";

            Console.WriteLine($"🔊 Ses çalındı: {sound}");

            return Task.CompletedTask;
        }
    }

    public class ShowUIAction : IAction
    {
        public string ActionType => "show_ui";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var panel = settings.Get<string>("panel") ?? "info";

            var message = settings.Get<string>("message") ?? "";

            Console.WriteLine($"📋 UI Gösterildi: [{panel}] {message}");

            return Task.CompletedTask;
        }
    }

    public class GameExample
    {
        public static async Task Run()
        {
            Console.WriteLine("═══════════════════════════════════════");

            Console.WriteLine("  ÖRNEK 1: OYUN MOTORU");

            Console.WriteLine("═══════════════════════════════════════\n");

            var engine = new AreEngine();

            engine.OnLog = Console.WriteLine;

            // -- Action'ları kaydet --
            engine.RegisterAction(new DamageAction());

            engine.RegisterAction(new SpawnEnemyAction());

            engine.RegisterAction(new PlaySoundAction());

            engine.RegisterAction(new ShowUIAction());

            // -- Kuralları tanımla --

            // Kural 1: Oyuncu ateş bölgesine girerse hasar al + ses çal
            engine.AddRule(
                Rule.Create("fire_zone_damage")
                    .InGroup("combat")
                    .WithPriority(10)
                    .On("player.enter_zone")
                    .WhenEquals("zone_type", "fire")
                    .Then("damage", s => s.Set("amount", 25), order: 0)
                    .Then("play_sound", s => s.Set("clip", "fire_burn"), order: 1)
            );

            // Kural 2: Boss bölgesine girildiğinde düşman spawn et
            engine.AddRule(
                Rule.Create("boss_room_spawn")
                    .InGroup("spawning")
                    .WithPriority(5)
                    .On("player.enter_zone")
                    .WithMatchMode(MatchMode.All)
                    .WhenEquals("zone_type", "boss")
                    .When("level_check", (evt, ctx) =>
                    {
                        var level = evt.Data.TryGetValue("player_level", out var l) ? (int)l : 0;

                        return level >= 5;
                    })
                    .Then("spawn_enemy", s => s.Set("type", "dragon").Set("count", 1))
                    .Then("play_sound", s => s.Set("clip", "boss_roar"))
                    .Then("show_ui", s => s.Set("panel", "boss_health").Set("message", "🐉 Ejderha belirdi!"))
            );

            // Kural 3: Oyuncu öldüğünde (ANY mod - birden fazla ölüm sebebi)
            engine.AddRule(
                Rule.Create("player_death_effects")
                    .InGroup("death")
                    .WithPriority(100) // En yüksek öncelik
                    .On("player.health_changed")
                    .When("is_dead", (evt, ctx) =>
                    {
                        var hp = evt.Data.TryGetValue("health", out var h) ? (int)h : 100;

                        return hp <= 0;
                    })
                    .Then("play_sound", s => s.Set("clip", "death_sound"))
                    .Then("show_ui", s => s.Set("panel", "game_over").Set("message", "Öldün!"))
            );

            // -- Middleware: Her event'i logla --
            engine.Use(0, async (ctx, next) =>
            {
                var start = DateTime.UtcNow;

                Console.WriteLine($"\n⏱ Middleware: Event başlıyor -> {ctx.CurrentEvent?.EventType}");

                await next();

                var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;

                Console.WriteLine($"⏱ Middleware: Event bitti ({elapsed:F1}ms)\n");
            });

            // ---- TEST: Event'leri fırlat ----

            Console.WriteLine("\n--- TEST 1: Ateş bölgesine giriş ---");
            await engine.FireAsync("player.enter_zone", e => e
                .Set("zone_type", "fire")
                .Set("player_level", 3));

            Console.WriteLine("\n--- TEST 2: Boss bölgesine giriş (düşük level) ---");
            await engine.FireAsync("player.enter_zone", e => e
                .Set("zone_type", "boss")
                .Set("player_level", 3)); // level < 5, spawn olmayacak

            Console.WriteLine("\n--- TEST 3: Boss bölgesine giriş (yeterli level) ---");
            await engine.FireAsync("player.enter_zone", e => e
                .Set("zone_type", "boss")
                .Set("player_level", 7)); // level >= 5, dragon spawn!

            Console.WriteLine("\n--- TEST 4: Oyuncu ölümü ---");
            await engine.FireAsync("player.health_changed", e => e
                .Set("health", 0)
                .Set("cause", "fire"));
        }
    }

    abstract class Program
    {
        static async Task Main(string[] args)
        {
            await GameExample.Run();
        }
    }
}