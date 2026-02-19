import 'interfaces.dart';
import 'are_context.dart';
import 'action_settings.dart';
import 'game_event.dart';
import 'enums.dart';
import 'results.dart';
import 'rule.dart';

/// Main ARE engine orchestrator.
class AreEngine {
  final Map<String, IAction> _actions = {};
  final List<IRule> _rules = [];
  final List<IMiddleware> _middlewares = [];
  final Map<String, List<Future<void> Function(IEvent, AreContext)>> _listeners = {};

  /// Logging hook. Set this to receive engine log messages.
  void Function(String msg)? onLog;

  // -- Registration --

  /// Register an IAction implementation.
  AreEngine registerAction(IAction action) {
    _actions[action.actionType] = action;
    return this;
  }

  /// Register an inline action (quick prototyping).
  AreEngine registerInlineAction(
    String actionType,
    Future<void> Function(AreContext context, ActionSettings settings) handler,
  ) {
    _actions[actionType] = _InlineAction(actionType, handler);
    return this;
  }

  /// Add a rule.
  AreEngine addRule(IRule rule) {
    _rules.add(rule);
    return this;
  }

  /// Add multiple rules.
  AreEngine addRules(List<IRule> rules) {
    _rules.addAll(rules);
    return this;
  }

  /// Add an inline middleware.
  AreEngine use(
    int order,
    Future<void> Function(AreContext ctx, Future<void> Function() next) handler,
  ) {
    _middlewares.add(_InlineMiddleware(order, handler));
    _middlewares.sort((a, b) => a.order.compareTo(b.order));
    return this;
  }

  /// Add a direct event listener (without rules).
  AreEngine on(
    String eventType,
    Future<void> Function(IEvent evt, AreContext ctx) handler,
  ) {
    _listeners.putIfAbsent(eventType, () => []);
    _listeners[eventType]!.add(handler);
    return this;
  }

  // -- Rule Management --

  /// Enable a rule by ID.
  AreEngine enableRule(String id) {
    final r = _rules.whereType<Rule>().where((r) => r.ruleId == id).firstOrNull;
    r?.enable();
    return this;
  }

  /// Disable a rule by ID.
  AreEngine disableRule(String id) {
    final r = _rules.whereType<Rule>().where((r) => r.ruleId == id).firstOrNull;
    r?.disable();
    return this;
  }

  /// Remove a rule by ID.
  AreEngine removeRule(String id) {
    _rules.removeWhere((r) => r.ruleId == id);
    return this;
  }

  /// Enable all rules in a group.
  AreEngine enableGroup(String group) {
    for (final r in _rules.whereType<Rule>().where((r) => r.group == group)) {
      r.enable();
    }
    return this;
  }

  /// Disable all rules in a group.
  AreEngine disableGroup(String group) {
    for (final r in _rules.whereType<Rule>().where((r) => r.group == group)) {
      r.disable();
    }
    return this;
  }

  // -- Event Firing --

  /// Fire an event and process all matching rules.
  Future<EngineResult> fire(
    dynamic eventTypeOrEvent, [
    void Function(GameEvent e)? configure,
    AreContext? context,
  ]) async {
    IEvent evt;
    if (eventTypeOrEvent is String) {
      final ge = GameEvent(eventTypeOrEvent);
      if (configure != null) configure(ge);
      evt = ge;
    } else if (eventTypeOrEvent is IEvent) {
      evt = eventTypeOrEvent;
      if (configure == null && context == null) {
        // No-op
      }
    } else {
      throw ArgumentError('First argument must be a String or IEvent');
    }

    final sw = Stopwatch()..start();
    final ctx = context ?? AreContext();
    ctx.currentEvent = evt;
    ctx.stopPipeline = false;

    final firedRules = <RuleResult>[];
    final skippedRules = <RuleResult>[];

    Future<void> coreProcess() async {
      // 1) Direct listeners
      final listeners = _listeners[evt.eventType];
      if (listeners != null) {
        for (final listener in listeners) {
          if (ctx.stopPipeline) break;
          await listener(evt, ctx);
        }
      }

      // 2) Matching rules (by priority)
      final matching = _rules
          .where((r) => r.isEnabled && r.eventTypes.contains(evt.eventType))
          .toList()
        ..sort((a, b) => b.priority.compareTo(a.priority));

      _log('[ARE] Event \'${evt.eventType}\' → ${matching.length} candidate rules');

      for (final rule in matching) {
        if (ctx.stopPipeline) {
          _log('[ARE] Pipeline stopped');
          break;
        }
        ctx.currentRule = rule;
        ctx.skipRemainingActions = false;

        final rr = await _evaluateAndExecute(rule, evt, ctx);
        if (rr.conditionsMet) {
          firedRules.add(rr);
        } else {
          skippedRules.add(rr);
        }
      }
    }

    // Middleware chain
    Future<void> Function() pipeline = coreProcess;
    for (var i = _middlewares.length - 1; i >= 0; i--) {
      final mw = _middlewares[i];
      final next = pipeline;
      pipeline = () => mw.process(ctx, next);
    }

    await pipeline();

    sw.stop();

    _log('[ARE] Event \'${evt.eventType}\' completed: '
        '${firedRules.length} fired, '
        '${skippedRules.length} skipped, '
        '${sw.elapsedMilliseconds}ms');

    return EngineResult(
      event: evt,
      firedRules: firedRules,
      skippedRules: skippedRules,
      pipelineStopped: ctx.stopPipeline,
      duration: sw.elapsed,
    );
  }

  // -- Internal --

  Future<RuleResult> _evaluateAndExecute(
    IRule rule,
    IEvent evt,
    AreContext ctx,
  ) async {
    final failedConditions = <String>[];
    final conditionsMet = _evaluateConditions(rule, evt, ctx, failedConditions);

    if (!conditionsMet) {
      _log('[ARE]   Rule \'${rule.ruleId}\' → conditions not met [${failedConditions.join(', ')}]');
      return RuleResult(
        ruleId: rule.ruleId,
        conditionsMet: false,
        failedConditions: failedConditions,
      );
    }

    final executedActions = <String>[];
    final ordered = List<ActionBinding>.from(rule.actions)
      ..sort((a, b) => a.order.compareTo(b.order));

    for (final binding in ordered) {
      if (ctx.skipRemainingActions || ctx.stopPipeline) break;
      final action = _actions[binding.actionType];

      if (action == null) {
        _log('[ARE]   Action \'${binding.actionType}\' not found!');
        continue;
      }

      try {
        _log('[ARE]   → Executing action \'${binding.actionType}\'');
        await action.execute(ctx, binding.settings);
        executedActions.add(binding.actionType);
      } catch (err) {
        _log('[ARE]   Action \'${binding.actionType}\' error: $err');
        break;
      }
    }

    return RuleResult(
      ruleId: rule.ruleId,
      conditionsMet: true,
      executedActions: executedActions,
    );
  }

  bool _evaluateConditions(
    IRule rule,
    IEvent evt,
    AreContext ctx,
    List<String> failed,
  ) {
    if (rule.conditions.isEmpty) return true;

    final results = <bool>[];
    for (final c in rule.conditions) {
      final r = c.evaluate(evt, ctx);
      if (!r) failed.add(c.name);
      results.add(r);
    }

    switch (rule.matchMode) {
      case MatchMode.all:
        return results.every((r) => r);
      case MatchMode.any:
        return results.any((r) => r);
      case MatchMode.none:
        return results.every((r) => !r);
      case MatchMode.exactlyOne:
        return results.where((r) => r).length == 1;
    }
  }

  void _log(String msg) => onLog?.call(msg);
}

// -- Internal helper classes --

class _InlineAction implements IAction {
  @override
  final String actionType;

  final Future<void> Function(AreContext, ActionSettings) _handler;

  _InlineAction(this.actionType, this._handler);

  @override
  Future<void> execute(AreContext context, ActionSettings settings) =>
      _handler(context, settings);
}

class _InlineMiddleware implements IMiddleware {
  @override
  final int order;

  final Future<void> Function(AreContext, Future<void> Function()) _handler;

  _InlineMiddleware(this.order, this._handler);

  @override
  Future<void> process(AreContext context, Future<void> Function() next) =>
      _handler(context, next);
}
