import 'interfaces.dart';
import 'are_context.dart';
import 'action_settings.dart';
import 'enums.dart';
import 'conditions.dart';

/// Fluent builder for defining rules.
class Rule implements IRule {
  @override
  final String ruleId;

  @override
  String? group;

  @override
  int priority = 0;

  @override
  bool isEnabled = true;

  @override
  final List<String> eventTypes = [];

  @override
  final List<ICondition> conditions = [];

  @override
  MatchMode matchMode = MatchMode.all;

  @override
  final List<ActionBinding> actions = [];

  Rule._(this.ruleId);

  /// Create a new rule with the given ID.
  static Rule create(String ruleId) => Rule._(ruleId);

  /// Assign this rule to a group.
  Rule inGroup(String group) {
    this.group = group;
    return this;
  }

  /// Set the priority (higher = runs first).
  Rule withPriority(int priority) {
    this.priority = priority;
    return this;
  }

  /// Enable this rule.
  Rule enable() {
    isEnabled = true;
    return this;
  }

  /// Disable this rule.
  Rule disable() {
    isEnabled = false;
    return this;
  }

  /// Listen for one or more event types.
  Rule on(String eventType, [String? eventType2, String? eventType3]) {
    if (!eventTypes.contains(eventType)) eventTypes.add(eventType);
    if (eventType2 != null && !eventTypes.contains(eventType2)) {
      eventTypes.add(eventType2);
    }
    if (eventType3 != null && !eventTypes.contains(eventType3)) {
      eventTypes.add(eventType3);
    }
    return this;
  }

  /// Set the condition matching mode.
  Rule withMatchMode(MatchMode mode) {
    matchMode = mode;
    return this;
  }

  /// Add a lambda condition.
  Rule when(String name, bool Function(IEvent evt, AreContext ctx) predicate) {
    conditions.add(DataCondition(name, predicate));
    return this;
  }

  /// Add a custom ICondition.
  Rule whenCondition(ICondition condition) {
    conditions.add(condition);
    return this;
  }

  /// Add a field comparison condition.
  Rule whenField(String field, CompareOp op, dynamic expected) {
    conditions.add(FieldCondition(field, op, expected));
    return this;
  }

  /// Shortcut: field == value.
  Rule whenEquals(String field, dynamic value) =>
      whenField(field, CompareOp.equal, value);

  /// Shortcut: field > value.
  Rule whenGreaterThan(String field, dynamic value) =>
      whenField(field, CompareOp.greaterThan, value);

  /// Shortcut: field < value.
  Rule whenLessThan(String field, dynamic value) =>
      whenField(field, CompareOp.lessThan, value);

  /// Bind an action (without settings).
  Rule then(String actionType, [void Function(ActionSettings s)? configure, int order = 0]) {
    final settings = ActionSettings();
    if (configure != null) configure(settings);
    actions.add(ActionBinding(
      actionType: actionType,
      settings: settings,
      order: order,
    ));
    return this;
  }
}
