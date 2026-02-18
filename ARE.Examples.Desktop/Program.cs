using ARE.Core.Abstractions;
using ARE.Core.Core;
using ARE.Core.Rules;

namespace ARE.Examples.Desktop
{
    public class ShowNotificationAction : IAction
    {
        public string ActionType => "show_notification";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var title = settings.Get<string>("title") ?? "Bildirim";

            var msg = settings.Get<string>("message") ?? "";

            var severity = settings.Get<string>("severity") ?? "info";

            Console.WriteLine($"🔔 [{severity.ToUpper()}] {title}: {msg}");

            return Task.CompletedTask;
        }
    }

    public class SaveLogAction : IAction
    {
        public string ActionType => "save_log";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var entry = settings.Get<string>("entry") ?? context.CurrentEvent?.EventType ?? "";

            Console.WriteLine($"📄 Log kaydedildi: {entry}");

            return Task.CompletedTask;
        }
    }

    public class LockFormAction : IAction
    {
        public string ActionType => "lock_form";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var reason = settings.Get<string>("reason") ?? "";

            Console.WriteLine($"🔒 Form kilitlendi: {reason}");

            return Task.CompletedTask;
        }
    }

    public class DesktopExample
    {
        public static async Task Run()
        {
            Console.WriteLine("\n═══════════════════════════════════════");

            Console.WriteLine("  ÖRNEK 3: MASAÜSTÜ (POS / ERP)");

            Console.WriteLine("═══════════════════════════════════════\n");

            var engine = new AreEngine();

            engine.OnLog = Console.WriteLine;

            engine.RegisterAction(new ShowNotificationAction());

            engine.RegisterAction(new SaveLogAction());

            engine.RegisterAction(new LockFormAction());

            // 3 başarısız giriş → formu kilitle
            engine.AddRule(
                Rule.Create("login_lockout")
                    .WithPriority(100)
                    .On("user.login_failed")
                    .When("attempt_check", (evt, ctx) =>
                    {
                        var attempts = evt.Data.TryGetValue("attempt_count", out var a) ? (int)a : 0;

                        return attempts >= 3;
                    })
                    .Then("lock_form", s => s.Set("reason", "3 başarısız giriş denemesi"))
                    .Then("save_log", s => s.Set("entry", "Hesap kilitlendi - çok fazla deneme"))
                    .Then("show_notification", s => s
                        .Set("title", "Hesap Kilitlendi")
                        .Set("message", "3 başarısız giriş. 5dk bekleyin.")
                        .Set("severity", "error"))
            );

            // Lisans süresi dolmak üzere
            engine.AddRule(
                Rule.Create("license_expiring")
                    .WithPriority(50)
                    .On("app.started", "license.checked")
                    .When("expiring_soon", (evt, ctx) =>
                    {
                        var days = evt.Data.TryGetValue("days_remaining", out var d) ? (int)d : 999;

                        return days <= 7;
                    })
                    .Then("show_notification", s => s
                        .Set("title", "Lisans Uyarısı")
                        .Set("message", "Lisansınız 7 gün içinde dolacak!")
                        .Set("severity", "warning"))
            );

            // ---- TEST ----
            Console.WriteLine("\n--- TEST 1: 3. başarısız giriş ---");
            await engine.FireAsync("user.login_failed", e => e
                .Set("attempt_count", 3)
                .Set("username", "admin"));

            Console.WriteLine("\n--- TEST 2: Lisans kontrolü ---");
            await engine.FireAsync("app.started", e => e
                .Set("days_remaining", 5));
        }
    }

    abstract class Program
    {
        static async Task Main(string[] args)
        {
            await DesktopExample.Run();
        }
    }
}