"use client"

import React, { useState } from "react"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: string
  loginId: string
  userName: string
  type: string
  amount: number
  currency: string
  method: string
  status: string
  createdAt: string
  timestamp: number
}

interface TransactionsTableProps {
  transactions: Transaction[]
}

export function TransactionsTable({ transactions: initialTransactions }: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const paginatedTransactions = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return initialTransactions.slice(start, start + itemsPerPage)
  }, [initialTransactions, currentPage])

  const totalPages = Math.ceil(initialTransactions.length / itemsPerPage)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400"
      case "pending":
        return "bg-amber-500/20 text-amber-400"
      case "failed":
        return "bg-rose-500/20 text-rose-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "Deposit" ? (
      <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-rose-400" />
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-blue-400">{transaction.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-white">{transaction.loginId}</p>
                      <p className="text-xs text-gray-400">{transaction.userName || "N/A"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(transaction.type)}
                      <span className="text-sm font-bold text-white">{transaction.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">
                      {transaction.type === "Deposit" ? "+" : "-"}${transaction.amount.toFixed(2)}{" "}
                      {transaction.currency}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-400">{transaction.method}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-400">
                      {new Date(transaction.timestamp * 1000).toLocaleString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, initialTransactions.length)} of{" "}
          {initialTransactions.length} transactions
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
