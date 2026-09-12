"use client"

import React, { useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Trade {
  id: string
  loginId: string
  market: string
  stake: number
  profitLoss: number
  status: string
  createdAt: string
  timestamp: number
}

interface TradesTableProps {
  trades: Trade[]
}

export function TradesTable({ trades: initialTrades }: TradesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const paginatedTrades = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return initialTrades.slice(start, start + itemsPerPage)
  }, [initialTrades, currentPage])

  const totalPages = Math.ceil(initialTrades.length / itemsPerPage)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "won":
        return "bg-emerald-500/20 text-emerald-400"
      case "lost":
        return "bg-rose-500/20 text-rose-400"
      case "open":
        return "bg-blue-500/20 text-blue-400"
      case "pending":
        return "bg-amber-500/20 text-amber-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Trade ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Stake
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedTrades.map((trade) => {
                const isProfit = trade.profitLoss >= 0
                return (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-blue-400">{trade.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{trade.loginId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-400">{trade.market}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">${trade.stake.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isProfit ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-rose-400" />
                        )}
                        <span
                          className={`text-sm font-bold ${
                            isProfit ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isProfit ? "+" : "-"}${Math.abs(trade.profitLoss).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          trade.status
                        )}`}
                      >
                        {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-400">
                        {new Date(trade.timestamp * 1000).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, initialTrades.length)} of{" "}
          {initialTrades.length} trades
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1))
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {page}
                </button>
              ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
