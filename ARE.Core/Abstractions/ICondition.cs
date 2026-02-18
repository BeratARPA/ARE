using ARE.Core.Core;

namespace ARE.Core.Abstractions
{
    public interface ICondition
    {
        /// <summary>Koşul adı (debug/log için)</summary>
        string Name { get; }

        /// <summary>Koşulu değerlendir</summary>
        bool Evaluate(IEvent evt, AreContext context);
    }
}
