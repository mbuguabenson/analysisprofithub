"use client"

import React from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface SystemStatusProps {
  status: {
    apiConnection: string
    database: string
    authService: string
    websocket: string
    messageQueue: string
    uptime: string
  }
}

export function SystemStatus({ status }: SystemStatusProps) {
  const services = [
    { name: "API Connection", key: "apiConnection" },
    { name: "Database", key: "database" },
    { name: "Auth Service", key: "authService" },
    { name: "WebSocket", key: "websocket" },
    { name: "Message Queue", key: "messageQueue" }
  ]

  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus.toLowerCase()) {
      case "operational":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      case "degraded":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30"
      case "offline":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30"
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30"
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-6">Service Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {services.map((service) => {
          const serviceStatus = status[service.key as keyof typeof status]
          const colors = getStatusColor(serviceStatus)
          const isOperational = serviceStatus.toLowerCase() === "operational"

          return (
            <div
              key={service.key}
              className={`p-4 rounded-lg border flex flex-col gap-3 ${colors}`}
            >
              <div className="flex items-center gap-2">
                {isOperational ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <p className="text-sm font-bold">{service.name}</p>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold">
                {serviceStatus}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
