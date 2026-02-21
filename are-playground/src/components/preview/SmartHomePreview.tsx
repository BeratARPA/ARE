import { motion, AnimatePresence } from 'framer-motion';
import { usePreviewStore } from '../../stores/previewStore';

function Light({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        animate={{
          backgroundColor: on ? '#facc15' : '#374151',
          boxShadow: on ? '0 0 12px rgba(250,204,21,0.5)' : '0 0 0px transparent',
        }}
        className="h-4 w-4 rounded-full"
      />
      <span className="text-[8px] text-white/40">{label}</span>
    </div>
  );
}

function Room({ name, children, highlighted }: { name: string; children?: React.ReactNode; highlighted?: boolean }) {
  return (
    <div className={`relative flex-1 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center min-h-[80px] transition-colors ${highlighted ? 'bg-blue-500/10 border-blue-500/30' : ''}`}>
      <span className="text-[9px] text-white/30 absolute top-1 left-2">{name}</span>
      {children}
      <AnimatePresence>
        {highlighted && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute h-4 w-4 rounded-full bg-blue-400"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function SmartHomePreview() {
  const sh = usePreviewStore((s) => s.smartHome);

  const tempColor = sh.temperature > 28 ? 'bg-red-500' : sh.temperature < 18 ? 'bg-blue-500' : 'bg-green-500';
  const tempPercent = Math.min(100, Math.max(0, ((sh.temperature - 10) / 30) * 100));

  return (
    <div className={`relative h-full w-full p-4 flex flex-col gap-2 ${sh.alarmActive ? '' : ''}`}>
      {/* Alarm Flash */}
      <AnimatePresence>
        {sh.alarmActive && (
          <motion.div
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute inset-0 border-4 border-red-500 rounded-xl pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      {/* Roof / Alarm */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏠</span>
          <span className="text-xs text-white/50 font-mono">Smart Home</span>
        </div>
        <div className="flex items-center gap-2">
          {sh.alarmActive && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-sm"
            >
              🚨
            </motion.span>
          )}
          {sh.acOn && (
            <motion.span
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm"
            >
              ❄️
            </motion.span>
          )}
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="flex-1 grid grid-cols-3 gap-2">
        <Room name="Bedroom" highlighted={sh.motionRoom === 'bedroom'}>
          <Light on={sh.lightsOn.bedroom} label="💡" />
          <div className="flex items-center gap-1 mt-1">
            {sh.blindsOpen ? (
              <span className="text-xs">🌅</span>
            ) : (
              <span className="text-xs opacity-30">🌙</span>
            )}
          </div>
        </Room>

        <Room name="Living Room" highlighted={sh.motionRoom === 'living_room'}>
          <Light on={sh.lightsOn.living_room} label="💡" />
          {/* Temperature gauge */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs">🌡️</span>
            <div className="w-12 h-2 rounded-full bg-black/30 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${tempColor}`}
                animate={{ width: `${tempPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[9px] text-white/50">{sh.temperature}°</span>
          </div>
        </Room>

        <Room name="Kitchen" highlighted={sh.motionRoom === 'kitchen'}>
          <Light on={sh.lightsOn.kitchen} label="💡" />
          {sh.coffeeOn && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 mt-1"
            >
              <span className="text-sm">☕</span>
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[10px] text-white/30"
              >
                ♨️
              </motion.span>
            </motion.div>
          )}
        </Room>
      </div>

      {/* Bottom: Hallway / Door */}
      <div className="flex items-center gap-2">
        <Room name="Hallway" highlighted={sh.motionRoom === 'hallway'}>
          <Light on={sh.lightsOn.hallway} label="💡" />
        </Room>
        <div className="flex flex-col items-center gap-1 px-3">
          <motion.div
            animate={{ rotateY: sh.doorOpen ? 60 : 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl origin-left"
          >
            🚪
          </motion.div>
          <span className="text-[8px] text-white/40">{sh.doorOpen ? 'Open' : 'Closed'}</span>
        </div>
      </div>
    </div>
  );
}
