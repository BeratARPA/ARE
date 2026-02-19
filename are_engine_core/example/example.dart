import 'package:are_engine_core/are_engine_core.dart';

// -- Custom Actions --

class SendEmailAction implements IAction {
  @override
  String get actionType => 'send_email';

  @override
  Future<void> execute(AreContext context, ActionSettings settings) async {
    final to = settings.get<String>('to') ?? context.get<String>('customer_email') ?? '';
    final template = settings.get<String>('template') ?? 'default';
    print('  [Email] Sent to $to (template: $template)');
  }
}

class ApplyDiscountAction implements IAction {
  @override
  String get actionType => 'apply_discount';

  @override
  Future<void> execute(AreContext context, ActionSettings settings) async {
    final percent = settings.get<int>('percent') ?? 0;
    print('  [Discount] $percent% discount applied!');
    context.set('discount_applied', percent);
  }
}

class NotifySlackAction implements IAction {
  @override
  String get actionType => 'notify_slack';

  @override
  Future<void> execute(AreContext context, ActionSettings settings) async {
    final channel = settings.get<String>('channel') ?? '#orders';
    final msg = settings.get<String>('message') ?? 'Notification';
    print('  [Slack] $channel: $msg');
  }
}

void main() async {
  print('===========================================');
  print('  ARE Engine - Dart Example');
  print('===========================================\n');

  final engine = AreEngine();

  engine.onLog = print;

  // Register actions
  engine.registerAction(SendEmailAction());
  engine.registerAction(ApplyDiscountAction());
  engine.registerAction(NotifySlackAction());

  // Rule 1: High-value order -> Slack + VIP email
  engine.addRule(
    Rule.create('high_value_order')
        .inGroup('orders')
        .withPriority(10)
        .on('order.created')
        .whenGreaterThan('total', 5000.0)
        .then('notify_slack', (s) => s
            .set('channel', '#vip-orders')
            .set('message', 'High-value order received!'))
        .then('send_email', (s) => s.set('template', 'vip_welcome')),
  );

  // Rule 2: First order -> 10% discount + welcome email
  engine.addRule(
    Rule.create('first_order_discount')
        .inGroup('marketing')
        .withPriority(5)
        .on('order.created')
        .whenEquals('is_first_order', true)
        .then('apply_discount', (s) => s.set('percent', 10))
        .then('send_email', (s) => s.set('template', 'first_order_welcome')),
  );

  // Audit middleware
  engine.use(0, (ctx, next) async {
    final evt = ctx.currentEvent!;
    print('  [Audit] Event received: ${evt.eventType}');
    await next();
    print('  [Audit] Event processed: ${evt.eventType}');
  });

  // Test 1: High-value first order
  print('--- TEST 1: High-value first order ---');
  await engine.fire('order.created', (e) => e
      .set('total', 7500.0)
      .set('is_first_order', true)
      .set('customer_email', 'alice@example.com'));

  // Test 2: Normal order
  print('\n--- TEST 2: Normal order ---');
  await engine.fire('order.created', (e) => e
      .set('total', 150.0)
      .set('is_first_order', false));

  print('\nDone.');
}
