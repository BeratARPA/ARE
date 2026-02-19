import 'interfaces.dart';

/// Shared data bag that carries data across the entire pipeline.
class AreContext {
  final Map<String, dynamic> _data = {};

  /// The event currently being processed.
  IEvent? currentEvent;

  /// The rule currently being evaluated.
  IRule? currentRule;

  /// Set to true to stop the entire pipeline; remaining rules will not execute.
  bool stopPipeline = false;

  /// Set to true to skip the remaining actions of the current rule only.
  bool skipRemainingActions = false;

  /// Store a value in the context.
  void set(String key, dynamic value) => _data[key] = value;

  /// Retrieve a value from the context.
  T? get<T>(String key) {
    final val = _data[key];
    return val is T ? val : null;
  }

  /// Check if a key exists in the context.
  bool has(String key) => _data.containsKey(key);

  /// Remove a key from the context.
  void remove(String key) => _data.remove(key);

  /// Clear all data from the context.
  void clear() => _data.clear();
}
