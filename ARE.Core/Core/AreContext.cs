using ARE.Core.Abstractions;
using System.Collections.Generic;

namespace ARE.Core.Core
{
    public class AreContext
    {
        private readonly Dictionary<string, object> _data = new();

        /// <summary>Event işlenirken akan orijinal event</summary>
        public IEvent? CurrentEvent { get; internal set; }

        /// <summary>Şu an çalışan kural</summary>
        public IRule? CurrentRule { get; internal set; }

        /// <summary>Pipeline'ı durdurur - sonraki kural/action çalışmaz</summary>
        public bool StopPipeline { get; set; }

        /// <summary>Sadece mevcut kuralın kalan action'larını atlar</summary>
        public bool SkipRemainingActions { get; set; }

        public void Set<T>(string key, T value) => _data[key] = value!;

        public T? Get<T>(string key) => _data.TryGetValue(key, out var val) ? (T)val : default;

        public bool Has(string key) => _data.ContainsKey(key);

        public void Remove(string key) => _data.Remove(key);

        public void Clear() => _data.Clear();
    }
}
