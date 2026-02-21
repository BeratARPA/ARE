import { create } from 'zustand';

interface RPGState {
  playerHP: number;
  maxHP: number;
  currentZone: string;
  enemies: Array<{ id: string; name: string; type: string }>;
  lootItems: Array<{ id: string; name: string }>;
  isDead: boolean;
  lastDamage: { value: number; id: string } | null;
  showCelebration: boolean;
  lastEvent: string | null;
}

interface SmartHomeState {
  temperature: number;
  acOn: boolean;
  lightsOn: Record<string, boolean>;
  doorOpen: boolean;
  alarmActive: boolean;
  coffeeOn: boolean;
  blindsOpen: boolean;
  motionRoom: string | null;
  lastEvent: string | null;
}

interface ECommerceState {
  orders: Array<{ id: string; total: number; status: string; isVIP: boolean }>;
  stockLevel: number;
  cartAbandoned: boolean;
  users: Array<{ id: string; email: string }>;
  lastReview: { rating: number; id: string } | null;
  lastEvent: string | null;
}

interface PreviewState {
  rpgGame: RPGState;
  smartHome: SmartHomeState;
  ecommerce: ECommerceState;
  handleResult: (scenarioId: string, eventType: string, data: Record<string, unknown>, firedRuleIds: string[]) => void;
  resetPreview: (scenarioId: string) => void;
}

const defaultRPG: RPGState = {
  playerHP: 100, maxHP: 100, currentZone: 'forest', enemies: [], lootItems: [],
  isDead: false, lastDamage: null, showCelebration: false, lastEvent: null,
};

const defaultSmartHome: SmartHomeState = {
  temperature: 22, acOn: false,
  lightsOn: { living_room: false, hallway: false, bedroom: false, kitchen: false },
  doorOpen: false, alarmActive: false, coffeeOn: false, blindsOpen: false,
  motionRoom: null, lastEvent: null,
};

const defaultECommerce: ECommerceState = {
  orders: [], stockLevel: 50, cartAbandoned: false, users: [],
  lastReview: null, lastEvent: null,
};

let idCounter = 0;
const uid = () => `${++idCounter}`;

export const usePreviewStore = create<PreviewState>((set) => ({
  rpgGame: { ...defaultRPG },
  smartHome: { ...defaultSmartHome },
  ecommerce: { ...defaultECommerce },

  handleResult: (scenarioId, eventType, data, firedRuleIds) => {
    if (scenarioId === 'rpgGame') {
      set((s) => {
        const rpg = { ...s.rpgGame, lastEvent: eventType };
        switch (eventType) {
          case 'player.attack': {
            const dmg = Number(data.damage) || 0;
            if (dmg > 0) rpg.lastDamage = { value: dmg, id: uid() };
            break;
          }
          case 'player.damaged': {
            const hp = Number(data.hp) || rpg.playerHP;
            rpg.playerHP = Math.max(0, hp);
            break;
          }
          case 'player.died':
            rpg.isDead = true;
            rpg.playerHP = 0;
            break;
          case 'enemy.spawn':
            rpg.enemies = [...rpg.enemies.slice(-4), { id: uid(), name: String(data.name || 'Enemy'), type: String(data.type || 'normal') }];
            break;
          case 'item.pickup':
            rpg.lootItems = [...rpg.lootItems.slice(-5), { id: uid(), name: String(data.name || data.type || 'Item') }];
            break;
          case 'zone.enter':
            rpg.currentZone = String(data.zone || 'forest');
            break;
          case 'boss.defeated':
            rpg.showCelebration = true;
            rpg.enemies = [];
            setTimeout(() => set((s2) => ({ rpgGame: { ...s2.rpgGame, showCelebration: false } })), 3000);
            break;
        }
        if (rpg.lastDamage) {
          setTimeout(() => set((s2) => ({ rpgGame: { ...s2.rpgGame, lastDamage: null } })), 1500);
        }
        return { rpgGame: rpg };
      });
    }

    if (scenarioId === 'smartHome') {
      set((s) => {
        const sh = { ...s.smartHome, lightsOn: { ...s.smartHome.lightsOn }, lastEvent: eventType };
        switch (eventType) {
          case 'sensor.temperature':
            sh.temperature = Number(data.temp) || sh.temperature;
            if (firedRuleIds.includes('ac_auto_on')) sh.acOn = true;
            break;
          case 'sensor.motion': {
            const room = String(data.room || 'hallway');
            sh.motionRoom = room;
            if (firedRuleIds.length > 0) sh.lightsOn[room] = true;
            setTimeout(() => set((s2) => ({ smartHome: { ...s2.smartHome, motionRoom: null } })), 2000);
            break;
          }
          case 'sensor.door':
            sh.doorOpen = data.state === 'open';
            break;
          case 'schedule.trigger':
            if (data.schedule === 'morning') { sh.blindsOpen = true; sh.coffeeOn = true; }
            if (data.schedule === 'night') { sh.blindsOpen = false; sh.alarmActive = true; for (const r in sh.lightsOn) sh.lightsOn[r] = false; }
            break;
          case 'alarm.triggered':
            sh.alarmActive = true;
            break;
          case 'device.status':
            break;
          case 'energy.reading':
            if (firedRuleIds.includes('energy_saving')) { for (const r in sh.lightsOn) sh.lightsOn[r] = false; }
            break;
        }
        return { smartHome: sh };
      });
    }

    if (scenarioId === 'ecommerce') {
      set((s) => {
        const ec = { ...s.ecommerce, orders: [...s.ecommerce.orders], users: [...s.ecommerce.users], lastEvent: eventType };
        switch (eventType) {
          case 'order.created': {
            const total = Number(data.total) || 0;
            ec.orders = [...ec.orders.slice(-5), { id: `ORD-${uid()}`, total, status: 'pending', isVIP: total > 5000 }];
            break;
          }
          case 'order.cancelled':
            if (ec.orders.length > 0) ec.orders[ec.orders.length - 1] = { ...ec.orders[ec.orders.length - 1], status: 'cancelled' };
            break;
          case 'payment.received':
            if (ec.orders.length > 0) ec.orders[ec.orders.length - 1] = { ...ec.orders[ec.orders.length - 1], status: 'paid' };
            break;
          case 'stock.updated':
            ec.stockLevel = Math.max(0, Number(data.quantity) || ec.stockLevel);
            break;
          case 'user.registered':
            ec.users = [...ec.users.slice(-5), { id: uid(), email: String(data.email || 'user@example.com') }];
            break;
          case 'cart.abandoned':
            ec.cartAbandoned = true;
            setTimeout(() => set((s2) => ({ ecommerce: { ...s2.ecommerce, cartAbandoned: false } })), 3000);
            break;
          case 'review.submitted':
            ec.lastReview = { rating: Number(data.rating) || 5, id: uid() };
            setTimeout(() => set((s2) => ({ ecommerce: { ...s2.ecommerce, lastReview: null } })), 3000);
            break;
        }
        return { ecommerce: ec };
      });
    }
  },

  resetPreview: (scenarioId) => {
    set((s) => {
      if (scenarioId === 'rpgGame') return { rpgGame: { ...defaultRPG } };
      if (scenarioId === 'smartHome') return { smartHome: { ...defaultSmartHome, lightsOn: { ...defaultSmartHome.lightsOn } } };
      if (scenarioId === 'ecommerce') return { ecommerce: { ...defaultECommerce } };
      return s;
    });
  },
}));
