// ARE.Core Type Definitions

export declare enum MatchMode {
    All = 'all',
    Any = 'any',
    None = 'none',
    ExactlyOne = 'exactlyOne',
}

export declare enum CompareOp {
    Equal = 'eq',
    NotEqual = 'neq',
    GreaterThan = 'gt',
    GreaterOrEqual = 'gte',
    LessThan = 'lt',
    LessOrEqual = 'lte',
    Contains = 'contains',
    StartsWith = 'startsWith',
    In = 'in',
}

export interface IEvent {
    eventType: string;
    data: Record<string, any>;
    timestamp: Date;
}

export interface IAction {
    actionType: string;
    execute(context: AreContext, settings: ActionSettings): Promise<void>;
}

export interface ICondition {
    name: string;
    evaluate(evt: IEvent, context: AreContext): boolean;
}

export interface IMiddleware {
    order: number;
    process(context: AreContext, next: () => Promise<void>): Promise<void>;
}

export interface ActionBinding {
    actionType: string;
    settings: ActionSettings;
    order: number;
}

export interface EngineResult {
    event: IEvent;
    firedRules: RuleResult[];
    skippedRules: RuleResult[];
    pipelineStopped: boolean;
    duration: number;
}

export interface RuleResult {
    ruleId: string;
    conditionsMet: boolean;
    executedActions: string[];
    failedConditions: string[];
}

// ── Classes ──

export declare class AreContext {
    currentEvent: IEvent | null;
    currentRule: Rule | null;
    stopPipeline: boolean;
    skipRemainingActions: boolean;
    set<T>(key: string, value: T): void;
    get<T>(key: string): T | undefined;
    has(key: string): boolean;
    remove(key: string): void;
    clear(): void;
}

export declare class ActionSettings {
    set(key: string, value: any): this;
    get<T>(key: string): T | undefined;
    has(key: string): boolean;
    all(): Record<string, any>;
}

export declare class GameEvent implements IEvent {
    readonly eventType: string;
    readonly data: Record<string, any>;
    readonly timestamp: Date;
    constructor(eventType: string);
    set(key: string, value: any): this;
}

export declare class FieldCondition implements ICondition {
    readonly name: string;
    readonly fieldName: string;
    readonly operator: CompareOp;
    readonly expected: any;
    constructor(fieldName: string, op: CompareOp, expected: any);
    evaluate(evt: IEvent, context: AreContext): boolean;
}

export declare class Rule {
    ruleId: string;
    group: string | null;
    priority: number;
    isEnabled: boolean;
    eventTypes: string[];
    conditions: ICondition[];
    matchMode: MatchMode;
    actions: ActionBinding[];

    static create(ruleId: string): Rule;
    inGroup(group: string): this;
    withPriority(priority: number): this;
    enable(): this;
    disable(): this;
    on(...eventTypes: string[]): this;
    withMatchMode(mode: MatchMode): this;
    when(name: string, predicate: (evt: IEvent, ctx: AreContext) => boolean): this;
    when(condition: ICondition): this;
    whenField(field: string, op: CompareOp, expected: any): this;
    whenEquals(field: string, value: any): this;
    whenGreaterThan(field: string, value: any): this;
    whenLessThan(field: string, value: any): this;
    then(actionType: string, order?: number): this;
    then(actionType: string, configure: (s: ActionSettings) => void, order?: number): this;
}

export declare class AreEngine {
    onLog: ((msg: string) => void) | null;

    registerAction(action: IAction): this;
    registerAction(actionType: string, handler: (ctx: AreContext, s: ActionSettings) => Promise<void>): this;
    addRule(rule: Rule): this;
    addRules(...rules: Rule[]): this;
    use(order: number, handler: (ctx: AreContext, next: () => Promise<void>) => Promise<void>): this;
    on(eventType: string, handler: (evt: IEvent, ctx: AreContext) => Promise<void>): this;

    enableRule(id: string): this;
    disableRule(id: string): this;
    removeRule(id: string): this;
    enableGroup(group: string): this;
    disableGroup(group: string): this;

    fire(evt: IEvent, context?: AreContext): Promise<EngineResult>;
    fire(eventType: string, configure?: (e: GameEvent) => void, context?: AreContext): Promise<EngineResult>;
}