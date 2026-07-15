"use client"

import React, { useState } from "react"
import { ArrowUpDown, Eye } from "lucide-react"

interface User {
  loginId: string
  name: string
  type: "Real" | "Demo"
  balance: number
  status: string
  lastSeen?: string
}

interface UsersTableProps {
  users: User[]
}

type SortKey = "name" | "type" | "balance" | "status"

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortAsc, setSortAsc] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const sortedUsers = React.useMemo(() => {
    let sorted = [...initialUsers]
    sorted.sort((a, b) => {
      let aVal: any = a[sortKey]
      let bVal: any = b[sortKey]

      if (sortKey === "balance") {
        aVal = parseFloat(String(aVal)) || 0
        bVal = parseFloat(String(bVal)) || 0
      }

      if (aVal < bVal) return sortAsc ? -1 : 1
      if (aVal > bVal) return sortAsc ? 1 : -1
      return 0
    })
    return sorted
  }, [initialUsers, sortKey, sortAsc])

  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedUsers.slice(start, start + itemsPerPage)
  }, [sortedUsers, currentPage])

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
    setCurrentPage(1)
  }

  const SortableHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKeyVal)}
      className="flex items-center gap-2 font-bold text-white hover:text-blue-400 transition-colors"
    >
      {label}
      {sortKey === sortKeyVal && (
        <ArrowUpDown className={`h-4 w-4 ${sortAsc ? "" : "rotate-180"}`} />
      )}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <SortableHeader label="User ID" sortKeyVal="name" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <SortableHeader label="Type" sortKeyVal="type" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <SortableHeader label="Balance" sortKeyVal="balance" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <SortableHeader label="Status" sortKeyVal="status" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.map((user) => (
                <tr key={user.loginId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.loginId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        user.type === "Real"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {user.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">
                      ${parseFloat(String(user.balance)).toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-2 text-xs font-bold ${
                        user.status === "online"
                          ? "text-emerald-400"
                          : "text-gray-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.status === "online"
                            ? "bg-emerald-400"
                            : "bg-gray-600"
                        }`}
                      />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors text-xs font-bold">
                      <Eye className="h-4 w-4" />
                      View
                    </button>
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
          {Math.min(currentPage * itemsPerPage, sortedUsers.length)} of{" "}
          {sortedUsers.length} users
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
