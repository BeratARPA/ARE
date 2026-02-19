import 'package:test/test.dart';
import 'package:are_engine_core/are_engine_core.dart';

void main() {
  group('AreEngine', () {
    test('simple event -> action execution', () async {
      final engine = AreEngine();
      var executed = false;

      engine.registerInlineAction('test', (ctx, s) async {
        executed = true;
      });
      engine.addRule(Rule.create('r1').on('e').then('test'));

      await engine.fire('e');
      expect(executed, isTrue);
    });

    test('condition evaluation (equal)', () async {
      final engine = AreEngine();
      var executed = false;

      engine.registerInlineAction('test', (ctx, s) async {
        executed = true;
      });
      engine.addRule(
        Rule.create('r1')
            .on('e')
            .whenEquals('status', 'active')
            .then('test'),
      );

      await engine.fire('e', (e) => e.set('status', 'active'));
      expect(executed, isTrue);
    });

    test('condition evaluation (greater than)', () async {
      final engine = AreEngine();
      var executed = false;

      engine.registerInlineAction('test', (ctx, s) async {
        executed = true;
      });
      engine.addRule(
        Rule.create('r1')
            .on('e')
            .whenGreaterThan('score', 100)
            .then('test'),
      );

      await engine.fire('e', (e) => e.set('score', 150));
      expect(executed, isTrue);

      executed = false;
      await engine.fire('e', (e) => e.set('score', 50));
      expect(executed, isFalse);
    });

    test('priority ordering', () async {
      final engine = AreEngine();
      final order = <String>[];

      engine.registerInlineAction('a', (ctx, s) async => order.add('a'));
      engine.registerInlineAction('b', (ctx, s) async => order.add('b'));

      engine.addRules([
        Rule.create('low').on('e').withPriority(1).then('b'),
        Rule.create('high').on('e').withPriority(10).then('a'),
      ]);

      await engine.fire('e');
      expect(order, equals(['a', 'b']));
    });

    test('stopPipeline halts execution', () async {
      final engine = AreEngine();
      var secondRan = false;

      engine.registerInlineAction('stop', (ctx, s) async {
        ctx.stopPipeline = true;
      });
      engine.registerInlineAction('after', (ctx, s) async {
        secondRan = true;
      });

      engine.addRules([
        Rule.create('r1').on('e').withPriority(10).then('stop'),
        Rule.create('r2').on('e').withPriority(1).then('after'),
      ]);

      await engine.fire('e');
      expect(secondRan, isFalse);
    });

    test('middleware pipeline', () async {
      final engine = AreEngine();
      final sequence = <String>[];

      engine.registerInlineAction('test', (ctx, s) async {
        sequence.add('action');
      });

      engine.use(0, (ctx, next) async {
        sequence.add('before');
        await next();
        sequence.add('after');
      });

      engine.addRule(Rule.create('r1').on('e').then('test'));

      await engine.fire('e');
      expect(sequence, equals(['before', 'action', 'after']));
    });

    test('MatchMode.any', () async {
      final engine = AreEngine();
      var executed = false;

      engine.registerInlineAction('test', (ctx, s) async {
        executed = true;
      });
      engine.addRule(
        Rule.create('r1')
            .on('e')
            .withMatchMode(MatchMode.any)
            .whenEquals('a', true)
            .whenEquals('b', true)
            .then('test'),
      );

      // Only 'a' is true, but MatchMode.Any should pass
      await engine.fire('e', (e) => e.set('a', true).set('b', false));
      expect(executed, isTrue);
    });

    test('MatchMode.none', () async {
      final engine = AreEngine();
      var executed = false;

      engine.registerInlineAction('test', (ctx, s) async {
        executed = true;
      });
      engine.addRule(
        Rule.create('r1')
            .on('e')
            .withMatchMode(MatchMode.none)
            .whenEquals('banned', true)
            .then('test'),
      );

      await engine.fire('e', (e) => e.set('banned', false));
      expect(executed, isTrue);
    });

    test('MatchMode.exactlyOne', () async {
      final engine = AreEngine();
      var executed = false;

      engine.registerInlineAction('test', (ctx, s) async {
        executed = true;
      });
      engine.addRule(
        Rule.create('r1')
            .on('e')
            .withMatchMode(MatchMode.exactlyOne)
            .whenEquals('a', true)
            .whenEquals('b', true)
            .then('test'),
      );

      // Only one true -> should pass
      await engine.fire('e', (e) => e.set('a', true).set('b', false));
      expect(executed, isTrue);

      // Both true -> should fail
      executed = false;
      await engine.fire('e', (e) => e.set('a', true).set('b', true));
      expect(executed, isFalse);
    });

    test('group enable/disable', () async {
      final engine = AreEngine();
      var count = 0;

      engine.registerInlineAction('test', (ctx, s) async => count++);
      engine.addRules([
        Rule.create('r1').inGroup('g').on('e').then('test'),
        Rule.create('r2').inGroup('g').on('e').then('test'),
      ]);

      engine.disableGroup('g');
      await engine.fire('e');
      expect(count, equals(0));

      engine.enableGroup('g');
      await engine.fire('e');
      expect(count, equals(2));
    });

    test('context data sharing between actions', () async {
      final engine = AreEngine();

      engine.registerInlineAction('write', (ctx, s) async {
        ctx.set('result', 42);
      });
      engine.registerInlineAction('read', (ctx, s) async {
        ctx.set('doubled', ctx.get<int>('result')! * 2);
      });

      engine.addRules([
        Rule.create('r1').on('e').withPriority(10).then('write'),
        Rule.create('r2').on('e').withPriority(5).then('read'),
      ]);

      final ctx = AreContext();
      await engine.fire('e', null, ctx);
      expect(ctx.get<int>('doubled'), equals(84));
    });

    test('direct listener (without rules)', () async {
      final engine = AreEngine();
      var listenerFired = false;

      engine.on('e', (evt, ctx) async {
        listenerFired = true;
      });

      await engine.fire('e');
      expect(listenerFired, isTrue);
    });

    test('removeRule', () async {
      final engine = AreEngine();
      var count = 0;

      engine.registerInlineAction('test', (ctx, s) async => count++);
      engine.addRule(Rule.create('r1').on('e').then('test'));
      engine.removeRule('r1');

      await engine.fire('e');
      expect(count, equals(0));
    });

    test('multiple event types', () async {
      final engine = AreEngine();
      var count = 0;

      engine.registerInlineAction('test', (ctx, s) async => count++);
      engine.addRule(Rule.create('r1').on('a', 'b', 'c').then('test'));

      await engine.fire('a');
      await engine.fire('b');
      await engine.fire('c');
      await engine.fire('d'); // should not trigger
      expect(count, equals(3));
    });

    test('EngineResult accuracy', () async {
      final engine = AreEngine();

      engine.registerInlineAction('test', (ctx, s) async {});
      engine.addRules([
        Rule.create('fires').on('e').then('test'),
        Rule.create('skips').on('e').whenEquals('x', 999).then('test'),
      ]);

      final result = await engine.fire('e', (e) => e.set('x', 1));
      expect(result.firedRules.length, equals(1));
      expect(result.skippedRules.length, equals(1));
      expect(result.firedRules[0].ruleId, equals('fires'));
      expect(result.skippedRules[0].ruleId, equals('skips'));
    });

    test('ActionSettings passes values', () async {
      final engine = AreEngine();
      String? received;

      engine.registerInlineAction('test', (ctx, s) async {
        received = s.get<String>('msg');
      });
      engine.addRule(
        Rule.create('r1').on('e').then('test', (s) => s.set('msg', 'hello')),
      );

      await engine.fire('e');
      expect(received, equals('hello'));
    });

    test('skipRemainingActions', () async {
      final engine = AreEngine();
      var secondRan = false;

      engine.registerInlineAction('skip', (ctx, s) async {
        ctx.skipRemainingActions = true;
      });
      engine.registerInlineAction('after', (ctx, s) async {
        secondRan = true;
      });

      engine.addRule(
        Rule.create('r1')
            .on('e')
            .then('skip', null, 0)
            .then('after', null, 1),
      );

      await engine.fire('e');
      expect(secondRan, isFalse);
    });

    test('lambda condition with context', () async {
      final engine = AreEngine();
      var executed = false;

      engine.registerInlineAction('test', (ctx, s) async {
        executed = true;
      });

      engine.addRule(
        Rule.create('r1')
            .on('e')
            .when('custom', (evt, ctx) {
              return evt.data['total'] > 1000 && ctx.get<String>('user_type') == 'vip';
            })
            .then('test'),
      );

      final ctx = AreContext()..set('user_type', 'vip');
      await engine.fire('e', (e) => e.set('total', 1500), ctx);
      expect(executed, isTrue);
    });
  });
}
