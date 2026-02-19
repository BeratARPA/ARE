import 'are_context.dart';
import 'action_settings.dart';
import 'enums.dart';

/// Something that happened in the system.
abstract class IEvent {
  String get eventType;
  Map<String, dynamic> get data;
  DateTime get timestamp;
}

/// The work to be performed.
abstract class IAction {
  String get actionType;
  Future<void> execute(AreContext context, ActionSettings settings);
}

/// Determines whether a rule should execute.
abstract class ICondition {
  String get name;
  bool evaluate(IEvent evt, AreContext context);
}

/// Intercepts the pipeline before/after event processing.
abstract class IMiddleware {
  int get order;
  Future<void> process(AreContext context, Future<void> Function() next);
}

/// The Event -> Condition -> Action binding.
abstract class IRule {
  String get ruleId;
  String? get group;
  int get priority;
  bool get isEnabled;
  List<String> get eventTypes;
  List<ICondition> get conditions;
  MatchMode get matchMode;
  List<ActionBinding> get actions;
}

/// A binding of an action type with its settings and execution order.
class ActionBinding {
  String actionType;
  ActionSettings settings;
  int order;

  ActionBinding({
    required this.actionType,
    ActionSettings? settings,
    this.order = 0,
  }) : settings = settings ?? ActionSettings();
}
