using ARE.Core.Abstractions;
using System;
using System.Collections.Generic;

namespace ARE.Core.Core
{
    public class GameEvent : IEvent
    {
        public string EventType { get; }

        public IReadOnlyDictionary<string, object> Data { get; }

        public DateTime Timestamp { get; }

        private readonly Dictionary<string, object> _data;

        public GameEvent(string eventType)
        {
            EventType = eventType;
            _data = new Dictionary<string, object>();
            Data = _data;
            Timestamp = DateTime.UtcNow;
        }

        public GameEvent Set(string key, object value)
        {
            _data[key] = value;
            return this; // fluent
        }
    }
}
