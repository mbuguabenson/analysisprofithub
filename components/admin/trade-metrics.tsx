"use client"

import React from "react"
import { BarChart3, TrendingUp, Zap, Target } from "lucide-react"

interface TradeMetricsProps {
  metrics: {
    totalTrades: number
    activeTrades: number
    winRate: string | number
    avgStake: string | number
    totalProfit: number
    totalLoss: number
  }
}

export function TradeMetrics({ metrics }: TradeMetricsProps) {
  const netProfit = metrics.totalProfit - metrics.totalLoss

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Trades */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-blue-500/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total Trades</p>
          <BarChart3 className="h-4 w-4 text-blue-400" />
        </div>
        <p className="text-2xl font-bold text-white">{metrics.totalTrades}</p>
        <p className="text-xs text-gray-500 mt-2">24h volume</p>
      </div>

      {/* Active Trades */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-amber-500/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Active Trades</p>
          <Zap className="h-4 w-4 text-amber-400" />
        </div>
        <p className="text-2xl font-bold text-white">{metrics.activeTrades}</p>
        <p className="text-xs text-gray-500 mt-2">open positions</p>
      </div>

      {/* Win Rate */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Win Rate</p>
          <Target className="h-4 w-4 text-emerald-400" />
        </div>
        <p className="text-2xl font-bold text-white">{metrics.winRate}%</p>
        <p className="text-xs text-gray-500 mt-2">success rate</p>
      </div>

      {/* Avg Stake */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Avg Stake</p>
          <TrendingUp className="h-4 w-4 text-purple-400" />
        </div>
        <p className="text-2xl font-bold text-white">${metrics.avgStake}</p>
        <p className="text-xs text-gray-500 mt-2">per trade</p>
      </div>

      {/* Net Profit/Loss */}
      <div
        className={`border rounded-lg p-4 transition-colors ${
          netProfit >= 0
            ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
            : "bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Net P&L</p>
          <TrendingUp
            className={`h-4 w-4 ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400 rotate-180"}`}
          />
        </div>
        <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {netProfit >= 0 ? "+" : "-"}${Math.abs(netProfit).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-2">total return</p>
      </div>
    </div>
  )
}
