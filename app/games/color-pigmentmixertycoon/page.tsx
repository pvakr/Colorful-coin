"use client";

import React, { useReducer, useState, useMemo, useEffect } from 'react';
import { Factory, DollarSign, Gem, TrendingUp, Zap, ShoppingCart, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import GameWrapper from "@/components/GameWrapper";

// --- 1. TYPE DEFINITIONS & INITIAL DATA ---

// Utility type for Hex color representation
type HexColor = `#${string}`;

interface IPigment {
  id: string;
  name: string;
  colorHex: HexColor;
  costPerUnit: number;
  // A higher purity multiplier indicates a more desired, high-fidelity pigment
  purityMultiplier: number; 
  rarity: 'Common' | 'Rare' | 'Masterpiece';
}

interface IInventory {
  [pigmentId: string]: number; // amount in units
}

type OrderGrade = 'Student' | 'Industrial' | 'Artist';

interface IOrder {
  id: string;
  name: string;
  targetHex: HexColor;
  requiredVolume: number; // Volume in gallons/units
  requiredGrade: OrderGrade;
  basePayout: number; // Base cash payout before quality adjustments
}

interface IMix {
  [pigmentId: string]: number; // units of pigment being mixed
}

interface IAppState {
  money: number;
  reputation: number; // 0 to 100
  inventory: IInventory;
  currentOrder: IOrder | null;
  message: string;
}

// Fixed pigment data based on historical/real-world cost relationship
const PIGMENTS: IPigment[] = [
  { id: 'CB', name: 'Carbon Black', colorHex: '#1E1E1E', costPerUnit: 0.5, purityMultiplier: 1.0, rarity: 'Common' },
  { id: 'ZW', name: 'Zinc White', colorHex: '#F5F5F5', costPerUnit: 0.8, purityMultiplier: 1.1, rarity: 'Common' },
  { id: 'YO', name: 'Yellow Ochre', colorHex: '#CC9966', costPerUnit: 0.6, purityMultiplier: 1.0, rarity: 'Common' },
  { id: 'PB', name: 'Phthalo Blue', colorHex: '#000080', costPerUnit: 1.2, purityMultiplier: 1.2, rarity: 'Common' },
  { id: 'CR', name: 'Cadmium Red', colorHex: '#E34234', costPerUnit: 12.0, purityMultiplier: 3.0, rarity: 'Rare' },
  { id: 'CY', name: 'Cadmium Yellow', colorHex: '#FFD700', costPerUnit: 8.0, purityMultiplier: 2.5, rarity: 'Rare' },
  { id: 'UL', name: 'Ultramarine (Lapis)', colorHex: '#120A8F', costPerUnit: 25.0, purityMultiplier: 5.0, rarity: 'Masterpiece' },
  { id: 'CT', name: 'Cobalt Teal', colorHex: '#008080', costPerUnit: 10.0, purityMultiplier: 3.5, rarity: 'Rare' },
];

const INITIAL_STATE: IAppState = {
  money: 500.00,
  reputation: 50,
  inventory: {
    'CB': 50,
    'ZW': 50,
    'YO': 50,
    'PB': 50,
    'CR': 0,
    'CY': 0,
    'UL': 0,
    'CT': 0,
  },
  currentOrder: null,
  message: 'Welcome to Pigment Mixer Tycoon! Buy some pigments and take your first order.',
};

// --- 2. GAME UTILITIES ---

/** Converts Hex color to RGB array [r, g, b] */
const hexToRgb = (hex: HexColor): [number, number, number] => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
};

/** Calculates the Euclidean distance between two RGB colors. Lower is better. */
const calculateColorDistance = (rgb1: [number, number, number], rgb2: [number, number, number]): number => {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
};

/** Converts RGB array to Hex color string. */
const rgbToHex = (r: number, g: number, b: number): HexColor => {
  const toHex = (c: number) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}` as HexColor;
};

/** Generates a random order */
const generateOrder = (reputation: number): IOrder => {
  const orderNames = ['Mona Lisa Restoration', 'Starry Night Commission', 'Large Blue Piece', 'Abstract #42', 'Portrait for Mayor'];
  const targetHex = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` as HexColor;
  
  let grade: OrderGrade = 'Student';
  if (reputation > 60) grade = 'Industrial';
  if (reputation > 85) grade = 'Artist';

  const basePayoutMap = { 'Student': 100, 'Industrial': 500, 'Artist': 2000 };

  return {
    id: Math.random().toString(36).substring(7),
    name: orderNames[Math.floor(Math.random() * orderNames.length)],
    targetHex,
    requiredVolume: Math.floor(Math.random() * 10) + 5,
    requiredGrade: grade,
    basePayout: basePayoutMap[grade],
  };
};

// --- 3. COMPONENT ---

export default function App() {
  const [state, dispatch] = useReducer((state: IAppState, action: { type: string; payload?: any }): IAppState => {
    switch (action.type) {
      case 'RESET_GAME':
        return INITIAL_STATE;
      case 'BUY_PIGMENT': {
        const { id, amount } = action.payload;
        const pigment = PIGMENTS.find(p => p.id === id)!;
        const cost = pigment.costPerUnit * amount;
        if (state.money < cost) return { ...state, message: `Not enough money to buy ${pigment.name}!` };
        return {
          ...state,
          money: state.money - cost,
          inventory: { ...state.inventory, [id]: state.inventory[id] + amount },
          message: `Bought ${amount} units of ${pigment.name}!`
        };
      }
      case 'TAKE_ORDER':
        return { ...state, currentOrder: action.payload, message: `Accepted order: ${action.payload.name}` };
      case 'MIX_PIGMENTS': {
        const { mix, targetHex } = action.payload;
        const order = state.currentOrder!;
        let totalCost = 0;
        let finalR = 0, finalG = 0, finalB = 0;
        let totalUnits = 0;

        Object.entries(mix).forEach(([id, units]) => {
          const u = units as number;
          if (u > 0) {
            const pigment = PIGMENTS.find(p => p.id === id)!;
            totalCost += pigment.costPerUnit * u;
            const [r, g, b] = hexToRgb(pigment.colorHex);
            finalR += r * u * pigment.purityMultiplier;
            finalG += g * u * pigment.purityMultiplier;
            finalB += b * u * pigment.purityMultiplier;
            totalUnits += u * pigment.purityMultiplier;
          }
        });

        const mixedHex = totalUnits > 0 ? rgbToHex(finalR / totalUnits, finalG / totalUnits, finalB / totalUnits) : '#000000';
        const targetRgb = hexToRgb(order.targetHex);
        const mixedRgb = hexToRgb(mixedHex);
        const distance = calculateColorDistance(targetRgb, mixedRgb);
        
        let qualityMultiplier = 1;
        let quality = 'Failed';
        if (distance < 15) { qualityMultiplier = 2.0; quality = 'Perfect'; }
        else if (distance < 30) { qualityMultiplier = 1.5; quality = 'Great'; }
        else if (distance < 60) { qualityMultiplier = 1.0; quality = 'Good'; }
        else if (distance < 100) { qualityMultiplier = 0.5; quality = 'Poor'; }

        const earnings = Math.floor(order.basePayout * qualityMultiplier - totalCost);
        const repGain = quality === 'Failed' ? 0 : (qualityMultiplier * 10);
        const newRep = Math.min(100, Math.max(0, state.reputation + repGain));

        // Deduct inventory
        const newInventory = { ...state.inventory };
        Object.entries(mix).forEach(([id, units]) => {
          const u = units as number;
          if (u > 0) newInventory[id] = Math.max(0, newInventory[id] - u);
        });

        return {
          ...state,
          money: state.money + earnings,
          reputation: newRep,
          inventory: newInventory,
          currentOrder: null,
          message: `Order complete! Quality: ${quality}. Earnings: $${earnings}.`,
        };
      }
      case 'SKIP_ORDER':
        return { ...state, currentOrder: null, message: 'Order skipped.' };
      default:
        return state;
    }
  }, INITIAL_STATE);

  const router = useRouter()
  const handleBack = () => router.push("/games");

  const handleTakeOrder = () => {
    const newOrder = generateOrder(state.reputation);
    dispatch({ type: 'TAKE_ORDER', payload: newOrder });
  };

  const stats = [
    { label: "Money", value: `$${state.money.toFixed(2)}`, icon: <DollarSign className="w-4 h-4" /> },
    { label: "Reputation", value: `${state.reputation}%`, icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <GameWrapper
      title="Pigment Mixer Tycoon"
      description="Mix colors, fulfill orders, and build your empire"
      stats={stats}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Message Banner */}
        <motion.div 
          className="p-4 mb-6 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/10 text-white shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="font-medium">{state.message}</span>
          </div>
        </motion.div>

        {/* Pigment Market */}
        <motion.div 
          className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Pigment Market
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PIGMENTS.map((pigment) => (
              <div key={pigment.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full border border-white/30" style={{ backgroundColor: pigment.colorHex }} />
                  <div>
                    <div className="font-semibold text-white text-sm">{pigment.name}</div>
                    <div className={`text-xs ${
                      pigment.rarity === 'Masterpiece' ? 'text-purple-400' :
                      pigment.rarity === 'Rare' ? 'text-yellow-400' : 'text-gray-400'
                    }`}>{pigment.rarity}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">${pigment.costPerUnit}/unit</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => dispatch({ type: 'BUY_PIGMENT', payload: { id: pigment.id, amount: 10 } })}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'BUY_PIGMENT', payload: { id: pigment.id, amount: 50 } })}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
                    >
                      +50
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Inventory */}
        <motion.div 
          className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Your Inventory
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PIGMENTS.map((pigment) => (
              <div key={pigment.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: pigment.colorHex }} />
                  <span className="text-white text-sm font-medium">{pigment.name}</span>
                </div>
                <div className="text-white/60 text-sm mt-1">{state.inventory[pigment.id]} units</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Order Section */}
        {!state.currentOrder ? (
          <motion.div 
            className="p-6 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Gem className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">New Orders Available</h2>
            <p className="text-white/70 mb-4">Accept an order to start mixing pigments and earning money!</p>
            <Button 
              onClick={handleTakeOrder}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-lg px-8 py-3"
            >
              Take New Order
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Current Order
            </h2>
            
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex-1">
                <div className="text-white/60 text-sm mb-1">Target Color</div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-16 h-16 rounded-xl border-2 border-white/30 shadow-lg"
                    style={{ backgroundColor: state.currentOrder.targetHex }}
                  />
                  <div>
                    <div className="text-white font-bold">{state.currentOrder.name}</div>
                    <div className="text-white/60 text-sm">{state.currentOrder.requiredGrade} Grade</div>
                    <div className="text-white/60 text-sm">Volume: {state.currentOrder.requiredVolume} units</div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-white/60 text-sm mb-1">Reward</div>
                <div className="text-3xl font-bold text-green-400">
                  ${state.currentOrder.basePayout}
                </div>
                <div className="text-white/60 text-sm">Base payout (can increase with quality)</div>
              </div>
            </div>

            <MixingStation currentOrder={state.currentOrder} dispatch={dispatch} inventory={state.inventory} />
          </motion.div>
        )}
      </div>
    </GameWrapper>
  );
}

// --- 4. MIXING STATION SUB-COMPONENT ---

function MixingStation({ currentOrder, dispatch, inventory }: { currentOrder: IOrder, dispatch: any, inventory: IInventory }) {
  const [mix, setMix] = useState<IMix>({});
  const [showPreview, setShowPreview] = useState(false);

  const handleMixChange = (id: string, value: string) => {
    setMix(prev => ({ ...prev, [id]: Math.max(0, parseInt(value) || 0) }));
  };

  const mixedHex = useMemo(() => {
    let totalR = 0, totalG = 0, totalB = 0, totalUnits = 0;
    
    Object.entries(mix).forEach(([id, units]) => {
      const u = units as number;
      if (u > 0) {
        const pigment = PIGMENTS.find(p => p.id === id)!;
        const [r, g, b] = hexToRgb(pigment.colorHex);
        totalR += r * u * pigment.purityMultiplier;
        totalG += g * u * pigment.purityMultiplier;
        totalB += b * u * pigment.purityMultiplier;
        totalUnits += u * pigment.purityMultiplier;
      }
    });

    return totalUnits > 0 ? rgbToHex(totalR / totalUnits, totalG / totalUnits, totalB / totalUnits) : '#000000';
  }, [mix]);

  const handleSubmit = () => {
    dispatch({ type: 'MIX_PIGMENTS', payload: { mix, targetHex: currentOrder.targetHex } });
    setMix({});
    setShowPreview(false);
  };

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Factory className="w-4 h-4" />
        Mixing Station
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {PIGMENTS.map((pigment) => (
          <div key={pigment.id} className="flex flex-col">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pigment.colorHex }} />
              <span className="text-white/70 text-xs truncate">{pigment.name}</span>
            </div>
            <input
              type="number"
              min="0"
              max={inventory[pigment.id]}
              value={mix[pigment.id] || ''}
              onChange={(e) => handleMixChange(pigment.id, e.target.value)}
              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              placeholder="0"
            />
            <span className="text-white/40 text-xs">Avail: {inventory[pigment.id]}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-white/60 text-sm">Preview:</div>
          <div 
            className="w-12 h-12 rounded-lg border-2 border-white/30 shadow-lg"
            style={{ backgroundColor: mixedHex }}
          />
          <div className="text-white/40 text-xs font-mono">{mixedHex}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors"
          >
            Preview
          </button>
          <button
            onClick={() => setMix({})}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1 bg-green-500 hover:bg-green-600 rounded text-sm text-white transition-colors"
          >
            Submit Mix
          </button>
        </div>
      </div>
    </div>
  );
}
