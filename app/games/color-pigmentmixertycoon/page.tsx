"use client";

import React, { useReducer, useState, useMemo, useEffect } from 'react';
import { Factory, DollarSign, Gem, TrendingUp, Zap, ShoppingCart, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';

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

// --- 3. REDUCER & ACTIONS ---

type Action =
  | { type: 'BUY_PIGMENT', pigmentId: string, units: number, cost: number }
  | { type: 'TAKE_ORDER', order: IOrder }
  | { type: 'FULFILL_ORDER', cost: number, payment: number, quality: number, volume: number, usedPigments: IInventory }
  | { type: 'RESET_GAME' }
  | { type: 'SET_MESSAGE', message: string };

const gameReducer = (state: IAppState, action: Action): IAppState => {
  switch (action.type) {
    case 'BUY_PIGMENT':
      if (state.money < action.cost) {
        return { ...state, message: `Cannot afford ${action.units} units of ${action.pigmentId}. Need $${action.cost.toFixed(2)}.` };
      }
      return {
        ...state,
        money: state.money - action.cost,
        inventory: {
          ...state.inventory,
          [action.pigmentId]: (state.inventory[action.pigmentId] || 0) + action.units,
        },
        message: `Purchased ${action.units} units of ${PIGMENTS.find(p => p.id === action.pigmentId)?.name || action.pigmentId} for $${action.cost.toFixed(2)}.`
      };

    case 'TAKE_ORDER':
      return {
        ...state,
        currentOrder: action.order,
        message: `New Order: ${action.order.name} - ${action.order.requiredGrade} Grade! Time to mix.`
      };

    case 'FULFILL_ORDER': {
      let newReputation = state.reputation;
      let profit = action.payment - action.cost;
      let grade = action.quality; // quality is 0-100

      // Reputation change logic
      if (grade >= 90) newReputation = Math.min(100, newReputation + 5);
      else if (grade >= 75) newReputation = Math.min(100, newReputation + 2);
      else if (grade < 50) newReputation = Math.max(0, newReputation - 5);
      else if (grade < 70) newReputation = Math.max(0, newReputation - 2);

      // Deduct inventory
      const newInventory = { ...state.inventory };
      for (const id in action.usedPigments) {
        newInventory[id] -= action.usedPigments[id];
      }

      let message = `Order fulfilled (${action.volume.toFixed(1)} units). Quality: ${grade.toFixed(1)}%. `;
      message += `Cost: $${action.cost.toFixed(2)}, Paid: $${action.payment.toFixed(2)}. Profit: $${profit.toFixed(2)}. `;
      message += grade >= 70 ? 'Customer is satisfied!' : 'Customer is disappointed...';


      return {
        ...state,
        money: state.money + action.payment,
        reputation: newReputation,
        inventory: newInventory,
        currentOrder: null,
        message: message,
      };
    }

    case 'RESET_GAME':
      return INITIAL_STATE;

    case 'SET_MESSAGE':
      return { ...state, message: action.message };

    default:
      return state;
  }
};

// --- 4. GAME LOGIC IMPLEMENTATION ---

const generateNewOrder = (): IOrder => {
  const grades: OrderGrade[] = ['Student', 'Industrial', 'Artist'];
  const requiredGrade = grades[Math.floor(Math.random() * grades.length)];

  // Determine complexity and payout based on grade
  let requiredVolume = 5 + Math.floor(Math.random() * 10);
  let payoutMultiplier = 1.0;
  
  if (requiredGrade === 'Industrial') {
    requiredVolume += 10;
    payoutMultiplier = 1.5;
  } else if (requiredGrade === 'Artist') {
    requiredVolume -= 3; // Smaller, but high-value orders
    payoutMultiplier = 3.0;
  }

  // Generate a random, achievable color (usually from mixing 2-3 primaries)
  const primaries = [PIGMENTS.find(p => p.id === 'CR')!, PIGMENTS.find(p => p.id === 'CY')!, PIGMENTS.find(p => p.id === 'PB')!];
  
  const mixCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 pigments
  const mixComponents = [];
  let rSum = 0, gSum = 0, bSum = 0;
  
  for (let i = 0; i < mixCount; i++) {
    const pigment = primaries[Math.floor(Math.random() * primaries.length)];
    const [r, g, b] = hexToRgb(pigment.colorHex);
    rSum += r;
    gSum += g;
    bSum += b;
    mixComponents.push(pigment.name);
  }
  
  const avgR = rSum / mixCount;
  const avgG = gSum / mixCount;
  const avgB = bSum / mixCount;
  
  const targetHex = rgbToHex(avgR, avgG, avgB);
  const colorName = mixComponents.length > 1 ? mixComponents.join(' + ') : mixComponents[0];
  
  return {
    id: crypto.randomUUID(),
    name: `${colorName} Blend`,
    targetHex,
    requiredVolume,
    requiredGrade,
    basePayout: requiredVolume * 10 * payoutMultiplier,
  };
};

const getRequiredPurity = (grade: OrderGrade): number => {
  switch (grade) {
    case 'Student': return 1.1; // Easy, cheap pigments fine
    case 'Industrial': return 1.5; // Needs some quality materials
    case 'Artist': return 2.5; // Requires rare/expensive pigments for purity
    default: return 1.0;
  }
};

// --- 5. REACT COMPONENT ---

const App: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [mix, setMix] = useState<IMix>({}); // Current mix quantities
  
  // Lookup map for fast access
  const pigmentMap = useMemo(() => new Map(PIGMENTS.map(p => [p.id, p])), []);

  // --- Utility Hooks ---

  const totalMixedVolume = useMemo(() => 
    Object.values(mix).reduce((sum, amount) => sum + amount, 0), [mix]);

  const mixingCost = useMemo(() => {
    let cost = 0;
    for (const id in mix) {
      cost += mix[id] * (pigmentMap.get(id)?.costPerUnit || 0);
    }
    return cost;
  }, [mix, pigmentMap]);

  // --- Core Mixing Calculation ---
  const { mixedColorHex, colorDistance, pigmentPurityScore, finalQualityPercentage, requiredPurity } = useMemo(() => {
    if (!state.currentOrder || totalMixedVolume === 0) {
      return { mixedColorHex: '#4F46E5' as HexColor, colorDistance: 1000, pigmentPurityScore: 0, finalQualityPercentage: 0, requiredPurity: 0 };
    }

    const order = state.currentOrder;
    const totalVolume = totalMixedVolume;
    const targetRgb = hexToRgb(order.targetHex);
    const reqPurity = getRequiredPurity(order.requiredGrade);

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalPurity = 0;

    for (const id in mix) {
      const pigment = pigmentMap.get(id);
      if (pigment) {
        const amount = mix[id];
        const [r, g, b] = hexToRgb(pigment.colorHex);

        totalR += r * amount;
        totalG += g * amount;
        totalB += b * amount;
        totalPurity += pigment.purityMultiplier * amount;
      }
    }

    const avgR = totalR / totalVolume;
    const avgG = totalG / totalVolume;
    const avgB = totalB / totalVolume;
    const avgPurity = totalPurity / totalVolume;

    const mixedRgb: [number, number, number] = [avgR, avgG, avgB];
    const hex = rgbToHex(avgR, avgG, avgB);
    const distance = calculateColorDistance(mixedRgb, targetRgb);

    // Color Score (0-50 points): 50 points for distance 0, 0 points for distance 500+
    const colorScore = Math.max(0, 50 - (distance / 10)); 

    // Purity Score (0-50 points): Based on meeting the purity threshold
    let purityScore = Math.min(50, (avgPurity / reqPurity) * 50);

    // Final Quality Percentage (0-100)
    const quality = colorScore + purityScore;

    return { 
      mixedColorHex: hex, 
      colorDistance: distance, 
      pigmentPurityScore: avgPurity,
      finalQualityPercentage: quality,
      requiredPurity: reqPurity,
    };
  }, [state.currentOrder, mix, totalMixedVolume, pigmentMap]);

  // --- Handlers ---

  const handleBuyPigment = (pigment: IPigment) => {
    const units = 10;
    const cost = units * pigment.costPerUnit;
    dispatch({ type: 'BUY_PIGMENT', pigmentId: pigment.id, units, cost });
  };

  const handleTakeOrder = () => {
    if (state.currentOrder) {
      dispatch({ type: 'SET_MESSAGE', message: 'Finish the current order first!' });
      return;
    }
    const order = generateNewOrder();
    dispatch({ type: 'TAKE_ORDER', order });
    setMix({}); // Reset mixing station
  };

  const handleUpdateMix = (pigmentId: string, amount: number) => {
    const available = state.inventory[pigmentId] || 0;
    const newAmount = Math.max(0, Math.min(available, amount)); // Clamp between 0 and available

    setMix(prevMix => {
      const newMix = { ...prevMix };
      if (newAmount > 0) {
        newMix[pigmentId] = newAmount;
      } else {
        delete newMix[pigmentId];
      }
      return newMix;
    });
  };

  const handleFulfillOrder = () => {
    const order = state.currentOrder;
    if (!order) {
      dispatch({ type: 'SET_MESSAGE', message: 'No active order to fulfill.' });
      return;
    }

    if (totalMixedVolume < order.requiredVolume) {
      dispatch({ type: 'SET_MESSAGE', message: `Insufficient volume mixed! Need ${order.requiredVolume.toFixed(1)} units.` });
      return;
    }

    // Calculate payout based on quality (Max 1.2x base payout)
    let payoutMultiplier = 0;
    if (finalQualityPercentage >= 95) payoutMultiplier = 1.2;
    else if (finalQualityPercentage >= 70) payoutMultiplier = 1.0;
    else if (finalQualityPercentage >= 50) payoutMultiplier = 0.8;
    else payoutMultiplier = 0.5; // Failed delivery

    const payment = order.basePayout * payoutMultiplier;

    // Fulfill
    dispatch({
      type: 'FULFILL_ORDER',
      cost: mixingCost,
      payment: payment,
      quality: finalQualityPercentage,
      volume: totalMixedVolume,
      usedPigments: mix,
    });

    setMix({}); // Clear mixing station after fulfillment
  };

  // --- UI Components ---

  const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string, color: string }> = ({ icon, title, value, color }) => (
    <div className={`p-4 rounded-xl shadow-lg flex items-center bg-white ${color} transition-all duration-300`}>
      <div className={`p-3 rounded-full mr-4 bg-opacity-20 ${color.replace('bg-', 'text-')}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );

  const PigmentMarket: React.FC = () => (
    <div className="p-4 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
        <ShoppingCart className="w-5 h-5 mr-2 text-indigo-600" /> Pigment Market (Buy 10 Units)
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PIGMENTS.map(p => (
          <div
            key={p.id}
            className={`p-3 border rounded-lg text-center cursor-pointer transition-all hover:shadow-md ${p.costPerUnit > 5 ? 'bg-red-50/50 border-red-200' : 'bg-green-50/50 border-green-200'}`}
          >
            <div className="font-semibold text-sm mb-1">{p.name} ({p.id})</div>
            <div className="text-xs text-gray-600 mb-2">Purity: {p.purityMultiplier.toFixed(1)} | Cost: ${p.costPerUnit.toFixed(2)}</div>
            <div className="w-full h-4 rounded-full mb-2" style={{ backgroundColor: p.colorHex }}></div>
            <button
              onClick={() => handleBuyPigment(p)}
              className="w-full text-xs py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 transition"
              disabled={state.money < p.costPerUnit * 10}
            >
              Buy ($:{(p.costPerUnit * 10).toFixed(2)})
            </button>
            <div className="text-xs mt-1 font-medium text-gray-500">Stock: {state.inventory[p.id] || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const MixingStation: React.FC = () => {
    const order = state.currentOrder;
    const pigmentIdsInMix = Object.keys(state.inventory).filter(id => state.inventory[id] > 0);

    return (
      <div className="p-4 bg-white rounded-xl shadow-lg md:col-span-2">
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <Factory className="w-5 h-5 mr-2 text-indigo-600" /> Mixing Station
        </h2>

        {/* Current Mix Visual */}
        <div className="flex justify-between items-center mb-4 p-3 border rounded-lg bg-gray-50">
          <div className="text-sm font-medium text-gray-700">Mixed Paint Color:</div>
          <div className="w-16 h-8 rounded-full border-2 border-gray-300 shadow-inner" style={{ backgroundColor: mixedColorHex }}></div>
          <div className="text-sm font-medium text-gray-700">Volume: <span className="text-indigo-600 font-bold">{totalMixedVolume.toFixed(1)} / {order?.requiredVolume.toFixed(1) ?? 'N/A'}</span></div>
          <div className="text-sm font-medium text-gray-700">Cost: <span className="text-red-600 font-bold">${mixingCost.toFixed(2)}</span></div>
        </div>

        {/* Pigment Sliders */}
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {pigmentIdsInMix.map(id => {
            const pigment = pigmentMap.get(id)!;
            const available = state.inventory[id];
            const currentAmount = mix[id] || 0;

            return (
              <div key={id} className="flex items-center space-x-3">
                <div className="w-1/4">
                  <span className="font-semibold text-sm" style={{ color: pigment.colorHex }}>{pigment.name}</span>
                  <span className="text-xs text-gray-500 block">({pigment.rarity})</span>
                </div>
                <div className="w-3/4">
                  <input
                    type="range"
                    min="0"
                    max={available}
                    step="0.1"
                    value={currentAmount}
                    onChange={(e) => handleUpdateMix(id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer range-lg"
                    style={{ accentColor: pigment.colorHex }}
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Used: {currentAmount.toFixed(1)}</span>
                    <span>Available: {available.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fulfillment Button */}
        {order && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleFulfillOrder}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50"
              disabled={totalMixedVolume < order.requiredVolume || totalMixedVolume === 0}
            >
              Fulfill Order! (Mix Volume: {totalMixedVolume.toFixed(1)})
            </button>
            <p className="text-center text-xs mt-2 text-gray-500">
              {totalMixedVolume < order.requiredVolume ? 'Not enough volume mixed.' : `Ready to deliver: Total Cost $${mixingCost.toFixed(2)}`}
            </p>
          </div>
        )}
      </div>
    );
  };

  const OrderDetails: React.FC = () => {
    const order = state.currentOrder;
    const gradeColor = order?.requiredGrade === 'Artist' ? 'text-purple-600 bg-purple-100' : 
                       order?.requiredGrade === 'Industrial' ? 'text-yellow-600 bg-yellow-100' : 
                       'text-green-600 bg-green-100';

    return (
      <div className="p-4 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <Gem className="w-5 h-5 mr-2 text-indigo-600" /> Current Order
        </h2>

        {!order ? (
          <div className="text-center p-8 bg-indigo-50 rounded-lg">
            <p className="text-lg font-medium text-indigo-800 mb-4">No active order.</p>
            <button
              onClick={handleTakeOrder}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition flex items-center justify-center mx-auto"
            >
              <TrendingUp className="w-5 h-5 mr-2" /> Take New Order
            </button>
          </div>
        ) : (
          <div>
            <div className="space-y-3">
              <p className="text-lg font-bold">Target: {order.name}</p>
              <p className="flex items-center justify-between text-sm">
                <span className="font-medium">Required Grade:</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold ${gradeColor}`}>{order.requiredGrade}</span>
              </p>
              <p className="flex items-center justify-between text-sm">
                <span className="font-medium">Volume Needed:</span>
                <span className="font-bold text-indigo-600">{order.requiredVolume.toFixed(1)} units</span>
              </p>
              <p className="flex items-center justify-between text-sm">
                <span className="font-medium">Base Payout:</span>
                <span className="font-bold text-green-600">${order.basePayout.toFixed(2)}</span>
              </p>
            </div>
            
            <div className="mt-4 p-3 border rounded-lg flex items-center justify-center space-x-4">
              <div className="w-12 h-12 rounded-full border-4 border-gray-300" style={{ backgroundColor: order.targetHex }}></div>
              <p className="font-mono text-xs text-gray-700">Target Color: {order.targetHex}</p>
            </div>

            {/* Quality Metrics */}
            {totalMixedVolume > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <h3 className="font-semibold text-gray-700">Mixing Analysis:</h3>
                
                {/* Color Match */}
                <div className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Color Match Score (Max 50):</span>
                    <span className={`font-bold ${colorDistance < 50 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.max(0, 50 - (colorDistance / 10)).toFixed(1)} / 50
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, 50 - (colorDistance / 10)) * 2)}%` }}></div>
                  </div>
                </div>

                {/* Purity Score */}
                <div className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Pigment Purity ({requiredPurity.toFixed(1)} Req):</span>
                    <span className={`font-bold ${pigmentPurityScore >= requiredPurity ? 'text-green-600' : 'text-red-600'}`}>
                      {pigmentPurityScore.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (pigmentPurityScore / (requiredPurity + 1)) * 100)}%` }}></div>
                  </div>
                </div>

                {/* Final Quality */}
                <div className="text-sm pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Estimated Quality:</span>
                    <span className={`font-extrabold text-2xl ${finalQualityPercentage >= 70 ? 'text-green-700' : 'text-red-700'}`}>
                      {finalQualityPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(finalQualityPercentage >= 70 && requiredPurity <= pigmentPurityScore) ? 'Meets Minimum Quality standards.' : 'WARNING: Quality or Purity insufficient!'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-['Inter',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        
        {/* Title and Reset */}
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h1 className="text-3xl font-extrabold text-indigo-700 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-indigo-500" /> Pigment Mixer Tycoon
          </h1>
          <button
            onClick={() => dispatch({ type: 'RESET_GAME' })}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition flex items-center"
          >
            <RefreshCcw className="w-4 h-4 mr-1" /> Reset Game
          </button>
        </div>

        {/* Stats Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            title="Money"
            value={`$${state.money.toFixed(2)}`}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Reputation"
            value={`${state.reputation}%`}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Current Pigments"
            value={`${Object.values(state.inventory).reduce((a, b) => a + b, 0).toFixed(0)} units`}
            color="bg-indigo-100 text-indigo-600"
          />
        </div>
        
        {/* Message Banner */}
        <div className="p-3 mb-6 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 shadow-sm font-medium">
          {state.message}
        </div>

        {/* Main Grid: Market & Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PigmentMarket />
          </div>
          <OrderDetails />
        </div>

        {/* Mixing Station */}
        {state.currentOrder && (
          <MixingStation />
        )}
      </div>
    </div>
  );
};

export default App;