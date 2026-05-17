import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface EarningsComparison {
  uber: number;
  lyft: number;
  libre: number;
}

export function EarningsCalculator() {
  const [weeklyRides, setWeeklyRides] = useState(40);
  const [avgFare, setAvgFare] = useState(25);

  // Fee structures
  const UBER_FEE = 0.25; // 25% platform fee
  const LYFT_FEE = 0.30; // 30% platform fee
  const LIBRE_FEE = 0.03; // 3% platform fee

  const weeklyRevenue = weeklyRides * avgFare;
  
  const comparison: EarningsComparison = {
    uber: weeklyRevenue * (1 - UBER_FEE),
    lyft: weeklyRevenue * (1 - LYFT_FEE),
    libre: weeklyRevenue * (1 - LIBRE_FEE),
  };

  const annualComparison = {
    uber: comparison.uber * 52,
    lyft: comparison.lyft * 52,
    libre: comparison.libre * 52,
  };

  const libreAdvantage = comparison.libre - comparison.uber;
  const annualAdvantage = annualComparison.libre - annualComparison.uber;

  return (
    <Card className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md border-white/20">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-400" />
          Earnings Calculator
        </h3>
        <p className="text-white/70">
          See how much more you could earn with Libre vs. traditional rideshare platforms.
        </p>
      </div>

      {/* Input Controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div>
          <Label htmlFor="rides" className="text-white/80">Weekly Rides</Label>
          <Input
            id="rides"
            type="number"
            min="1"
            max="200"
            value={weeklyRides}
            onChange={(e) => setWeeklyRides(Number(e.target.value))}
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>
        <div>
          <Label htmlFor="fare" className="text-white/80">Average Fare ($)</Label>
          <Input
            id="fare"
            type="number"
            min="5"
            max="100"
            value={avgFare}
            onChange={(e) => setAvgFare(Number(e.target.value))}
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="font-semibold">Uber</span>
            <span className="text-sm text-white/60">(75% driver take)</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">${comparison.uber.toFixed(2)}</div>
            <div className="text-sm text-white/60">/week</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <span className="font-semibold">Lyft</span>
            <span className="text-sm text-white/60">(70% driver take)</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">${comparison.lyft.toFixed(2)}</div>
            <div className="text-sm text-white/60">/week</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-green-500/20 border-2 border-green-400 rounded-xl relative">
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            BEST
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="font-semibold text-lg">Libre</span>
            <span className="text-sm text-white/60">(97% driver take)</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">${comparison.libre.toFixed(2)}</div>
            <div className="text-sm text-white/60">/week</div>
          </div>
        </div>
      </div>

      {/* Advantage Highlight */}
      <Card className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h4 className="font-bold text-lg">Your Advantage with Libre</h4>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-white/80">Weekly extra earnings:</span>
            <span className="font-bold text-green-400">+${libreAdvantage.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/80">Annual extra earnings:</span>
            <span className="font-bold text-green-400">+${annualAdvantage.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-white/80">That's like getting</span>
              <span className="font-bold text-xl text-green-400">
                {Math.round(libreAdvantage / avgFare)} extra rides
              </span>
            </div>
            <div className="text-sm text-white/60 mt-1">per week, for free!</div>
          </div>
        </div>
      </Card>

      {/* Annual Comparison */}
      <div className="mt-6 p-4 bg-black/30 rounded-xl">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Annual Earnings Comparison
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-400">${(annualComparison.uber / 1000).toFixed(1)}k</div>
            <div className="text-xs text-white/60 mt-1">Uber</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-400">${(annualComparison.lyft / 1000).toFixed(1)}k</div>
            <div className="text-xs text-white/60 mt-1">Lyft</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">${(annualComparison.libre / 1000).toFixed(1)}k</div>
            <div className="text-xs text-white/60 mt-1">Libre</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

