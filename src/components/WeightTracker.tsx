import React, { useState, useMemo } from 'react';
import { WeightEntry, UserPreferences } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Scale, TrendingDown, TrendingUp, Minus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface WeightTrackerProps {
  weights: WeightEntry[];
  preferences: UserPreferences;
  onLogWeight: (entry: Omit<WeightEntry, 'id'>) => void;
  onDeleteWeight: (id: string) => void;
  onUpdateUnit: (unit: 'kg' | 'lbs') => void;
}

const kgToLbs = (kg: number) => kg * 2.20462;
const lbsToKg = (lbs: number) => lbs / 2.20462;

export const WeightTracker: React.FC<WeightTrackerProps> = ({
  weights,
  preferences,
  onLogWeight,
  onDeleteWeight,
  onUpdateUnit
}) => {
  const [showAll, setShowAll] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));

  const unit = preferences.weightUnit;

  const sorted = useMemo(() => {
    return [...weights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weights]);

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const convert = (value: number) => unit === 'kg' ? value : kgToLbs(value);

  const latestDisplay = latest ? convert(latest.weight) : null;
  const previousDisplay = previous ? convert(previous.weight) : null;
  const change = latestDisplay && previousDisplay ? latestDisplay - previousDisplay : 0;

  const chartData = useMemo(() => {
    return sorted.map((entry, idx) => {
      const prev = sorted[idx - 1];
      const display = convert(entry.weight);
      const changeVal = prev ? display - convert(prev.weight) : 0;
      return {
        date: entry.date,
        shortDate: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: Number(display.toFixed(1)),
        change: Number(changeVal.toFixed(1))
      };
    });
  }, [sorted, unit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(weightInput);
    if (isNaN(value) || value <= 0) return;

    const kgValue = unit === 'kg' ? value : lbsToKg(value);
    onLogWeight({
      date: dateInput,
      weight: Number(kgValue.toFixed(2))
    });
    setWeightInput('');
  };

  const displayedTable = showAll ? sorted.slice().reverse() : sorted.slice().reverse().slice(0, 5);

  const getChangeIcon = (val: number) => {
    if (Math.abs(val) < 0.05) return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
    if (val < 0) return <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />;
    return <TrendingUp className="w-3.5 h-3.5 text-rose-500" />;
  };

  const getChangeText = (val: number) => {
    if (Math.abs(val) < 0.05) return 'No change';
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(1)} ${unit}`;
  };

  return (
    <div id="weight-tracker-card" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Daily Weight Tracker
          </h3>
          <p className="text-xs text-zinc-500">Log your weight and track daily gain/loss over time</p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
          <button
            onClick={() => onUpdateUnit('kg')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${unit === 'kg' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
          >
            KG
          </button>
          <button
            onClick={() => onUpdateUnit('lbs')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${unit === 'lbs' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
          >
            LBS
          </button>
        </div>
      </div>

      {/* Latest summary */}
      {latestDisplay !== null && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Latest Weight</p>
            <p className="text-2xl font-bold text-zinc-950 mt-1">
              {latestDisplay.toFixed(1)} <span className="text-sm text-zinc-400 font-medium">{unit}</span>
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(latest!.date).toLocaleDateString()}</p>
          </div>
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Change from last</p>
            <div className="flex items-center gap-1.5 mt-1">
              {getChangeIcon(change)}
              <p className={`text-2xl font-bold ${Math.abs(change) < 0.05 ? 'text-zinc-500' : change < 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {getChangeText(change)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add weight form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          required
          className="text-xs px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-700"
        />
        <div className="relative flex-1">
          <input
            type="number"
            step="0.1"
            min="1"
            placeholder={`Weight (${unit})`}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            required
            className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-700 pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold">{unit}</span>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Log
        </button>
      </form>

      {/* Weight chart */}
      {chartData.length > 1 ? (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="shortDate" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(value: number, name: string) => [`${value} ${unit}`, name === 'weight' ? 'Weight' : 'Change']}
              />
              {chartData.length > 1 && <ReferenceLine y={chartData[0].weight} stroke="#d4d4d8" strokeDasharray="4 4" />}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#18181b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#18181b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-100">
          <p className="text-xs text-zinc-400">Log at least 2 weights to see the graph</p>
        </div>
      )}

      {/* Weight history table */}
      {weights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">History</h4>
          <div className="overflow-hidden rounded-xl border border-zinc-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Date</th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Weight</th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Change</th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {displayedTable.map((entry, idx) => {
                  const display = convert(entry.weight);
                  const prev = sorted[sorted.length - 1 - displayedTable.length + idx + 1];
                  const changeVal = prev ? display - convert(prev.weight) : 0;
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50/50">
                      <td className="px-3 py-2.5 text-zinc-700 font-medium">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5 text-zinc-900 font-bold">{display.toFixed(1)} {unit}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          {getChangeIcon(changeVal)}
                          <span className={`font-medium ${Math.abs(changeVal) < 0.05 ? 'text-zinc-400' : changeVal < 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {Math.abs(changeVal) < 0.05 ? '-' : `${changeVal > 0 ? '+' : ''}${changeVal.toFixed(1)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => onDeleteWeight(entry.id)}
                          className="p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 py-1.5 transition-colors"
            >
              {showAll ? (
                <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Show all {sorted.length} entries <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
