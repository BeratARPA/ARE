// =============================================================================
// ARE.Core - Game Engine Example (JavaScript)
// Demonstrates: Custom Actions, Fluent Rules, MatchMode, Middleware, Priority
// Run: node game.js
// =============================================================================

const { AreEngine, Rule, MatchMode } = require('are-engine-core');

// =============================================================================
// Custom Action Objects
// =============================================================================

// -- DamageAction: Applies damage to a target --
const DamageAction = {
    actionType: 'damage',
    async execute(context, settings) {
        const amount = settings.get('amount') || 0;
        const target = context.get('target') || 'player';

        console.log(`  [DAMAGE] ${target} took ${amount} damage!`);

        // In a real game: player.health -= amount;
        context.set('lastDamage', amount);
    }
};

// -- SpawnEnemyAction: Spawns enemies into the game world --
const SpawnEnemyAction = {
    actionType: 'spawn_enemy',
    async execute(context, settings) {
        const enemyType = settings.get('type') || 'goblin';
        let count = settings.get('count') || 0;
        if (count === 0) count = 1;

        console.log(`  [SPAWN] ${count}x ${enemyType} spawned!`);
    }
};

// -- PlaySoundAction: Plays a sound effect --
const PlaySoundAction = {
    actionType: 'play_sound',
    async execute(context, settings) {
        const sound = settings.get('clip') || 'default';

        console.log(`  [SOUND] Playing: ${sound}`);
    }
};

// -- ShowUIAction: Displays a UI panel with a message --
const ShowUIAction = {
    actionType: 'show_ui',
    async execute(context, settings) {
        const panel = settings.get('panel') || 'info';
        const message = settings.get('message') || '';

        console.log(`  [UI] Displayed: [${panel}] ${message}`);
    }
};

// =============================================================================
// Main Example
// =============================================================================

(async function main() {
    console.log('===================================================');
    console.log('  EXAMPLE: GAME ENGINE');
    console.log('===================================================\n');

    const engine = new AreEngine();

    // Enable engine logging to the console
    engine.onLog = (msg) => console.log(msg);

    // -- Register custom actions --
    engine.registerAction(DamageAction);
    engine.registerAction(SpawnEnemyAction);
    engine.registerAction(PlaySoundAction);
    engine.registerAction(ShowUIAction);

    // =========================================================================
    // Define Rules
    // =========================================================================

    // Rule 1: When the player enters a fire zone -> take damage + play burn sound
    engine.addRule(
        Rule.create('fire_zone_damage')
            .inGroup('combat')
            .withPriority(10)
            .on('player.enter_zone')
            .whenEquals('zone_type', 'fire')
            .then('damage', s => s.set('amount', 25), 0)
            .then('play_sound', s => s.set('clip', 'fire_burn'), 1)
    );

    // Rule 2: When the player enters a boss room -> spawn dragon + roar + show boss UI
    //   Uses MatchMode.All: ALL conditions must be satisfied (zone is boss AND level >= 5)
    engine.addRule(
        Rule.create('boss_room_spawn')
            .inGroup('spawning')
            .withPriority(5)
            .on('player.enter_zone')
            .withMatchMode(MatchMode.All)
            .whenEquals('zone_type', 'boss')
            .when('level_check', (evt, ctx) => {
                const level = evt.data['player_level'] || 0;
                return level >= 5;
            })
            .then('spawn_enemy', s => s.set('type', 'dragon').set('count', 1))
            .then('play_sound', s => s.set('clip', 'boss_roar'))
            .then('show_ui', s => s.set('panel', 'boss_health').set('message', 'A dragon has appeared!'))
    );

    // Rule 3: When the player dies (health <= 0) -> death sound + game over screen
    //   Highest priority so death effects always run first
    engine.addRule(
        Rule.create('player_death_effects')
            .inGroup('death')
            .withPriority(100) // Highest priority
            .on('player.health_changed')
            .when('is_dead', (evt, ctx) => {
                const hp = evt.data['health'] !== undefined ? evt.data['health'] : 100;
                return hp <= 0;
            })
            .then('play_sound', s => s.set('clip', 'death_sound'))
            .then('show_ui', s => s.set('panel', 'game_over').set('message', 'You died!'))
    );

    // =========================================================================
    // Middleware: Log timing for every event
    // =========================================================================

    engine.use(0, async (ctx, next) => {
        const start = Date.now();

        console.log(`\n>> Middleware: Event starting -> ${ctx.currentEvent ? ctx.currentEvent.eventType : 'unknown'}`);

        await next();

        const elapsed = Date.now() - start;

        console.log(`>> Middleware: Event finished (${elapsed}ms)\n`);
    });

    // =========================================================================
    // Test Fires
    // =========================================================================

    // TEST 1: Player enters a fire zone
    console.log('\n--- TEST 1: Entering a fire zone ---');
    await engine.fire('player.enter_zone', e => e
        .set('zone_type', 'fire')
        .set('player_level', 3));

    // TEST 2: Player enters a boss zone (low level - should NOT spawn dragon)
    console.log('\n--- TEST 2: Entering boss zone (low level) ---');
    await engine.fire('player.enter_zone', e => e
        .set('zone_type', 'boss')
        .set('player_level', 3)); // level < 5, no spawn

    // TEST 3: Player enters a boss zone (sufficient level - SHOULD spawn dragon)
    console.log('\n--- TEST 3: Entering boss zone (sufficient level) ---');
    await engine.fire('player.enter_zone', e => e
        .set('zone_type', 'boss')
        .set('player_level', 7)); // level >= 5, dragon spawn!

    // TEST 4: Player death
    console.log('\n--- TEST 4: Player death ---');
    await engine.fire('player.health_changed', e => e
        .set('health', 0)
        .set('cause', 'fire'));

    console.log('===================================================');
    console.log('  Game example completed.');
    console.log('===================================================');
})();
