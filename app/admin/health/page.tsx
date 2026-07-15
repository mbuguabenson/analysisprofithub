"use client"

import { useEffect, useState } from "react"
import { SystemStatus } from "@/components/admin/system-status"
import { AlertsLog } from "@/components/admin/alerts-log"
import { RefreshCw, Activity } from "lucide-react"

export default function AdminHealthPage() {
  const [systemStatus, setSystemStatus] = useState({
    apiConnection: "operational",
    database: "operational",
    authService: "operational",
    websocket: "operational",
    messageQueue: "operational",
    uptime: "99.95%"
  })

  const [alerts, setAlerts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        // Simulate health check - in production this would call /api/admin/system/health
        setAlerts([
          {
            id: "alert-1",
            level: "info",
            service: "API",
            message: "Database backup completed successfully",
            timestamp: Date.now() - 300000 // 5 minutes ago
          },
          {
            id: "alert-2",
            level: "warning",
            service: "WebSocket",
            message: "High memory usage detected: 78% utilized",
            timestamp: Date.now() - 600000 // 10 minutes ago
          },
          {
            id: "alert-3",
            level: "info",
            service: "Auth",
            message: "SSL certificate will expire in 45 days",
            timestamp: Date.now() - 900000 // 15 minutes ago
          },
          {
            id: "alert-4",
            level: "info",
            service: "Database",
            message: "Scheduled maintenance window: 02:00 - 03:00 UTC",
            timestamp: Date.now() - 1200000 // 20 minutes ago
          },
        ])
      } catch (error) {
        console.error("[v0] Error fetching system health:", error)
      }
    }

    fetchHealth()
  }, [])

  const handleManualCheck = async () => {
    setIsLoading(true)
    try {
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSystemStatus(prev => ({
        ...prev,
        uptime: (parseFloat(prev.uptime) + 0.01).toFixed(2) + "%"
      }))
    } catch (error) {
      console.error("[v0] Error during health check:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Health & Status</h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor system performance and receive real-time alerts
          </p>
        </div>
        <button
          onClick={handleManualCheck}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Check Now
        </button>
      </div>

      {/* System Status */}
      <SystemStatus status={systemStatus} />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Uptime</p>
          <p className="text-2xl font-bold text-emerald-400">{systemStatus.uptime}</p>
          <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Response Time</p>
          <p className="text-2xl font-bold text-blue-400">142ms</p>
          <p className="text-xs text-gray-500 mt-2">average</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Active Connections</p>
          <p className="text-2xl font-bold text-purple-400">2,847</p>
          <p className="text-xs text-gray-500 mt-2">real-time</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Alerts Today</p>
          <p className="text-2xl font-bold text-amber-400">{alerts.length}</p>
          <p className="text-xs text-gray-500 mt-2">last 24 hours</p>
        </div>
      </div>

      {/* Alerts Log */}
      <AlertsLog alerts={alerts} />

      {/* Critical Services */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Critical Services</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-sm font-bold text-white">Payment Gateway</p>
              <p className="text-xs text-gray-400">Stripe integration</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-emerald-400">Healthy</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-sm font-bold text-white">Database Cluster</p>
              <p className="text-xs text-gray-400">PostgreSQL primary + 2 replicas</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-emerald-400">Healthy</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-sm font-bold text-white">Message Queue</p>
              <p className="text-xs text-gray-400">Redis queue with 2 workers</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-emerald-400">Healthy</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-sm font-bold text-white">API Rate Limiter</p>
              <p className="text-xs text-gray-400">Upstash Redis</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-emerald-400">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
