import 'interfaces.dart';

/// Default IEvent implementation.
class GameEvent implements IEvent {
  @override
  final String eventType;

  @override
  final Map<String, dynamic> data = {};

  @override
  final DateTime timestamp;

  GameEvent(this.eventType) : timestamp = DateTime.now();

  /// Set event data. Returns this for fluent chaining.
  GameEvent set(String key, dynamic value) {
    data[key] = value;
    return this;
  }
}
