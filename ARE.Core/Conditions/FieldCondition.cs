using ARE.Core.Abstractions;
using ARE.Core.Abstractions.Enums;
using ARE.Core.Core;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ARE.Core.Conditions
{
    /// <summary>Event verisindeki bir alanı karşılaştırır</summary>
    public class FieldCondition : ICondition
    {
        public string Name { get; }

        public string FieldName { get; }

        public CompareOp Operator { get; }

        public object ExpectedValue { get; }

        public FieldCondition(string fieldName, CompareOp op, object expected)
        {
            Name = $"{fieldName} {op} {expected}";
            FieldName = fieldName;
            Operator = op;
            ExpectedValue = expected;
        }

        public bool Evaluate(IEvent evt, AreContext context)
        {
            if (!evt.Data.TryGetValue(FieldName, out var actual))
                return false;

            return Operator switch
            {
                CompareOp.Equal => Equals(actual, ExpectedValue),

                CompareOp.NotEqual => !Equals(actual, ExpectedValue),

                CompareOp.GreaterThan => Compare(actual, ExpectedValue) > 0,

                CompareOp.GreaterOrEqual => Compare(actual, ExpectedValue) >= 0,

                CompareOp.LessThan => Compare(actual, ExpectedValue) < 0,

                CompareOp.LessOrEqual => Compare(actual, ExpectedValue) <= 0,

                CompareOp.Contains => actual?.ToString()?.Contains(ExpectedValue?.ToString() ?? "") == true,

                CompareOp.StartsWith => actual?.ToString()?.StartsWith(ExpectedValue?.ToString() ?? "") == true,

                CompareOp.In => ExpectedValue is IEnumerable<object> list && list.Contains(actual),

                _ => false
            };
        }

        private static int Compare(object? a, object? b)
        {
            if (a is IComparable ca && b != null)
                return ca.CompareTo(Convert.ChangeType(b, a.GetType()));

            return 0;
        }
    }
}
