// are-core test
// Çalıştır: node test/test.js

const { AreEngine, Rule, GameEvent, AreContext, MatchMode } = require('../dist/are-core.js');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) {
        console.log('  ✅ ' + name);
        passed++;
    } else {
        console.log('  ❌ ' + name);
        failed++;
    }
}

async function runTests() {

    console.log('\n══ ENGINE TESTS ══\n');

    // Test 1: Basit event → action
    {
        const engine = new AreEngine();
        let executed = false;
        engine.registerAction('test', async () => { executed = true; });
        engine.addRule(Rule.create('r1').on('e').then('test'));
        await engine.fire('e');
        assert(executed, 'Basit event → action çalıştı');
    }

    // Test 2: Koşul sağlanmazsa action çalışmaz
    {
        const engine = new AreEngine();
        let executed = false;
        engine.registerAction('test', async () => { executed = true; });
        engine.addRule(Rule.create('r1').on('e').whenEquals('x', 5).then('test'));
        await engine.fire('e', e => e.set('x', 3));
        assert(!executed, 'Koşul sağlanmadığında action çalışmadı');
    }

    // Test 3: Koşul sağlandığında action çalışır
    {
        const engine = new AreEngine();
        let executed = false;
        engine.registerAction('test', async () => { executed = true; });
        engine.addRule(Rule.create('r1').on('e').whenEquals('x', 5).then('test'));
        await engine.fire('e', e => e.set('x', 5));
        assert(executed, 'Koşul sağlandığında action çalıştı');
    }

    // Test 4: GreaterThan
    {
        const engine = new AreEngine();
        let executed = false;
        engine.registerAction('test', async () => { executed = true; });
        engine.addRule(Rule.create('r1').on('e').whenGreaterThan('score', 100).then('test'));
        await engine.fire('e', e => e.set('score', 200));
        assert(executed, 'GreaterThan koşulu çalıştı');
    }

    // Test 5: Priority sıralaması
    {
        const order = [];
        const engine = new AreEngine();
        engine.registerAction('a', async () => order.push('a'));
        engine.registerAction('b', async () => order.push('b'));
        engine.addRules(
            Rule.create('low').on('e').withPriority(1).then('a'),
            Rule.create('high').on('e').withPriority(10).then('b')
        );
        await engine.fire('e');
        assert(order[0] === 'b' && order[1] === 'a', 'Priority: yüksek önce çalıştı');
    }

    // Test 6: StopPipeline
    {
        const engine = new AreEngine();
        let secondRan = false;
        engine.registerAction('stopper', async (ctx) => { ctx.stopPipeline = true; });
        engine.registerAction('never', async () => { secondRan = true; });
        engine.addRules(
            Rule.create('first').on('e').withPriority(10).then('stopper'),
            Rule.create('second').on('e').withPriority(1).then('never')
        );
        const result = await engine.fire('e');
        assert(result.pipelineStopped && !secondRan, 'StopPipeline çalıştı');
    }

    // Test 7: Middleware
    {
        const order = [];
        const engine = new AreEngine();
        engine.registerAction('action', async () => order.push('action'));
        engine.use(0, async (ctx, next) => {
            order.push('before');
            await next();
            order.push('after');
        });
        engine.addRule(Rule.create('r').on('e').then('action'));
        await engine.fire('e');
        assert(
            order[0] === 'before' && order[1] === 'action' && order[2] === 'after',
            'Middleware before/after çalıştı'
        );
    }

    // Test 8: MatchMode.Any
    {
        const engine = new AreEngine();
        let executed = false;
        engine.registerAction('test', async () => { executed = true; });
        engine.addRule(
            Rule.create('r').on('e')
                .withMatchMode(MatchMode.Any)
                .whenEquals('a', 1)
                .whenEquals('b', 2)
                .then('test')
        );
        await engine.fire('e', e => e.set('a', 1).set('b', 99)); // sadece a doğru
        assert(executed, 'MatchMode.Any: bir koşul yetti');
    }

    // Test 9: MatchMode.None
    {
        const engine = new AreEngine();
        let executed = false;
        engine.registerAction('test', async () => { executed = true; });
        engine.addRule(
            Rule.create('r').on('e')
                .withMatchMode(MatchMode.None)
                .whenEquals('banned', true)
                .then('test')
        );
        await engine.fire('e', e => e.set('banned', false));
        assert(executed, 'MatchMode.None: koşul false iken geçti');
    }

    // Test 10: Group enable/disable
    {
        const engine = new AreEngine();
        let count = 0;
        engine.registerAction('test', async () => { count++; });
        engine.addRules(
            Rule.create('r1').inGroup('g').on('e').then('test'),
            Rule.create('r2').inGroup('g').on('e').then('test')
        );

        engine.disableGroup('g');
        await engine.fire('e');
        assert(count === 0, 'Grup kapalıyken hiçbiri çalışmadı');

        engine.enableGroup('g');
        await engine.fire('e');
        assert(count === 2, 'Grup açıkken ikisi de çalıştı');
    }

    // Test 11: ActionSettings
    {
        const engine = new AreEngine();
        let receivedValue = null;
        engine.registerAction('test', async (ctx, s) => { receivedValue = s.get('msg'); });
        engine.addRule(Rule.create('r').on('e').then('test', s => s.set('msg', 'hello')));
        await engine.fire('e');
        assert(receivedValue === 'hello', 'ActionSettings değer taşıdı');
    }

    // Test 12: Context veri paylaşımı
    {
        const engine = new AreEngine();
        engine.registerAction('write', async (ctx) => { ctx.set('result', 42); });
        engine.registerAction('read', async (ctx) => { ctx.set('doubled', ctx.get('result') * 2); });
        engine.addRules(
            Rule.create('r1').on('e').withPriority(10).then('write'),
            Rule.create('r2').on('e').withPriority(5).then('read')
        );
        const ctx = new AreContext();
        await engine.fire('e', null, ctx);
        assert(ctx.get('doubled') === 84, 'Context: action\'lar arası veri paylaşımı');
    }

    // Test 13: Doğrudan listener
    {
        const engine = new AreEngine();
        let listenerFired = false;
        engine.on('e', async () => { listenerFired = true; });
        await engine.fire('e');
        assert(listenerFired, 'Doğrudan listener (kuralsız) çalıştı');
    }

    // Test 14: RemoveRule
    {
        const engine = new AreEngine();
        let count = 0;
        engine.registerAction('test', async () => { count++; });
        engine.addRule(Rule.create('r1').on('e').then('test'));
        engine.removeRule('r1');
        await engine.fire('e');
        assert(count === 0, 'removeRule: kaldırılan kural çalışmadı');
    }

    // Test 15: Birden fazla event tipi dinleme
    {
        const engine = new AreEngine();
        let count = 0;
        engine.registerAction('test', async () => { count++; });
        engine.addRule(Rule.create('r').on('a', 'b', 'c').then('test'));
        await engine.fire('a');
        await engine.fire('b');
        await engine.fire('c');
        await engine.fire('d'); // tetiklenmemeli
        assert(count === 3, 'Çoklu event tipi: 3 tetiklendi, 1 tetiklenmedi');
    }

    // Test 16: EngineResult doğruluğu
    {
        const engine = new AreEngine();
        engine.registerAction('test', async () => { });
        engine.addRules(
            Rule.create('fires').on('e').then('test'),
            Rule.create('skips').on('e').whenEquals('x', 999).then('test')
        );
        const result = await engine.fire('e', e => e.set('x', 1));
        assert(
            result.firedRules.length === 1 &&
            result.skippedRules.length === 1 &&
            result.firedRules[0].ruleId === 'fires' &&
            result.skippedRules[0].ruleId === 'skips',
            'EngineResult: fired/skipped doğru raporlandı'
        );
    }

    // Sonuç
    console.log('\n══════════════════════════');
    console.log('  ' + passed + ' geçti, ' + failed + ' kaldı');
    console.log('══════════════════════════\n');

    if (failed > 0) process.exit(1);
}

runTests().catch(console.error);