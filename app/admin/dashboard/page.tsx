"use client"

import { useEffect, useState } from "react"
import { AdminStatsCard } from "@/components/admin/admin-stats-card"
import { AnalyticsChart } from "@/components/admin/analytics-chart"
import { TopTradersTable } from "@/components/admin/top-traders-table"
import { Users, TrendingUp, Wallet, BarChart3, RefreshCw } from "lucide-react"

interface DashboardData {
  totalUsers: number
  onlineUsers: number
  totalRealBalance: number
  totalDemoBalance: number
  totalTrades: number
  netPerformance: number
  totalVolume: number
  topTraders: any[]
  chartData: any[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/admin/overview")
        const dashboardData = await response.json()
        setData(dashboardData)
        setLastRefresh(new Date())
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
    const refreshInterval = setInterval(fetchDashboardData, 30000) // Auto-refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [])

  const handleManualRefresh = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/overview")
      const dashboardData = await response.json()
      setData(dashboardData)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("[v0] Error refreshing dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <p>Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 text-sm mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          label="Total Users"
          value={data.totalUsers}
          subValue={`${data.onlineUsers} online`}
          icon={Users}
          color="blue"
          trend={{
            value: 12,
            label: "vs last month",
            positive: true
          }}
        />
        <AdminStatsCard
          label="Total Balance"
          value={`$${(data.totalRealBalance + data.totalDemoBalance).toFixed(2)}`}
          subValue={`Real: $${data.totalRealBalance.toFixed(2)}`}
          icon={Wallet}
          color="green"
          trend={{
            value: 8,
            label: "growth",
            positive: true
          }}
        />
        <AdminStatsCard
          label="Active Trades"
          value={data.totalTrades}
          subValue="24h volume"
          icon={TrendingUp}
          color="purple"
          trend={{
            value: 24,
            label: "increase",
            positive: true
          }}
        />
        <AdminStatsCard
          label="Net Performance"
          value={`$${data.netPerformance.toFixed(2)}`}
          subValue={data.netPerformance > 0 ? "Profitable" : "Losses"}
          icon={BarChart3}
          color={data.netPerformance > 0 ? "green" : "red"}
          trend={{
            value: Math.abs(data.netPerformance / 100),
            label: data.netPerformance > 0 ? "profit" : "loss",
            positive: data.netPerformance > 0
          }}
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <AnalyticsChart data={data.chartData} />
        </div>

        {/* Top Traders */}
        <div className="lg:col-span-1">
          <TopTradersTable traders={data.topTraders} />
        </div>
      </div>
    </div>
  )
}
