import 'interfaces.dart';
import 'are_context.dart';
import 'enums.dart';

/// Lambda/predicate-based condition.
class DataCondition implements ICondition {
  @override
  final String name;

  final bool Function(IEvent evt, AreContext context) _predicate;

  DataCondition(this.name, this._predicate);

  @override
  bool evaluate(IEvent evt, AreContext context) => _predicate(evt, context);
}

/// Field value comparison condition using CompareOp.
class FieldCondition implements ICondition {
  @override
  final String name;

  final String fieldName;
  final CompareOp operator_;
  final dynamic expected;

  FieldCondition(this.fieldName, this.operator_, this.expected)
      : name = '$fieldName $operator_ $expected';

  @override
  bool evaluate(IEvent evt, AreContext context) {
    final actual = evt.data[fieldName];
    if (actual == null) return false;

    switch (operator_) {
      case CompareOp.equal:
        return actual == expected;
      case CompareOp.notEqual:
        return actual != expected;
      case CompareOp.greaterThan:
        return _compare(actual, expected) > 0;
      case CompareOp.greaterOrEqual:
        return _compare(actual, expected) >= 0;
      case CompareOp.lessThan:
        return _compare(actual, expected) < 0;
      case CompareOp.lessOrEqual:
        return _compare(actual, expected) <= 0;
      case CompareOp.contains:
        return actual.toString().contains(expected.toString());
      case CompareOp.startsWith:
        return actual.toString().startsWith(expected.toString());
      case CompareOp.inList:
        if (expected is List) {
          final List<dynamic> list = expected as List<dynamic>;
          return list.contains(actual);
        }
        return false;
    }
  }

  int _compare(dynamic a, dynamic b) {
    if (a is num && b is num) return a.compareTo(b);
    if (a is String && b is String) return a.compareTo(b);
    return a.toString().compareTo(b.toString());
  }
}
