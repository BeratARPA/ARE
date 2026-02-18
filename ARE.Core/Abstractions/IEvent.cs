using System;
using System.Collections.Generic;

namespace ARE.Core.Abstractions
{
    public interface IEvent
    {
        /// <summary>Event tipi tanımlayıcı (örn: "player.died", "order.created")</summary>
        string EventType { get; }

        /// <summary>Event'e ait veriler</summary>
        IReadOnlyDictionary<string, object> Data { get; }

        /// <summary>Event oluşma zamanı</summary>
        DateTime Timestamp { get; }
    }
}
