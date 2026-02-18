using System.Collections.Generic;

namespace ARE.Core.Core
{
    /// <summary>Action'a özel ayarlar / parametreler</summary>
    public class ActionSettings
    {
        private readonly Dictionary<string, object> _values = new();

        public ActionSettings Set(string key, object value)
        {
            _values[key] = value;
            return this;
        }

        public T? Get<T>(string key) => _values.TryGetValue(key, out var val) ? (T)val : default;

        public bool Has(string key) => _values.ContainsKey(key);

        public IReadOnlyDictionary<string, object> All => _values;
    }
}
