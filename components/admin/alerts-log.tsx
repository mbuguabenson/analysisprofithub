"use client"

import React, { useState } from "react"
import { AlertCircle, Info, AlertTriangle, X } from "lucide-react"

interface Alert {
  id: string
  level: "info" | "warning" | "error"
  service: string
  message: string
  timestamp: number
}

interface AlertsLogProps {
  alerts: Alert[]
}

export function AlertsLog({ alerts: initialAlerts }: AlertsLogProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [filterLevel, setFilterLevel] = useState<"all" | "info" | "warning" | "error">("all")

  const filteredAlerts = initialAlerts.filter(alert => {
    if (dismissedAlerts.has(alert.id)) return false
    if (filterLevel === "all") return true
    return alert.level === filterLevel
  })

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]))
  }

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "info":
        return <Info className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case "info":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30"
      case "warning":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30"
      case "error":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30"
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30"
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = Math.floor((now - timestamp) / 1000)

    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <h2 className="text-lg font-bold text-white">System Alerts & Events</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-400 focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="flex items-center justify-center py-12 px-6 text-gray-400">
            <p className="text-sm">No alerts to display</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors border-l-4 ${getAlertColor(
                alert.level
              )}`}
            >
              <div className="mt-1 flex-shrink-0">
                {getAlertIcon(alert.level)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-300 uppercase">
                    {alert.service}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    alert.level === "info"
                      ? "text-blue-400"
                      : alert.level === "warning"
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}>
                    {alert.level}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(alert.timestamp)}
                </p>
              </div>

              <button
                onClick={() => dismissAlert(alert.id)}
                className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-3 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
        <span>Total: {initialAlerts.length} events</span>
        <span className="text-gray-600">
          Dismissed: {dismissedAlerts.size}
        </span>
      </div>
    </div>
  )
}
