using ARE.Core.Abstractions;
using ARE.Core.Core;
using ARE.Core.Rules;

namespace ARE.Examples.WebApi
{
    public class SendEmailAction : IAction
    {
        public string ActionType => "send_email";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var to = settings.Get<string>("to") ?? context.Get<string>("customer_email") ?? "";

            var template = settings.Get<string>("template") ?? "default";

            Console.WriteLine($"📧 E-posta gönderildi → {to} (şablon: {template})");

            return Task.CompletedTask;
        }
    }

    public class ApplyDiscountAction : IAction
    {
        public string ActionType => "apply_discount";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var percent = settings.Get<int>("percent");

            Console.WriteLine($"🏷 %{percent} indirim uygulandı!");

            context.Set("discount_applied", percent);

            return Task.CompletedTask;
        }
    }

    public class NotifySlackAction : IAction
    {
        public string ActionType => "notify_slack";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            var channel = settings.Get<string>("channel") ?? "#orders";

            var msg = settings.Get<string>("message") ?? "Bildirim";

            Console.WriteLine($"💬 Slack → {channel}: {msg}");

            return Task.CompletedTask;
        }
    }

    public class UpdateStockAction : IAction
    {
        public string ActionType => "update_stock";

        public Task ExecuteAsync(AreContext context, ActionSettings settings)
        {
            Console.WriteLine("📦 Stok güncellendi");

            return Task.CompletedTask;
        }
    }

    public class WebApiExample
    {
        public static async Task Run()
        {
            Console.WriteLine("\n═══════════════════════════════════════");

            Console.WriteLine("  ÖRNEK 2: E-TİCARET WEB API");

            Console.WriteLine("═══════════════════════════════════════\n");

            var engine = new AreEngine();

            engine.OnLog = Console.WriteLine;

            // Action'ları kaydet
            engine.RegisterAction(new SendEmailAction());

            engine.RegisterAction(new ApplyDiscountAction());

            engine.RegisterAction(new NotifySlackAction());

            engine.RegisterAction(new UpdateStockAction());

            // -- Kurallar --

            // Yüksek değerli sipariş → Slack bildirimi + VIP e-posta
            engine.AddRule(
                Rule.Create("high_value_order")
                    .InGroup("orders")
                    .WithPriority(10)
                    .On("order.created")
                    .WhenGreaterThan("total", 5000.0)
                    .Then("notify_slack", s => s
                        .Set("channel", "#vip-orders")
                        .Set("message", "💰 Yüksek değerli sipariş!"))
                    .Then("send_email", s => s.Set("template", "vip_welcome"))
            );

            // İlk sipariş → hoş geldin indirimi
            engine.AddRule(
                Rule.Create("first_order_discount")
                    .InGroup("marketing")
                    .WithPriority(5)
                    .On("order.created")
                    .WhenEquals("is_first_order", true)
                    .Then("apply_discount", s => s.Set("percent", 10))
                    .Then("send_email", s => s.Set("template", "first_order_welcome"))
            );

            // Stok düştüğünde (ANY mod: birden fazla ürün eşiğin altında olabilir)
            engine.AddRule(
                Rule.Create("low_stock_alert")
                    .InGroup("inventory")
                    .WithPriority(20)
                    .On("stock.updated")
                    .WhenLessThan("quantity", 10)
                    .Then("notify_slack", s => s
                        .Set("channel", "#inventory")
                        .Set("message", "⚠ Stok kritik seviyede!"))
                    .Then("send_email", s => s.Set("template", "low_stock_alert"))
            );

            // Sipariş iptal → stok geri yükle + müşteriye mail
            engine.AddRule(
                Rule.Create("order_cancelled")
                    .InGroup("orders")
                    .WithPriority(15)
                    .On("order.cancelled")
                    .Then("update_stock")
                    .Then("send_email", s => s.Set("template", "order_cancelled"))
                    .Then("notify_slack", s => s
                        .Set("channel", "#orders")
                        .Set("message", "❌ Sipariş iptal edildi"))
            );

            // -- Audit Middleware --
            engine.Use(0, async (ctx, next) =>
            {
                var evt = ctx.CurrentEvent!;

                Console.WriteLine($"📝 Audit: [{evt.Timestamp:HH:mm:ss}] {evt.EventType}");

                await next();
            });

            // ---- TEST ----

            Console.WriteLine("\n--- TEST 1: Yüksek değerli ilk sipariş ---");
            await engine.FireAsync("order.created", e => e
                .Set("total", 7500.0)
                .Set("is_first_order", true)
                .Set("customer_email", "ali@example.com"));

            Console.WriteLine("\n--- TEST 2: Normal sipariş ---");
            await engine.FireAsync("order.created", e => e
                .Set("total", 150.0)
                .Set("is_first_order", false));

            Console.WriteLine("\n--- TEST 3: Stok düştü ---");
            await engine.FireAsync("stock.updated", e => e
                .Set("product_id", "SKU-001")
                .Set("quantity", 5));

            Console.WriteLine("\n--- TEST 4: Sipariş iptal ---");
            await engine.FireAsync("order.cancelled", e => e
                .Set("order_id", "ORD-12345"));
        }
    }

    abstract class Program
    {
        static async Task Main(string[] args)
        {
            await WebApiExample.Run();
        }
    }
}