import { motion, AnimatePresence } from 'framer-motion';
import { usePreviewStore } from '../../stores/previewStore';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`text-sm ${i <= rating ? 'grayscale-0' : 'grayscale opacity-30'}`}
        >
          ⭐
        </motion.span>
      ))}
    </div>
  );
}

export function ECommercePreview() {
  const ec = usePreviewStore((s) => s.ecommerce);

  const stockColor = ec.stockLevel < 10 ? 'bg-red-500' : ec.stockLevel < 30 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="relative h-full w-full p-4 flex gap-3">
      {/* Order Feed */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm">📦</span>
          <span className="text-xs font-semibold text-white/60">Orders</span>
          <span className="text-[10px] text-white/30 ml-auto">{ec.orders.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          <AnimatePresence>
            {ec.orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`rounded-lg p-2 border text-[10px] ${
                  order.status === 'cancelled'
                    ? 'border-red-500/30 bg-red-500/5'
                    : order.isVIP
                    ? 'border-yellow-500/40 bg-yellow-500/5'
                    : order.status === 'paid'
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-white/10 bg-white/3'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white/60">{order.id}</span>
                  <div className="flex items-center gap-1">
                    {order.isVIP && <span className="text-xs">👑</span>}
                    {order.status === 'paid' && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs"
                      >
                        ✅
                      </motion.span>
                    )}
                    {order.status === 'cancelled' && <span className="text-xs">❌</span>}
                  </div>
                </div>
                <div className={`font-medium ${order.status === 'cancelled' ? 'line-through text-red-400/60' : 'text-white/80'}`}>
                  ${order.total.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {ec.orders.length === 0 && (
            <div className="text-[10px] text-white/20 text-center pt-4">No orders yet</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="w-36 flex flex-col gap-3">
        {/* Stock */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs">📊</span>
            <span className="text-[10px] text-white/50">Stock Level</span>
          </div>
          <div className="h-2.5 rounded-full bg-black/30 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${stockColor}`}
              animate={{ width: `${Math.min(100, ec.stockLevel)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-[9px] text-white/40">{ec.stockLevel} units</span>
        </div>

        {/* Cart */}
        <div className="flex items-center gap-2">
          <motion.span
            animate={ec.cartAbandoned ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, repeat: ec.cartAbandoned ? Infinity : 0 }}
            className="text-xl"
          >
            🛒
          </motion.span>
          <AnimatePresence>
            {ec.cartAbandoned && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-sm"
              >
                ⚠️
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Users */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs">👥</span>
            <span className="text-[10px] text-white/50">Users</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <AnimatePresence>
              {ec.users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-6 w-6 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-[9px] text-primary-300 font-bold"
                >
                  {user.email[0].toUpperCase()}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Review */}
        <AnimatePresence>
          {ec.lastReview && (
            <motion.div
              key={ec.lastReview.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs">📝</span>
                <span className="text-[10px] text-white/50">Review</span>
              </div>
              <Stars rating={ec.lastReview.rating} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification bell */}
        <AnimatePresence>
          {ec.lastEvent && (
            <motion.div
              key={ec.lastEvent}
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
              className="text-xl self-center"
            >
              🔔
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
