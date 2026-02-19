/// Key-value parameters specific to each action binding.
class ActionSettings {
  final Map<String, dynamic> _values = {};

  /// Set a parameter value. Returns this for fluent chaining.
  ActionSettings set(String key, dynamic value) {
    _values[key] = value;
    return this;
  }

  /// Get a parameter value by key.
  T? get<T>(String key) {
    final val = _values[key];
    return val is T ? val : null;
  }

  /// Check if a key exists.
  bool has(String key) => _values.containsKey(key);

  /// Get all parameters as a read-only map.
  Map<String, dynamic> get all => Map.unmodifiable(_values);
}
