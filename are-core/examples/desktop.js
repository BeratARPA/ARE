// ============================================================================
// ARE Engine - Desktop / POS Example
// JavaScript equivalent of the C# ARE.Examples.Desktop project
//
// Demonstrates:
//   - Custom action objects (show_notification, save_log, lock_form)
//   - Rules for desktop/POS scenarios (login lockout, license expiring)
//   - Lambda conditions via .when()
//   - Listening on multiple event types with .on("a", "b")
//
// Run:  node desktop.js
// ============================================================================

const { AreEngine, Rule } = require('are-engine-core');

// ── Custom Action: show_notification ────────────────────────────────────────
// Displays a notification to the user with a severity level, title, and message.

const showNotificationAction = {
    actionType: 'show_notification',
    async execute(_context, settings) {
        const title    = settings.get('title')    || 'Notification';
        const message  = settings.get('message')  || '';
        const severity = settings.get('severity') || 'info';

        console.log(`  [${severity.toUpperCase()}] ${title}: ${message}`);
    }
};

// ── Custom Action: save_log ─────────────────────────────────────────────────
// Persists a log entry. In a real app this would write to a file or database.

const saveLogAction = {
    actionType: 'save_log',
    async execute(context, settings) {
        const entry = settings.get('entry')
            || (context.currentEvent && context.currentEvent.eventType)
            || '';

        console.log(`  Log saved: ${entry}`);
    }
};

// ── Custom Action: lock_form ────────────────────────────────────────────────
// Locks the current UI form (e.g., login dialog) with a given reason.

const lockFormAction = {
    actionType: 'lock_form',
    async execute(_context, settings) {
        const reason = settings.get('reason') || '';

        console.log(`  Form locked: ${reason}`);
    }
};

// ── Main ────────────────────────────────────────────────────────────────────

(async () => {
    console.log('');
    console.log('===================================================');
    console.log('  EXAMPLE: DESKTOP / POS (ARE Engine - JavaScript)');
    console.log('===================================================');
    console.log('');

    // ── 1. Create the engine and register actions ───────────────────────

    const engine = new AreEngine();

    // Forward engine log messages to the console
    engine.onLog = (msg) => console.log(msg);

    engine.registerAction(showNotificationAction);
    engine.registerAction(saveLogAction);
    engine.registerAction(lockFormAction);

    // ── 2. Define rules ─────────────────────────────────────────────────

    // Rule: Login lockout
    // After 3 failed login attempts, lock the form, save a log, and
    // show an error notification.
    engine.addRule(
        Rule.create('login_lockout')
            .withPriority(100)
            .on('user.login_failed')
            .when('attempt_check', (evt, _ctx) => {
                const attempts = evt.data.attempt_count || 0;
                return attempts >= 3;
            })
            .then('lock_form', (s) => s
                .set('reason', '3 failed login attempts'))
            .then('save_log', (s) => s
                .set('entry', 'Account locked - too many attempts'))
            .then('show_notification', (s) => s
                .set('title', 'Account Locked')
                .set('message', '3 failed attempts. Please wait 5 minutes.')
                .set('severity', 'error'))
    );

    // Rule: License expiring
    // Listens on BOTH "app.started" and "license.checked" events.
    // If the remaining days are 7 or fewer, warn the user.
    engine.addRule(
        Rule.create('license_expiring')
            .withPriority(50)
            .on('app.started', 'license.checked')
            .when('expiring_soon', (evt, _ctx) => {
                const days = evt.data.days_remaining != null
                    ? evt.data.days_remaining
                    : 999;
                return days <= 7;
            })
            .then('show_notification', (s) => s
                .set('title', 'License Warning')
                .set('message', 'Your license expires in 7 days!')
                .set('severity', 'warning'))
    );

    // ── 3. Tests ────────────────────────────────────────────────────────

    // TEST 1: 3rd failed login triggers the lockout rule
    console.log('--- TEST 1: 3rd failed login ---');
    await engine.fire('user.login_failed', (e) => e
        .set('attempt_count', 3)
        .set('username', 'admin'));

    console.log('');

    // TEST 2: License check with 5 days remaining triggers the warning
    console.log('--- TEST 2: License check (via app.started) ---');
    await engine.fire('app.started', (e) => e
        .set('days_remaining', 5));

    console.log('');
    console.log('Done.');
})();
