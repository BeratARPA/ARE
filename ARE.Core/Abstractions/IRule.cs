using ARE.Core.Abstractions.Enums;
using ARE.Core.Core;
using System.Collections.Generic;

namespace ARE.Core.Abstractions
{
    public interface IRule
    {
        string RuleId { get; }

        string? Group { get; }

        int Priority { get; }

        bool IsEnabled { get; }

        /// <summary>Bu kural hangi event tiplerini dinliyor</summary>
        IReadOnlyList<string> EventTypes { get; }

        /// <summary>Koşullar</summary>
        IReadOnlyList<ICondition> Conditions { get; }

        /// <summary>Koşul eşleşme modu</summary>
        MatchMode MatchMode { get; }

        /// <summary>Koşullar sağlanınca çalışacak action tipleri + ayarları</summary>
        IReadOnlyList<ActionBinding> Actions { get; }
    }
}
