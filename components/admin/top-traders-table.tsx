"use client"

import React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface TopTradersTableProps {
  traders: Array<{
    loginId: string
    name: string
    type: string
    netPnl: number
    wins: number
    total: number
  }>
}

export function TopTradersTable({ traders }: TopTradersTableProps) {
  const getWinRate = (wins: number, total: number) => {
    return total === 0 ? 0 : ((wins / total) * 100).toFixed(1)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-6">Top Traders (by P&L)</h2>
      <div className="space-y-3">
        {traders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No traders data available</p>
        ) : (
          traders.map((trader, idx) => {
            const winRate = parseFloat(getWinRate(trader.wins, trader.total))
            const isProfit = trader.netPnl >= 0

            return (
              <div key={trader.loginId} className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors border border-white/5 hover:border-white/10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold flex-shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{trader.name}</p>
                    <p className="text-xs text-gray-400">ID: {trader.loginId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <p className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${Math.abs(trader.netPnl).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{winRate}% WR</p>
                  </div>
                  {isProfit ? (
                    <TrendingUp className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-gray-500 text-center">Based on last 1000 trades</p>
      </div>
    </div>
  )
}
