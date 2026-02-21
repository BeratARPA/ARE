import { motion, AnimatePresence } from 'framer-motion';
import { usePreviewStore } from '../../stores/previewStore';

const zoneBackgrounds: Record<string, string> = {
  fire: 'from-orange-950/60 via-red-950/40 to-orange-950/60',
  boss_room: 'from-purple-950/60 via-gray-950/40 to-purple-950/60',
  forest: 'from-emerald-950/40 via-surface-950/40 to-emerald-950/40',
  dungeon: 'from-gray-900/60 via-surface-950/60 to-gray-900/60',
  volcano: 'from-red-950/60 via-orange-950/40 to-red-950/60',
};

const enemyEmojis: Record<string, string> = {
  elite: '👹', boss: '🐉', normal: '💀', dragon: '🐲', default: '👾',
};

export function RPGPreview() {
  const rpg = usePreviewStore((s) => s.rpgGame);
  const hpPercent = (rpg.playerHP / rpg.maxHP) * 100;
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500';
  const bgGradient = zoneBackgrounds[rpg.currentZone] || zoneBackgrounds.forest;

  return (
    <div className={`relative h-full w-full bg-gradient-to-r ${bgGradient} transition-all duration-1000 flex`}>
      {/* Player Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <motion.div
          animate={rpg.lastEvent === 'player.attack' ? { x: [0, 20, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="text-5xl"
        >
          {rpg.isDead ? '💀' : '⚔️'}
        </motion.div>
        <div className="mt-3 w-32">
          <div className="flex items-center justify-between text-[10px] text-white/60 mb-1">
            <span>HP</span>
            <span>{rpg.playerHP}/{rpg.maxHP}</span>
          </div>
          <div className="h-2.5 rounded-full bg-black/40 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${hpColor}`}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        {/* Zone label */}
        <div className="mt-2 rounded-full bg-black/30 px-3 py-0.5 text-[10px] text-white/50 font-mono">
          {rpg.currentZone}
        </div>
        {/* Loot */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          <AnimatePresence>
            {rpg.lootItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 rounded-md bg-yellow-500/20 border border-yellow-500/30 px-1.5 py-0.5 text-[10px] text-yellow-300"
              >
                🎒 {item.name}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Battle Zone */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Damage Numbers */}
        <AnimatePresence>
          {rpg.lastDamage && (
            <motion.div
              key={rpg.lastDamage.id}
              initial={{ opacity: 1, y: 0, scale: 1.2 }}
              animate={{ opacity: 0, y: -60, scale: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute top-8 text-2xl font-bold text-red-400 z-10"
              style={{ textShadow: '0 0 8px rgba(255,0,0,0.5)' }}
            >
              -{rpg.lastDamage.value}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enemies */}
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <AnimatePresence>
            {rpg.enemies.map((enemy) => (
              <motion.div
                key={enemy.id}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 20, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="text-4xl">{enemyEmojis[enemy.type] || enemyEmojis.default}</div>
                <div className="text-[9px] text-white/50 mt-1 font-mono">{enemy.name}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          {rpg.enemies.length === 0 && !rpg.showCelebration && !rpg.isDead && (
            <div className="text-surface-200/20 text-xs">No enemies</div>
          )}
        </div>

        {/* Celebration */}
        <AnimatePresence>
          {rpg.showCelebration && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 5 }}
                  className="text-5xl"
                >
                  🏆
                </motion.div>
                <div className="text-lg font-bold text-yellow-400 mt-2" style={{ textShadow: '0 0 12px rgba(255,200,0,0.5)' }}>
                  Victory!
                </div>
                <div className="flex gap-1 justify-center mt-1">
                  {['✨', '⭐', '🌟', '✨', '⭐'].map((e, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-lg"
                    >
                      {e}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Death Overlay */}
      <AnimatePresence>
        {rpg.isDead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-red-950/70 flex flex-col items-center justify-center z-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-6xl"
            >
              💀
            </motion.div>
            <div className="text-xl font-bold text-red-400 mt-3">Game Over</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low HP Warning Flash */}
      <AnimatePresence>
        {rpg.playerHP > 0 && rpg.playerHP < 20 && (
          <motion.div
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
