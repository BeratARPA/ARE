/// Condition matching modes for rules.
enum MatchMode {
  /// All conditions must be true (AND).
  all,

  /// At least one condition must be true (OR).
  any,

  /// No conditions should be true (NOT).
  none,

  /// Exactly one condition must be true (XOR-like).
  exactlyOne,
}

/// Comparison operators for field conditions.
enum CompareOp {
  equal,
  notEqual,
  greaterThan,
  greaterOrEqual,
  lessThan,
  lessOrEqual,
  contains,
  startsWith,
  inList,
}
