// ============================================================================
// ARE Engine - E-Commerce Example
// JavaScript equivalent of the C# WebApi/E-Commerce example
//
// Demonstrates:
//   - Custom action objects (send_email, apply_discount, notify_slack, update_stock)
//   - Fluent rule builder for e-commerce scenarios
//   - Audit middleware with timestamps
//   - Multiple test fires covering various business scenarios
//
// Run: node ecommerce.js
// ============================================================================

'use strict';

const { AreEngine, Rule } = require('are-engine-core');

// ── Custom Actions ──────────────────────────────────────────────────────────

/**
 * SendEmailAction - Sends an email to a customer.
 * Reads the recipient from action settings or falls back to the context's customer_email.
 */
const SendEmailAction = {
    actionType: 'send_email',
    async execute(context, settings) {
        const to = settings.get('to') || context.get('customer_email') || '';
        const template = settings.get('template') || 'default';
        console.log(`  [Email] Sent to ${to} (template: ${template})`);
    }
};

/**
 * ApplyDiscountAction - Applies a percentage discount to the current order.
 * Stores the applied discount in the context for downstream actions to read.
 */
const ApplyDiscountAction = {
    actionType: 'apply_discount',
    async execute(context, settings) {
        const percent = settings.get('percent');
        console.log(`  [Discount] ${percent}% discount applied!`);
        context.set('discount_applied', percent);
    }
};

/**
 * NotifySlackAction - Sends a notification to a Slack channel.
 */
const NotifySlackAction = {
    actionType: 'notify_slack',
    async execute(context, settings) {
        const channel = settings.get('channel') || '#orders';
        const msg = settings.get('message') || 'Notification';
        console.log(`  [Slack] ${channel}: ${msg}`);
    }
};

/**
 * UpdateStockAction - Restores or updates product stock levels.
 */
const UpdateStockAction = {
    actionType: 'update_stock',
    async execute(context, settings) {
        console.log('  [Stock] Stock levels updated');
    }
};

// ── Main ────────────────────────────────────────────────────────────────────

(async function main() {

    console.log('');
    console.log('===========================================');
    console.log('  ARE ENGINE - E-COMMERCE EXAMPLE');
    console.log('===========================================');
    console.log('');

    // Create engine and enable logging
    const engine = new AreEngine();
    engine.onLog = console.log;

    // ── Register Actions ────────────────────────────────────────────────

    engine.registerAction(SendEmailAction);
    engine.registerAction(ApplyDiscountAction);
    engine.registerAction(NotifySlackAction);
    engine.registerAction(UpdateStockAction);

    // ── Define Rules ────────────────────────────────────────────────────

    // Rule 1: High-value order -> Slack notification + VIP welcome email
    engine.addRule(
        Rule.create('high_value_order')
            .inGroup('orders')
            .withPriority(10)
            .on('order.created')
            .whenGreaterThan('total', 5000.0)
            .then('notify_slack', s => s
                .set('channel', '#vip-orders')
                .set('message', 'High-value order received!'))
            .then('send_email', s => s.set('template', 'vip_welcome'))
    );

    // Rule 2: First order -> 10% welcome discount + welcome email
    engine.addRule(
        Rule.create('first_order_discount')
            .inGroup('marketing')
            .withPriority(5)
            .on('order.created')
            .whenEquals('is_first_order', true)
            .then('apply_discount', s => s.set('percent', 10))
            .then('send_email', s => s.set('template', 'first_order_welcome'))
    );

    // Rule 3: Low stock alert -> Slack notification + alert email
    engine.addRule(
        Rule.create('low_stock_alert')
            .inGroup('inventory')
            .withPriority(20)
            .on('stock.updated')
            .whenLessThan('quantity', 10)
            .then('notify_slack', s => s
                .set('channel', '#inventory')
                .set('message', 'Stock at critical level!'))
            .then('send_email', s => s.set('template', 'low_stock_alert'))
    );

    // Rule 4: Order cancelled -> Restore stock + notify customer + Slack alert
    engine.addRule(
        Rule.create('order_cancelled')
            .inGroup('orders')
            .withPriority(15)
            .on('order.cancelled')
            .then('update_stock')
            .then('send_email', s => s.set('template', 'order_cancelled'))
            .then('notify_slack', s => s
                .set('channel', '#orders')
                .set('message', 'Order has been cancelled'))
    );

    // ── Audit Middleware ─────────────────────────────────────────────────
    // Logs every event with a timestamp before and after processing.

    engine.use(0, async (ctx, next) => {
        const evt = ctx.currentEvent;
        const ts = evt.timestamp.toTimeString().split(' ')[0]; // HH:MM:SS
        console.log(`  [Audit] [${ts}] Event received: ${evt.eventType}`);
        await next();
        console.log(`  [Audit] [${ts}] Event processed: ${evt.eventType}`);
    });

    // ── Test Fires ──────────────────────────────────────────────────────

    // TEST 1: High-value first order
    // Should trigger: high_value_order (total > 5000) AND first_order_discount (is_first_order)
    console.log('--- TEST 1: High-value first order ---');
    await engine.fire('order.created', e => e
        .set('total', 7500.0)
        .set('is_first_order', true)
        .set('customer_email', 'alice@example.com'));

    // TEST 2: Normal order (no rules should match)
    // total <= 5000 and is_first_order is false -> both rules skipped
    console.log('\n--- TEST 2: Normal order ---');
    await engine.fire('order.created', e => e
        .set('total', 150.0)
        .set('is_first_order', false));

    // TEST 3: Low stock alert
    // quantity < 10 -> low_stock_alert triggers
    console.log('\n--- TEST 3: Low stock ---');
    await engine.fire('stock.updated', e => e
        .set('product_id', 'SKU-001')
        .set('quantity', 5));

    // TEST 4: Order cancelled
    // No conditions -> always triggers on order.cancelled
    console.log('\n--- TEST 4: Order cancelled ---');
    await engine.fire('order.cancelled', e => e
        .set('order_id', 'ORD-12345'));

    console.log('\n===========================================');
    console.log('  All tests completed.');
    console.log('===========================================');
    console.log('');

})();
