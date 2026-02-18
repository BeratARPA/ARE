using ARE.Core.Core;
using ARE.Core.Rules;

namespace ARE.Core.Tests
{
    public class EngineTests
    {
        private AreEngine CreateEngine()
        {
            var engine = new AreEngine();
            engine.RegisterAction("test_action", async (ctx, s) =>
            {
                ctx.Set("executed", true);
                ctx.Set("value", s.Get<string>("value") ?? "");
            });
            return engine;
        }

        [Fact]
        public async Task Fire_MatchingRule_ExecutesAction()
        {
            var engine = CreateEngine();
            engine.AddRule(
                Rule.Create("r1")
                    .On("test.event")
                    .Then("test_action", s => s.Set("value", "hello"))
            );

            var ctx = new AreContext();
            var result = await engine.FireAsync("test.event", context: ctx);

            Assert.Single(result.FiredRules);
            Assert.Equal("r1", result.FiredRules[0].RuleId);
            Assert.True(ctx.Get<bool>("executed"));
            Assert.Equal("hello", ctx.Get<string>("value"));
        }

        [Fact]
        public async Task Fire_NoMatchingEvent_SkipsAllRules()
        {
            var engine = CreateEngine();
            engine.AddRule(Rule.Create("r1").On("other.event").Then("test_action"));

            var result = await engine.FireAsync("test.event");

            Assert.Empty(result.FiredRules);
        }

        [Fact]
        public async Task Fire_DisabledRule_Skips()
        {
            var engine = CreateEngine();
            engine.AddRule(Rule.Create("r1").On("test.event").Disable().Then("test_action"));

            var result = await engine.FireAsync("test.event");

            Assert.Empty(result.FiredRules);
        }

        [Fact]
        public async Task Fire_PriorityOrder_HighFirst()
        {
            var order = new List<string>();
            var engine = new AreEngine();
            engine.RegisterAction("a", async (ctx, s) => order.Add("a"));
            engine.RegisterAction("b", async (ctx, s) => order.Add("b"));

            engine.AddRules(
                Rule.Create("low").On("e").WithPriority(1).Then("a"),
                Rule.Create("high").On("e").WithPriority(10).Then("b")
            );

            await engine.FireAsync("e");

            Assert.Equal(new[] { "b", "a" }, order);
        }

        [Fact]
        public async Task StopPipeline_StopsRemainingRules()
        {
            var engine = new AreEngine();
            engine.RegisterAction("stopper", async (ctx, s) => ctx.StopPipeline = true);
            engine.RegisterAction("never", async (ctx, s) => ctx.Set("should_not_run", true));

            engine.AddRules(
                Rule.Create("first").On("e").WithPriority(10).Then("stopper"),
                Rule.Create("second").On("e").WithPriority(1).Then("never")
            );

            var ctx = new AreContext();
            var result = await engine.FireAsync("e", context: ctx);

            Assert.True(result.PipelineStopped);
            Assert.False(ctx.Has("should_not_run"));
        }

        [Fact]
        public async Task Middleware_RunsBeforeAndAfter()
        {
            var order = new List<string>();
            var engine = new AreEngine();
            engine.RegisterAction("action", async (ctx, s) => order.Add("action"));
            engine.Use(0, async (ctx, next) =>
            {
                order.Add("before");
                await next();
                order.Add("after");
            });
            engine.AddRule(Rule.Create("r").On("e").Then("action"));

            await engine.FireAsync("e");

            Assert.Equal(new[] { "before", "action", "after" }, order);
        }

        [Fact]
        public async Task DirectListener_FiresWithoutRule()
        {
            var engine = new AreEngine();
            var fired = false;
            engine.On("test.event", async (evt, ctx) => fired = true);

            await engine.FireAsync("test.event");

            Assert.True(fired);
        }

        [Fact]
        public async Task GroupManagement_EnableDisable()
        {
            var engine = CreateEngine();
            engine.AddRules(
                Rule.Create("r1").InGroup("g1").On("e").Then("test_action"),
                Rule.Create("r2").InGroup("g1").On("e").Then("test_action")
            );

            engine.DisableGroup("g1");
            var result1 = await engine.FireAsync("e");
            Assert.Empty(result1.FiredRules);

            engine.EnableGroup("g1");
            var result2 = await engine.FireAsync("e");
            Assert.Equal(2, result2.FiredRules.Count);
        }

        [Fact]
        public async Task RemoveRule_Works()
        {
            var engine = CreateEngine();
            engine.AddRule(Rule.Create("r1").On("e").Then("test_action"));

            engine.RemoveRule("r1");
            var result = await engine.FireAsync("e");

            Assert.Empty(result.FiredRules);
        }
    }
}
