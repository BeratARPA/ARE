using ARE.Core.Abstractions;
using ARE.Core.Abstractions.Enums;
using ARE.Core.Results;
using ARE.Core.Rules;

namespace ARE.Core.Core
{
    public class AreEngine
    {
        // Registry'ler
        private readonly Dictionary<string, IAction> _actions = new();

        private readonly List<IRule> _rules = new();

        private readonly List<IMiddleware> _middlewares = new();

        // Event listeners (doğrudan dinleme - kural olmadan)
        private readonly Dictionary<string, List<Func<IEvent, AreContext, Task>>> _listeners = new();

        // Logging hook
        public Action<string>? OnLog { get; set; }

        // ---- Kayıt (Registration) ----

        /// <summary>Action tipi kaydet</summary>
        public AreEngine RegisterAction(IAction action)
        {
            _actions[action.ActionType] = action;

            return this;
        }

        /// <summary>Inline action kaydet (hızlı prototipleme)</summary>
        public AreEngine RegisterAction(string actionType, Func<AreContext, ActionSettings, Task> handler)
        {
            _actions[actionType] = new InlineAction(actionType, handler);

            return this;
        }

        /// <summary>Kural ekle</summary>
        public AreEngine AddRule(IRule rule)
        {
            _rules.Add(rule);

            return this;
        }

        /// <summary>Birden fazla kural ekle</summary>
        public AreEngine AddRules(params IRule[] rules)
        {
            _rules.AddRange(rules);

            return this;
        }

        /// <summary>Middleware ekle</summary>
        public AreEngine UseMiddleware(IMiddleware middleware)
        {
            _middlewares.Add(middleware);

            _middlewares.Sort((a, b) => a.Order.CompareTo(b.Order));

            return this;
        }

        /// <summary>Inline middleware ekle</summary>
        public AreEngine Use(int order, Func<AreContext, Func<Task>, Task> handler)
        {
            _middlewares.Add(new InlineMiddleware(order, handler));

            _middlewares.Sort((a, b) => a.Order.CompareTo(b.Order));

            return this;
        }

        /// <summary>Doğrudan event dinleyici (kural olmadan)</summary>
        public AreEngine On(string eventType, Func<IEvent, AreContext, Task> handler)
        {
            if (!_listeners.ContainsKey(eventType))
                _listeners[eventType] = new();

            _listeners[eventType].Add(handler);

            return this;
        }

        // ---- Kural Yönetimi ----
        public AreEngine EnableRule(string ruleId) => SetRuleEnabled(ruleId, true);

        public AreEngine DisableRule(string ruleId) => SetRuleEnabled(ruleId, false);

        public AreEngine EnableGroup(string group)
        {
            foreach (var r in _rules.Where(r => r.Group == group))
                if (r is Rule mr) mr.Enable();

            return this;
        }

        public AreEngine DisableGroup(string group)
        {
            foreach (var r in _rules.Where(r => r.Group == group))
                if (r is Rule mr) mr.Disable();

            return this;
        }

        public AreEngine RemoveRule(string ruleId)
        {
            _rules.RemoveAll(r => r.RuleId == ruleId);

            return this;
        }

        // ---- EVENT FIRING - Ana işlem ----

        /// <summary>Event fırlat ve kuralları işle</summary>
        public async Task<EngineResult> FireAsync(IEvent evt, AreContext? context = null)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();

            context ??= new AreContext();

            context.CurrentEvent = evt;

            var result = new EngineResult
            {
                Event = evt,
                FiredRules = new(),
                SkippedRules = new()
            };

            // Middleware pipeline oluştur
            async Task CoreProcess()
            {
                // 1) Doğrudan dinleyicileri çalıştır
                if (_listeners.TryGetValue(evt.EventType, out var listeners))
                {
                    foreach (var listener in listeners)
                    {
                        if (context.StopPipeline) break;

                        await listener(evt, context);
                    }
                }

                // 2) Eşleşen kuralları bul ve önceliğe göre sırala
                var matchingRules = _rules
                    .Where(r => r.IsEnabled && r.EventTypes.Contains(evt.EventType))
                    .OrderByDescending(r => r.Priority)
                    .ToList();

                Log($"[ARE] Event '{evt.EventType}' → {matchingRules.Count} aday kural");

                foreach (var rule in matchingRules)
                {
                    if (context.StopPipeline)
                    {
                        Log($"[ARE] Pipeline durduruldu, kalan kurallar atlanıyor");
                        break;
                    }

                    context.CurrentRule = rule;

                    context.SkipRemainingActions = false;

                    var ruleResult = await EvaluateAndExecuteRule(rule, evt, context);

                    if (ruleResult.ConditionsMet)
                        result.FiredRules.Add(ruleResult);
                    else
                        result.SkippedRules.Add(ruleResult);
                }
            }

            // Middleware zincirini oluştur
            Func<Task> pipeline = CoreProcess;

            for (int i = _middlewares.Count - 1; i >= 0; i--)
            {
                var mw = _middlewares[i];

                var next = pipeline;

                pipeline = () => mw.ProcessAsync(context, next);
            }

            await pipeline();

            sw.Stop();

            result.PipelineStopped = context.StopPipeline;
            result.Duration = sw.Elapsed;

            Log($"[ARE] Event '{evt.EventType}' tamamlandı: {result.FiredRules.Count} tetiklendi, " +
                $"{result.SkippedRules.Count} atlandı, {sw.ElapsedMilliseconds}ms");

            return result;
        }

        /// <summary>Kısa yol: Event oluştur + fırlat</summary>
        public Task<EngineResult> FireAsync(string eventType, Action<GameEvent>? configure = null, AreContext? context = null)
        {
            var evt = new GameEvent(eventType);

            configure?.Invoke(evt);

            return FireAsync(evt, context);
        }

        // ---- İç Mekanizma ----

        private async Task<RuleResult> EvaluateAndExecuteRule(IRule rule, IEvent evt, AreContext context)
        {
            var failedConditions = new List<string>();

            // Koşul değerlendirme
            bool conditionsMet = EvaluateConditions(rule, evt, context, failedConditions);

            if (!conditionsMet)
            {
                Log($"[ARE]   Kural '{rule.RuleId}' → koşullar sağlanmadı [{string.Join(", ", failedConditions)}]");

                return new RuleResult
                {
                    RuleId = rule.RuleId,
                    ConditionsMet = false,
                    FailedConditions = failedConditions
                };
            }

            // Action'ları çalıştır
            var executedActions = new List<string>();

            Exception? error = null;

            var orderedActions = rule.Actions.OrderBy(a => a.Order).ToList();

            foreach (var binding in orderedActions)
            {
                if (context.SkipRemainingActions || context.StopPipeline)
                    break;

                if (!_actions.TryGetValue(binding.ActionType, out var action))
                {
                    Log($"[ARE]   ⚠ Action '{binding.ActionType}' bulunamadı!");
                    continue;
                }

                try
                {
                    Log($"[ARE]   → Action '{binding.ActionType}' çalıştırılıyor");

                    await action.ExecuteAsync(context, binding.Settings);

                    executedActions.Add(binding.ActionType);
                }
                catch (Exception ex)
                {
                    Log($"[ARE]   ✗ Action '{binding.ActionType}' hata: {ex.Message}");

                    error = ex;

                    break; // Hata durumunda kalan action'ları atla
                }
            }

            Log($"[ARE]   Kural '{rule.RuleId}' → {executedActions.Count} action çalıştı");

            return new RuleResult
            {
                RuleId = rule.RuleId,
                ConditionsMet = true,
                ExecutedActions = executedActions,
                Error = error
            };
        }
        private bool EvaluateConditions(IRule rule, IEvent evt, AreContext context, List<string> failed)
        {
            if (rule.Conditions.Count == 0)
                return true; // Koşul yoksa her zaman geçer

            var results = rule.Conditions.Select(c =>
            {
                bool result = c.Evaluate(evt, context);

                if (!result) failed.Add(c.Name);

                return result;
            }).ToList();

            return rule.MatchMode switch
            {
                MatchMode.All => results.All(r => r),

                MatchMode.Any => results.Any(r => r),

                MatchMode.None => results.All(r => !r),

                MatchMode.ExactlyOne => results.Count(r => r) == 1,

                _ => false
            };
        }

        private AreEngine SetRuleEnabled(string ruleId, bool enabled)
        {
            var rule = _rules.FirstOrDefault(r => r.RuleId == ruleId);

            if (rule is Rule mr) { if (enabled) mr.Enable(); else mr.Disable(); }

            return this;
        }

        private void Log(string msg) => OnLog?.Invoke(msg);

        // ---- Yardımcı iç sınıflar ----

        private class InlineAction : IAction
        {
            public string ActionType { get; }

            private readonly Func<AreContext, ActionSettings, Task> _handler;

            public InlineAction(string actionType, Func<AreContext, ActionSettings, Task> handler)
            {
                ActionType = actionType;

                _handler = handler;
            }

            public Task ExecuteAsync(AreContext context, ActionSettings settings) => _handler(context, settings);
        }

        private class InlineMiddleware : IMiddleware
        {
            public int Order { get; }

            private readonly Func<AreContext, Func<Task>, Task> _handler;

            public InlineMiddleware(int order, Func<AreContext, Func<Task>, Task> handler)
            {
                Order = order;

                _handler = handler;
            }

            public Task ProcessAsync(AreContext context, Func<Task> next) => _handler(context, next);
        }
    }
}
