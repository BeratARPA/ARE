using ARE.Core.Abstractions;
using ARE.Core.Abstractions.Enums;
using ARE.Core.Conditions;
using ARE.Core.Core;
using System;
using System.Collections.Generic;

namespace ARE.Core.Rules
{
    public class Rule : IRule
    {
        public string RuleId { get; private set; } = "";

        public string? Group { get; private set; }

        public int Priority { get; private set; }

        public bool IsEnabled { get; private set; } = true;

        public IReadOnlyList<string> EventTypes => _eventTypes;

        public IReadOnlyList<ICondition> Conditions => _conditions;

        public MatchMode MatchMode { get; private set; } = MatchMode.All;

        public IReadOnlyList<ActionBinding> Actions => _actions;

        private readonly List<string> _eventTypes = new();

        private readonly List<ICondition> _conditions = new();

        private readonly List<ActionBinding> _actions = new();

        private Rule() { }

        // ---- Fluent Builder ----
        public static Rule Create(string ruleId) => new() { RuleId = ruleId };

        public Rule InGroup(string group) { Group = group; return this; }

        public Rule WithPriority(int priority) { Priority = priority; return this; }

        public Rule Enable(bool enabled = true) { IsEnabled = enabled; return this; }

        public Rule Disable() { IsEnabled = false; return this; }

        /// <summary>Bu kural hangi event tipini dinlesin</summary>
        public Rule On(string eventType)
        {
            if (!_eventTypes.Contains(eventType))
                _eventTypes.Add(eventType);

            return this;
        }

        /// <summary>Birden fazla event tipi dinle</summary>
        public Rule On(params string[] eventTypes)
        {
            foreach (var et in eventTypes) On(et);

            return this;
        }

        /// <summary>Koşul eşleşme modunu belirle</summary>
        public Rule WithMatchMode(MatchMode mode) { MatchMode = mode; return this; }

        /// <summary>Lambda koşul ekle</summary>
        public Rule When(string name, Func<IEvent, AreContext, bool> predicate)
        {
            _conditions.Add(new DataCondition(name, predicate));

            return this;
        }

        /// <summary>Alan karşılaştırma koşulu ekle</summary>
        public Rule WhenField(string field, CompareOp op, object expected)
        {
            _conditions.Add(new FieldCondition(field, op, expected));

            return this;
        }

        /// <summary>Kısa yol: alan == değer</summary>
        public Rule WhenEquals(string field, object value) => WhenField(field, CompareOp.Equal, value);

        /// <summary>Kısa yol: alan > değer</summary>
        public Rule WhenGreaterThan(string field, object value) => WhenField(field, CompareOp.GreaterThan, value);

        /// <summary>Kısa yol: alan &lt; değer</summary>
        public Rule WhenLessThan(string field, object value) => WhenField(field, CompareOp.LessThan, value);

        /// <summary>Özel ICondition ekle</summary>
        public Rule When(ICondition condition)
        {
            _conditions.Add(condition);

            return this;
        }

        /// <summary>Action bağla (ayarsız)</summary>
        public Rule Then(string actionType, int order = 0)
        {
            _actions.Add(new ActionBinding
            {
                ActionType = actionType,
                Order = order
            });

            return this;
        }

        /// <summary>Action bağla (ayarlı)</summary>
        public Rule Then(string actionType, Action<ActionSettings> configure, int order = 0)
        {
            var settings = new ActionSettings();

            configure(settings);

            _actions.Add(new ActionBinding
            {
                ActionType = actionType,
                Settings = settings,
                Order = order
            });

            return this;
        }
    }
}
