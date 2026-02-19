## 1.0.0

- Initial release
- Full event-rule-action engine with fluent builder API
- MatchMode support: All (AND), Any (OR), None (NOT), ExactlyOne (XOR)
- 9 comparison operators: Equal, NotEqual, GreaterThan, GreaterOrEqual, LessThan, LessOrEqual, Contains, StartsWith, In
- Middleware pipeline (before/after interception)
- Rule groups with bulk enable/disable
- Priority ordering (higher priority rules execute first)
- Pipeline control: StopPipeline, SkipRemainingActions
- Dynamic rule management at runtime
- Context-based data sharing between actions
- Result reporting with fired/skipped rules and execution duration
- Zero dependencies
