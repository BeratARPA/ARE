import 'interfaces.dart';

/// Result of a single rule evaluation.
class RuleResult {
  final String ruleId;
  final bool conditionsMet;
  final List<String> executedActions;
  final List<String> failedConditions;
  final Object? error;

  RuleResult({
    required this.ruleId,
    required this.conditionsMet,
    List<String>? executedActions,
    List<String>? failedConditions,
    this.error,
  })  : executedActions = executedActions ?? [],
        failedConditions = failedConditions ?? [];
}

/// Result of event processing.
class EngineResult {
  final IEvent event;
  final List<RuleResult> firedRules;
  final List<RuleResult> skippedRules;
  final bool pipelineStopped;
  final Duration duration;

  EngineResult({
    required this.event,
    required this.firedRules,
    required this.skippedRules,
    required this.pipelineStopped,
    required this.duration,
  });
}
