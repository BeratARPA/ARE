using ARE.Core.Abstractions;
using ARE.Core.Core;
using System;

namespace ARE.Core.Conditions
{
    // Yaygın koşul implementasyonları
    public class DataCondition : ICondition
    {
        public string Name { get; }

        private readonly Func<IEvent, AreContext, bool> _predicate;

        public DataCondition(string name, Func<IEvent, AreContext, bool> predicate)
        {
            Name = name;
            _predicate = predicate;
        }
        public bool Evaluate(IEvent evt, AreContext context) => _predicate(evt, context);
    }
}
