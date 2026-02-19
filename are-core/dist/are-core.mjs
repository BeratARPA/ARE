// ============================================================================
// ARE.Core - Action Rule Event Engine (ES Module)
// Zero dependency - Browser, Node.js, React Native, Electron
// ============================================================================

// ── Enums ──

const MatchMode = Object.freeze({
    All: 'all',
    Any: 'any',
    None: 'none',
    ExactlyOne: 'exactlyOne',
});

const CompareOp = Object.freeze({
    Equal: 'eq',
    NotEqual: 'neq',
    GreaterThan: 'gt',
    GreaterOrEqual: 'gte',
    LessThan: 'lt',
    LessOrEqual: 'lte',
    Contains: 'contains',
    StartsWith: 'startsWith',
    In: 'in',
});

// ── AreContext ──

class AreContext {
    constructor() {
        this._data = new Map();
        this.currentEvent = null;
        this.currentRule = null;
        this.stopPipeline = false;
        this.skipRemainingActions = false;
    }
    set(key, value) { this._data.set(key, value); }
    get(key) { return this._data.get(key); }
    has(key) { return this._data.has(key); }
    remove(key) { this._data.delete(key); }
    clear() { this._data.clear(); }
}

// ── ActionSettings ──

class ActionSettings {
    constructor() { this._values = {}; }
    set(key, value) { this._values[key] = value; return this; }
    get(key) { return this._values[key]; }
    has(key) { return key in this._values; }
    all() { return Object.assign({}, this._values); }
}

// ── GameEvent ──

class GameEvent {
    constructor(eventType) {
        this.eventType = eventType;
        this.data = {};
        this.timestamp = new Date();
    }
    set(key, value) { this.data[key] = value; return this; }
}

// ── FieldCondition ──

class FieldCondition {
    constructor(fieldName, operator, expected) {
        this.name = fieldName + ' ' + operator + ' ' + expected;
        this.fieldName = fieldName;
        this.operator = operator;
        this.expected = expected;
    }

    evaluate(evt, _context) {
        var actual = evt.data[this.fieldName];
        if (actual === undefined) return false;

        switch (this.operator) {
            case CompareOp.Equal: return actual === this.expected;
            case CompareOp.NotEqual: return actual !== this.expected;
            case CompareOp.GreaterThan: return actual > this.expected;
            case CompareOp.GreaterOrEqual: return actual >= this.expected;
            case CompareOp.LessThan: return actual < this.expected;
            case CompareOp.LessOrEqual: return actual <= this.expected;
            case CompareOp.Contains: return String(actual).includes(String(this.expected));
            case CompareOp.StartsWith: return String(actual).startsWith(String(this.expected));
            case CompareOp.In: return Array.isArray(this.expected) && this.expected.includes(actual);
            default: return false;
        }
    }
}

// ── Rule (Fluent Builder) ──

class Rule {
    constructor(ruleId) {
        this.ruleId = ruleId;
        this.group = null;
        this.priority = 0;
        this.isEnabled = true;
        this.eventTypes = [];
        this.conditions = [];
        this.matchMode = MatchMode.All;
        this.actions = [];
    }

    static create(ruleId) { return new Rule(ruleId); }

    inGroup(group) { this.group = group; return this; }
    withPriority(p) { this.priority = p; return this; }
    enable() { this.isEnabled = true; return this; }
    disable() { this.isEnabled = false; return this; }

    on() {
        for (var i = 0; i < arguments.length; i++) {
            var et = arguments[i];
            if (this.eventTypes.indexOf(et) === -1) this.eventTypes.push(et);
        }
        return this;
    }

    withMatchMode(mode) { this.matchMode = mode; return this; }

    when(nameOrCondition, predicate) {
        if (typeof nameOrCondition === 'object' && nameOrCondition.evaluate) {
            this.conditions.push(nameOrCondition);
        } else {
            this.conditions.push({ name: nameOrCondition, evaluate: predicate });
        }
        return this;
    }

    whenField(field, op, expected) {
        this.conditions.push(new FieldCondition(field, op, expected));
        return this;
    }

    whenEquals(field, value) { return this.whenField(field, CompareOp.Equal, value); }
    whenGreaterThan(field, value) { return this.whenField(field, CompareOp.GreaterThan, value); }
    whenLessThan(field, value) { return this.whenField(field, CompareOp.LessThan, value); }

    then(actionType, configure, order) {
        var settings = new ActionSettings();
        if (typeof configure === 'function') {
            configure(settings);
        } else if (typeof configure === 'number') {
            order = configure;
        }
        this.actions.push({ actionType: actionType, settings: settings, order: order || 0 });
        return this;
    }
}

// ── AreEngine ──

class AreEngine {
    constructor() {
        this._actions = new Map();
        this._rules = [];
        this._middlewares = [];
        this._listeners = new Map();
        this.onLog = null;
    }

    // -- Registration --

    registerAction(actionTypeOrObj, handler) {
        if (typeof actionTypeOrObj === 'string') {
            this._actions.set(actionTypeOrObj, { actionType: actionTypeOrObj, execute: handler });
        } else {
            this._actions.set(actionTypeOrObj.actionType, actionTypeOrObj);
        }
        return this;
    }

    addRule(rule) { this._rules.push(rule); return this; }

    addRules() {
        for (var i = 0; i < arguments.length; i++) this._rules.push(arguments[i]);
        return this;
    }

    use(order, handler) {
        this._middlewares.push({ order: order, process: handler });
        this._middlewares.sort(function (a, b) { return a.order - b.order; });
        return this;
    }

    on(eventType, handler) {
        if (!this._listeners.has(eventType)) this._listeners.set(eventType, []);
        this._listeners.get(eventType).push(handler);
        return this;
    }

    // -- Rule Management --

    enableRule(id) { var r = this._rules.find(function (r) { return r.ruleId === id; }); if (r) r.isEnabled = true; return this; }
    disableRule(id) { var r = this._rules.find(function (r) { return r.ruleId === id; }); if (r) r.isEnabled = false; return this; }
    removeRule(id) { this._rules = this._rules.filter(function (r) { return r.ruleId !== id; }); return this; }

    enableGroup(g) {
        this._rules.forEach(function (r) { if (r.group === g) r.isEnabled = true; });
        return this;
    }

    disableGroup(g) {
        this._rules.forEach(function (r) { if (r.group === g) r.isEnabled = false; });
        return this;
    }

    // -- Event Firing --

    async fire(eventTypeOrEvent, configure, context) {
        var evt;
        if (typeof eventTypeOrEvent === 'string') {
            evt = new GameEvent(eventTypeOrEvent);
            if (typeof configure === 'function') configure(evt);
        } else {
            evt = eventTypeOrEvent;
            if (configure instanceof AreContext) context = configure;
        }

        var start = Date.now();
        var ctx = context || new AreContext();
        ctx.currentEvent = evt;
        ctx.stopPipeline = false;

        var result = {
            event: evt,
            firedRules: [],
            skippedRules: [],
            pipelineStopped: false,
            duration: 0
        };

        var self = this;

        var coreProcess = async function () {
            // 1) Direct listeners
            var listeners = self._listeners.get(evt.eventType) || [];
            for (var i = 0; i < listeners.length; i++) {
                if (ctx.stopPipeline) break;
                await listeners[i](evt, ctx);
            }

            // 2) Matching rules (by priority)
            var matching = self._rules
                .filter(function (r) { return r.isEnabled && r.eventTypes.indexOf(evt.eventType) !== -1; })
                .sort(function (a, b) { return b.priority - a.priority; });

            self._log('[ARE] Event \'' + evt.eventType + '\' → ' + matching.length + ' candidate rules');

            for (var j = 0; j < matching.length; j++) {
                if (ctx.stopPipeline) {
                    self._log('[ARE] Pipeline stopped');
                    break;
                }
                var rule = matching[j];
                ctx.currentRule = rule;
                ctx.skipRemainingActions = false;

                var rr = await self._evaluateAndExecute(rule, evt, ctx);
                if (rr.conditionsMet) result.firedRules.push(rr);
                else result.skippedRules.push(rr);
            }
        };

        // Middleware chain
        var pipeline = coreProcess;
        for (var i = this._middlewares.length - 1; i >= 0; i--) {
            (function (mw, next) {
                pipeline = function () { return mw.process(ctx, next); };
            })(this._middlewares[i], pipeline);
        }

        await pipeline();

        result.pipelineStopped = ctx.stopPipeline;
        result.duration = Date.now() - start;
        this._log('[ARE] Event \'' + evt.eventType + '\' completed: ' +
            result.firedRules.length + ' fired, ' +
            result.skippedRules.length + ' skipped, ' +
            result.duration + 'ms');
        return result;
    }

    // -- Internal --

    async _evaluateAndExecute(rule, evt, ctx) {
        var failedConditions = [];
        var conditionsMet = this._evaluateConditions(rule, evt, ctx, failedConditions);

        if (!conditionsMet) {
            this._log('[ARE]   Rule \'' + rule.ruleId + '\' → conditions not met [' + failedConditions.join(', ') + ']');
            return { ruleId: rule.ruleId, conditionsMet: false, executedActions: [], failedConditions: failedConditions };
        }

        var executedActions = [];
        var ordered = rule.actions.slice().sort(function (a, b) { return a.order - b.order; });

        for (var i = 0; i < ordered.length; i++) {
            if (ctx.skipRemainingActions || ctx.stopPipeline) break;
            var binding = ordered[i];
            var action = this._actions.get(binding.actionType);

            if (!action) {
                this._log('[ARE]   Action \'' + binding.actionType + '\' not found!');
                continue;
            }

            try {
                this._log('[ARE]   → Executing action \'' + binding.actionType + '\'');
                await action.execute(ctx, binding.settings);
                executedActions.push(binding.actionType);
            } catch (err) {
                this._log('[ARE]   Action \'' + binding.actionType + '\' error: ' + err.message);
                break;
            }
        }

        return { ruleId: rule.ruleId, conditionsMet: true, executedActions: executedActions, failedConditions: [] };
    }

    _evaluateConditions(rule, evt, ctx, failed) {
        if (rule.conditions.length === 0) return true;

        var results = [];
        for (var i = 0; i < rule.conditions.length; i++) {
            var c = rule.conditions[i];
            var r = c.evaluate(evt, ctx);
            if (!r) failed.push(c.name);
            results.push(r);
        }

        switch (rule.matchMode) {
            case MatchMode.All: return results.every(function (r) { return r; });
            case MatchMode.Any: return results.some(function (r) { return r; });
            case MatchMode.None: return results.every(function (r) { return !r; });
            case MatchMode.ExactlyOne: return results.filter(function (r) { return r; }).length === 1;
            default: return false;
        }
    }

    _log(msg) { if (this.onLog) this.onLog(msg); }
}

// ── Export (ESM) ──
export {
    AreEngine,
    AreContext,
    GameEvent,
    Rule,
    ActionSettings,
    FieldCondition,
    MatchMode,
    CompareOp
};
